import { Router } from 'express';
import path from 'path';
import fs from 'fs-extra';
import multer from 'multer';
import { processUploadedFiles } from '../utils/fileMerger.js';
import generatePDF from '../utils/generatePDF.js';
import uploadLimiter from '../utils/rateLimiter.js';
import createLogger from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { TIER_CONFIG } from '../config/tiers.js';
import AppError from '../utils/appError.js';
import { UserModel, type Subscription_Period } from '../schema/UsersSchema.js';
import { sendEmailAlert } from '../utils/sendEmail.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const log = createLogger('Merge route');
export const mergerRoute: Router = Router();
const projectRoot = path.resolve(__dirname, '../../');
const mergerBaseDir = path.join(projectRoot, 'output/file-merger-temps');
const uploadDir = path.join(mergerBaseDir, 'uploads');
const outputDir = path.join(mergerBaseDir, 'outputs');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });
const storage = multer.diskStorage({
    destination: async (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const safeName = path.basename(file.originalname);
        cb(null, `${Date.now()}-${safeName}`);
    },
});
const upload = multer({ storage });
mergerRoute.post(
    '/merge-files',
    uploadLimiter,
    upload.array('files'),
    async (req, res, next) => {
        try {
            const tierId = req.query.tierId as keyof typeof TIER_CONFIG;

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
            const EXPIRED = await sendEmailAlert(req);
            if (EXPIRED) {
                return res.status(503).json({ expired: true });
            }

            const folderName = req.body.folderName;
            if (!folderName) {
                return res.status(400).json({ error: 'Folder is required' });
            }

            console.log('[DEBUG] folder exists?', fs.existsSync(uploadDir));
            const mergedQuestions = await processUploadedFiles(uploadDir);
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
            //creates the folder if missing
            const outputFile = path.join(outputDir, `merged-${Date.now()}.pdf`);

            await generatePDF(mergedQuestions, outputFile, isWorkSheet);
            log.warn('The pdf generator is done');
            // Build absolute download URL so frontend (different origin) can access it
            const host = req.get('host') || 'localhost:5000';
            const protocol = req.protocol || 'http';
            const downloadURL = `${protocol}://${host}/api/download-merged/${path.basename(outputFile)}`;
            log.highlight(
                `Done generating the pdf and sent ${downloadURL} to front end`
            );
            res.json({
                success: true,
                downloadURL,
            });
        } catch (error) {
            console.error('Merge route error', error);
            res.status(500).json({ error: 'Failed to merge files' });
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
