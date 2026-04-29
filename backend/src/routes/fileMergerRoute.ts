import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs-extra';
import multer from 'multer';
import { fileURLToPath } from 'url';

import { isUserDocument } from '../helpers/miniHelpers.js';
import uploadLimiter from '../utils/rateLimiter.js';
import createLogger from '../utils/logger.js';
//import { TIER_CONFIG } from '../config/tiers.js';
import AppError from '../utils/appError.js';
//import { ConnectionCheckedOutEvent } from 'mongodb';
import checkDailyLimit from '../middleware/limitCheck.js';
import { UserModel } from '../schema/UsersSchema.js';
import type { AuthenticatedRequest } from '../Types/authenticate.js';
import authenticate from '../middleware/authenticate.js';
import { processPdfsNative } from '../utils/GeminiPdfMerger.js';
import { convertHtmlToPdf } from '../utils/html-pdf.js';
import { countPdfPagesFromPaths } from '../utils/pdfPageCounter.js';
import { mergerChargeAmountKes } from '../constants/mergerPricing.js';
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
    checkDailyLimit(),
    async (req, res, next) => {
        const sessionPath = req.sessionPath;
        try {
            //const tierId = req.query.tierId as keyof typeof TIER_CONFIG;

            //const userEmail = authReq?.user?.email;

            const authReq = req as AuthenticatedRequest;

            // Replace findOne({ email: ... }) with findById
            if (!authReq.user) {
                return next(AppError.unauthorized('Not authenticated'));
            }

            // TYPE SAFE EXTRACTION:
            // If it's a Document, use ._id. If it's a Payload, use .uid.
            const userId = isUserDocument(authReq.user)
                ? authReq.user._id.toString()
                : authReq.user.uid;

            // Now you can proceed safely
            const user = isUserDocument(authReq.user)
                ? authReq.user
                : await UserModel.findById(userId);

            if (!user) return next(AppError.notFound('User not found'));

            const isWorkSheet = req.query.isWorkSheet === 'true';
            //const CAN_MERGE = TIER_CONFIG[tierId].canMerge;

            /*const subscriptionStatus = await sendEmailAlert(req);
            log.highlight('This is the subscription status', {
                data: { subscriptionStatus },
            });
            if (subscriptionStatus?.expired) {
                return res.status(403).json({
                    type: 'SUBSCRIPTION_EXPIRED',
                    message: 'Your subscription has expired',
                });
            }*/

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
            //convert directory path into an array of file paths to satisfy the new style
            const filesInFolder = fs
                .readdirSync(sessionPath)
                .map((file) => path.join(sessionPath, file))
                .filter((filePath) => fs.statSync(filePath).isFile());
            const pdfFilesInFolder = filesInFolder.filter((filePath) =>
                filePath.toLowerCase().endsWith('.pdf')
            );
            const pageCount =
                pdfFilesInFolder.length > 0
                    ? await countPdfPagesFromPaths(pdfFilesInFolder)
                    : 0;
            const chargeAmount = mergerChargeAmountKes(pageCount);
            //const mergedQuestions = await processUploadedFiles(sessionPath);
            const mergedQuestions = await processPdfsNative(filesInFolder);
            if (!mergedQuestions || mergedQuestions.uniqueCount === 0) {
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
            const outputFile = path.join(
                outputDir,
                `${safeFolderName}-tidyup-summary.pdf`
            );

            await convertHtmlToPdf(
                mergedQuestions.html,
                outputFile,
                isWorkSheet,
                folderName
            );
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
                billing: {
                    pageCount,
                    ratePerPageKes: 2.5,
                    amountKes: chargeAmount,
                },
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
