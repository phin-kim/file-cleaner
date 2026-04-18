import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs-extra';
import multer from 'multer';
import { fileURLToPath } from 'url';

import { processUploadedFiles } from '../utils/fileMerger.js';
import generatePDF from '../utils/generatePDF.js';
import uploadLimiter from '../utils/rateLimiter.js';
import createLogger from '../utils/logger.js';
import { TIER_CONFIG } from '../config/tiers.js';
import AppError from '../utils/appError.js';
import { sendEmailAlert } from '../utils/sendEmail.js';
import checkDailyLimit from '../middleware/limitCheck.js';
import { UserModel } from '../schema/UsersSchema.js';
import type { AuthenticatedRequest } from '../Types/authenticate.js';
import authenticate from '../middleware/authenticate.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const log = createLogger('Merge route');
export const mergerRoute: Router = Router();
const projectRoot = path.resolve(__dirname, '../../');
const mergerBaseDir = path.join(projectRoot, 'output/file-merger-temps');
//const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const uploadDir = path.join(mergerBaseDir, `uploads`);
const outputDir = path.join(mergerBaseDir, 'outputs');

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });
/**
 * i ran into an issue where upload number 1 collides with files uploaded from upload number 2
 * ##SOLUTION
 * have a subfolders for each session with a unique session id that allows each upload to be independent of each other
 */
const initSession = (req: Request, _res: Response, next: NextFunction) => {
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    req.sessionPath = path.join(mergerBaseDir, 'uploads', sessionId);
    next();
};
const storage = multer.diskStorage({
    destination: async (req, _file, cb) => {
        try {
            // Use the path already created by initSession
            const sessionPath = req.sessionPath!;
            await fs.ensureDir(sessionPath);
            cb(null, sessionPath);
        } catch (err) {
            cb(err instanceof Error ? err : new Error(String(err)), '');
        }
    },
    filename: (_req, file, cb) => {
        const safeName = path.basename(file.originalname);
        cb(null, `${Date.now()}-${safeName}`);
    },
});
const upload = multer({ storage });
mergerRoute.post(
    '/merge-files',
    authenticate,

    uploadLimiter,
    initSession,
    upload.array('files'),
    checkDailyLimit,
    async (req, res, next) => {
        const sessionPath = req.sessionPath;
        try {
            const tierId = req.query.tierId as keyof typeof TIER_CONFIG;
            const authReq = req as AuthenticatedRequest;
            const userEmail = authReq?.user?.email;

            const isWorkSheet = req.query.isWorkSheet === 'true';
            const CAN_MERGE = TIER_CONFIG[tierId].canMerge;
            if (!CAN_MERGE) {
                return next(
                    new AppError(
                        'This feature is unavailable in your current subscription plan',
                        503,
                        'ServiceUnavailable'
                    )
                );
            }
            const user = await UserModel.findOne({ email: userEmail });
            if (!user) {
                return next(AppError.notFound('User not found'));
            }
            const subscriptionStatus = await sendEmailAlert(req);
            log.highlight('This is the subscription status', {
                data: { subscriptionStatus },
            });
            if (subscriptionStatus?.expired) {
                return res.status(403).json({
                    type: 'SUBSCRIPTION_EXPIRED',
                    message: 'Your subscription has expired',
                });
            }

            const folderName = req.body.folderName;
            if (!folderName) {
                return res.status(400).json({ error: 'Folder is required' });
            }

            console.log('[DEBUG] folder exists?', fs.existsSync(uploadDir));
            if (!sessionPath) {
                return next(
                    new AppError(
                        'Upload directory could not be initialized',
                        500
                    )
                );
            }
            const mergedQuestions = await processUploadedFiles(sessionPath);

            if (!mergedQuestions || mergedQuestions.length === 0) {
                return res.status(200).json({
                    success: true,
                    stats: {
                        inputQuestions: 0,
                        outputQuestions: 0,
                        duplicatesRemoved: 0,
                    },
                    downloadURL: null,
                });
            }
            const safeFolderName = folderName.replace(/[^a-z0-9_-]/gi, '_');

            //creates the folder if missing
            const outputFile = path.join(outputDir, `${safeFolderName}.pdf`);

            await generatePDF(mergedQuestions, outputFile, isWorkSheet);
            log.warn('The pdf generator is done');

            // Build absolute download URL so frontend (different origin) can access it
            const host = req.get('host') || 'localhost:5000';
            const protocol = req.protocol || 'http';
            const downloadURL = `${protocol}://${host}/api/download-merged/${path.basename(outputFile)}`;
            log.highlight(
                `Done generating the pdf and sent ${downloadURL} to front end`
            );
            user.dailyUsageCount += 1;
            user.lastUsageDate = new Date();
            await user?.save();
            res.json({
                success: true,
                downloadURL,
            });
        } catch (error) {
            console.error('Merge route error', error);
            res.status(500).json({ error: 'Failed to merge files' });
        } finally {
            //cleanup only this sessions files
            if (sessionPath && fs.existsSync(sessionPath)) {
                try {
                    await fs.remove(sessionPath);
                    log.debug(
                        `[CLEANUP] Removed isolated session folder: ${sessionPath}`
                    );
                } catch (error) {
                    log.error('Cleanup failed', {
                        data: {
                            error:
                                error instanceof Error
                                    ? error.message
                                    : String(error),
                        },
                    });
                }
            }
        }
    }
);
mergerRoute.get('/download-merged/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        //adjust filename to where merged pdf's are stored
        const filePath = path.join(outputDir, filename);
        log.debug(`[DOWNLOAD] looking for file at :${filePath} `);
        log.debug(`[DOWNLOAD] file exists? ${fs.exists(filePath)}`);
        const files = fs.readdir(outputDir);
        log.debug('Files in the output folder', { data: { files } });

        //force download
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Error sending merged pdf', err);
            } else {
                console.log(`[BACKEND] sent merged PDF:${filename}`);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to download merged PDF' });
    }
});
