import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { tidyFolder } from '../utils/tidy.js';
import createLogger from '../utils/logger.js';

import createZipWithRetry from '../helpers/zipFolderRetry.js';
import AppError from '../utils/appError.js';
const log = createLogger('Folder-Cleaner');
export const cleanerRoute = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const folderCleanerBaseDir = path.join(
    projectRoot,
    'output/folder-cleaner-temps'
);
const uploadDir = path.join(folderCleanerBaseDir, 'uploads');
const outputDir = path.join(folderCleanerBaseDir, 'outputs');
/**NB: mkdirSync runs synchronously at server startup but when the server is running and the dir is deleted it will cause the enoent error */
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });
const storage = multer.diskStorage({
    destination: async (_require, _file, cb) => {
        try {
            //ensure directory exists before each write
            await fs.ensureDir(uploadDir);
            cb(null, uploadDir);
        } catch (error) {
            cb(
                new AppError(
                    `Failed to create upload directory`,
                    500,
                    'UploadDirError'
                ),
                ''
            );
        }
    },
});
const upload = multer({
    storage: storage,
    limits: { fieldSize: 200 * 1024 * 1024 },
}); //temporary storage with a limit of 200 mb

cleanerRoute.post('/processFolder', upload.array('files'), async (req, res) => {
    log.highlight(
        `🟢 [BACKEND] request received at: ${new Date().toISOString()}`
    );
    try {
        const uploadedFiles = req.files as Express.Multer.File[];
        const uploadedFolderName = req.body.folderName; //fallback
        const safeFolderName = uploadedFolderName.replace(/[^a-z0-9_-]/gi, '_');

        log.info(`[BACKEND] ${uploadedFiles.length} files received`);
        if (!uploadedFiles || uploadedFiles.length === 0) {
            log.warn('⚠ [BACKEND] no files received ');
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const temporaryBaseDir = path.join(
            folderCleanerBaseDir,
            'folder-cleaner-temp-storage'
        );
        const tempDir = path.join(temporaryBaseDir, Date.now().toString());

        await fs.ensureDir(tempDir);
        log.info(`[BACKEND] temp folder created at ${tempDir}`);
        // Is equivalent to this native fs code:
        //await fs.mkdir('output/temp/1234567890', { recursive: true });
        // move uploaded files to temp dir and in case of failure they are deleted
        try {
            for (const file of uploadedFiles) {
                const destPath = path.join(tempDir, file.originalname);
                await fs.move(file.path, destPath);
                log.info(`[BACKEND] moved ${file.originalname} to temp`);
            }
        } finally {
            for (const file of uploadedFiles) {
                if (await fs.pathExists(file.path)) {
                    await fs.remove(file.path);
                    log.warn(`[CLEANUP] removed orphan upload ${file.path}`);
                }
            }
        }
        //remove duplicate files based on hash
        log.highlight('[BACKEND] starting duplicate removal...');
        const tidyStart = Date.now();
        const stats = await tidyFolder(tempDir);
        log.info(
            `[BACKEND] duplicate removal done in ${Date.now() - tidyStart} ms`
        );
        const zippedDir = path.join(outputDir, 'zipped');
        const zipStart = Date.now();

        try {
            const zipPath = await createZipWithRetry(
                tempDir,
                zippedDir,
                safeFolderName,
                3,
                1000
            );

            log.info(`Zip created successfully at :${zipPath}`);
            log.info(`[BACKEND]zipping done in ${Date.now() - zipStart} ms`);

            log.info(`Ensured zipped directory at :${zippedDir}`);

            log.highlight(`[BACKEND] Zipping folder`);

            // Build absolute download URL so frontend (different origin) can access it
            const host = req.get('host') || 'tidy-up.onrender.com';
            const protocol =
                process.env.NODE_ENV === 'production'
                    ? 'https'
                    : (req.protocol ?? 'http');
            const downloadURL = `${protocol}://${host}/api/download/${path.basename(zipPath)}`;

            //cleanup
            // return zip download link
            res.json({
                downloadURL,
                stats: {
                    originalFiles: uploadedFiles.length,
                    finalFiles: stats.finalFiles.length,
                    duplicatesRemoved: stats.duplicatesRemoved,
                    spaceSaved: stats.spaceSaved,
                },
            });
        } catch (error) {
            log.error(`[BACKEND] All zipping attempts failed:`, {
                data: { error },
            });

            // Handle the complete failure - maybe return the cleaned folder without zip
            res.json({
                success: true,
                cleaned: true,
                zipped: false,
                message:
                    'Folder cleaned but zip creation failed after multiple attempts',
                stats: {
                    originalFiles: uploadedFiles.length,
                    finalFiles: stats.finalFiles.length,
                    duplicatesRemoved: stats.duplicatesRemoved,
                    spaceSaved: stats.spaceSaved,
                },
            });
        }
    } catch (error) {
        log.error('Failed to process folder', { data: { error } });
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                error: error.message,
                type: error.type,
            });
        }
        res.status(500).json({ error: 'Failed to process folder' });
    }
});
cleanerRoute.get('/download/:filename', (req, res) => {
    try {
        log.highlight(
            `⬇️ [BACKEND] Download requested for ${req.params.filename}`
        );
        const zipPath = path.join(outputDir, 'zipped', req.params.filename);
        if (!fs.existsSync(zipPath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        //force download
        res.download(zipPath, (err) => {
            if (err) {
                log.error('Error sending file', { data: { err } });
            } else {
                log.highlight(`[BACKEND] sent file ${zipPath}`);
            }
        });
    } catch (error) {
        log.error('Error downloading the files', { data: { error } });
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                error: error.message,
                type: error.type,
            });
        }
        res.status(500).json({ error: 'Failed to download' });
    }
});
