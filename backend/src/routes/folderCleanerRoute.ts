import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { tidyFolder } from '../utils/tidy.js';
import createLogger from '../utils/logger.js';
import type { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import createZipWithRetry from '../helpers/zipFolderRetry.js';
import AppError from '../utils/appError.js';
import asyncHandler from '../middleware/asyncHandler.js';

const log = createLogger('Folder-Cleaner');
export const cleanerRoute = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
//MIDDLEWARE

type UploadError =
    | { type: 'ENOENT'; error: Error & { code: 'ENOENT'; path?: string } }
    | { type: 'APP_ERROR'; error: AppError }
    | { type: 'MULTER_ERROR'; error: MulterError }
    | { type: 'STANDARD_ERROR'; error: Error }
    | { type: 'UNKNOWN'; error: unknown };

const classifyError = (err: unknown): UploadError => {
    if (err instanceof AppError) {
        return { type: 'APP_ERROR', error: err };
    }

    if (err instanceof MulterError) {
        return { type: 'MULTER_ERROR', error: err };
    }

    if (err instanceof Error) {
        if ('code' in err && (err as any).code === 'ENOENT') {
            return {
                type: 'ENOENT',
                error: err as Error & { code: 'ENOENT'; path?: string },
            };
        }
        return { type: 'STANDARD_ERROR', error: err };
    }

    return { type: 'UNKNOWN', error: err };
};

const handleUploadErrors = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    upload.array('files')(req, res, (err: unknown) => {
        if (err) {
            log.error('Upload middleware error:', err);

            const classifiedError = classifyError(err);

            switch (classifiedError.type) {
                case 'ENOENT':
                    return res.status(503).json({
                        error: 'Storage system unavailable. Please try again.',
                        type: 'StorageUnavailable',
                        suggestion:
                            'The upload directory may have been deleted. Our team has been notified.',
                        path: classifiedError.error.path,
                    });

                case 'APP_ERROR':
                    return res.status(classifiedError.error.statusCode).json({
                        error: classifiedError.error.message,
                        type: classifiedError.error.type,
                    });

                case 'MULTER_ERROR':
                    const errorMessages: Record<string, string> = {
                        LIMIT_FILE_SIZE: 'File too large. Max 200MB.',
                        LIMIT_FILE_COUNT: 'kindly upgrade to premium',
                        LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
                    };

                    const statusCode = classifiedError.error.code === 'LIMIT_FILE_COUNT' ? 409 : 400;
                    return res.status(statusCode).json({
                        error:
                            errorMessages[classifiedError.error.code] ||
                            `Upload error: ${classifiedError.error.message}`,
                        type: 'UploadError',
                        code: classifiedError.error.code,
                    });

                case 'STANDARD_ERROR':
                    if (classifiedError.error.message.includes('ENOENT')) {
                        return res.status(503).json({
                            error: 'Storage system unavailable. Please try again.',
                            type: 'StorageUnavailable',
                        });
                    }

                    return res.status(500).json({
                        error:
                            classifiedError.error.message ||
                            'Upload failed. Please try again.',
                        type: 'UnknownError',
                    });

                case 'UNKNOWN':
                default:
                    return res.status(500).json({
                        error: 'Upload failed. Please try again.',
                        type: 'UnknownError',
                    });
            }
        }
        next();
    });
};
const folderCleanerBaseDir = path.join(
    projectRoot,
    'output/folder-cleaner-temps'
);
const uploadDir = path.join(folderCleanerBaseDir, 'uploads');
const outputDir = path.join(folderCleanerBaseDir, 'outputs');
/**NB: mkdirSync runs synchronously at server startup but when
 *   the server is running and the dir is deleted it will cause the enoent error */
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });
const storage = multer.diskStorage({
    destination: async (_require, _file, cb) => {
        try {
            //ensure directory exists before each write
            await fs.ensureDir(uploadDir);
            cb(null, uploadDir);
            if (!uploadDir) {
                throw AppError.notFound('Upload directory not configured');
            }
        } catch (error) {
            // Create a proper AppError
            const appError =
                error instanceof AppError
                    ? error
                    : new AppError(
                          'Failed to prepare upload directory. Please try again.',
                          500,
                          'UploadDirectoryError'
                      );
            cb(appError, '');
        }
    },
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 200 * 1024 * 1024,
        files: 150, // Reject upload if more than 150 files
    },
}); //temporary storage with a limit of 200 mb

cleanerRoute.post(
    '/processFolder',
    handleUploadErrors,
    asyncHandler(async (req, res) => {
        log.highlight(
            `🟢 [BACKEND] request received at: ${new Date().toISOString()}`
        );

        const uploadedFiles = req.files as Express.Multer.File[];
        const uploadedFolderName = req.body.folderName; //fallback
        const safeFolderName = uploadedFolderName.replace(/[^a-z0-9_-]/gi, '_');
        log.info(`uploaded Files ${uploadedFiles.length}`);
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
                await fs.move(file.path, destPath, { overwrite: true });
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
    })
);
cleanerRoute.get('/download/:filename', (req, res) => {
    try {
        log.highlight(
            `⬇️ [BACKEND] Download requested for ${req.params.filename}`
        );
        const zipPath = path.join(outputDir, 'zipped', req.params.filename);
        if (!fs.existsSync(zipPath)) {
            throw AppError.notFound('Download File not found');
        }
        //force download
        res.download(zipPath, (err) => {
            if (err) {
                log.error('Error sending file', { data: { err } });
                throw new AppError('Error sending file ', 500, 'DownloadError');
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
        throw new AppError('Failed to download file', 500, 'DownloadError');
    }
});
