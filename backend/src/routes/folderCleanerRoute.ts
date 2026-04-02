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
import uploadLimiter from '../utils/rateLimiter.js';
import { TIER_CONFIG } from '../config/tiers.js';
import { sendEmailAlert } from '../utils/sendEmail.js';
import {
    organizeByExtension,
    type ExtensionStats,
} from '../utils/organizeFolder.js';
const log = createLogger('FolderCleaner.ts');
export const cleanerRoute: Router = Router();
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
/**In Express, if you're inside an asynchronous callback and something goes wrong, ALWAYS use next(error), NEVER throw.
This applies to:
File uploads (Multer)
Database operations
API calls
Any async operation with callbacks/promises 

NB:THIS IS WRONG and it caused a server crash ie the server stopped working
 case 'APP_ERROR':
    log.error(classifiedError.error.message, {
        data: {
            error: classifiedError.error.message,
            type: classifiedError.error.type,
        },
    });
    throw new AppError(
        classifiedError.error.message,
        classifiedError.error.statusCode,
        classifiedError.error.type
    );
- Instead do return next(
    log.error(classifiedError.error.message, {
            data: {
                error: classifiedError.error.message,
                type: classifiedError.error.type,
            },
        });
        throw new AppError(
            classifiedError.error.message,
            classifiedError.error.statusCode,
            classifiedError.error.type
        );
    )
*/
//let MAX_UPLOADS: number = TIER_CONFIG.free.maxUploads;
function handleUploadErrors(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    /**
     * determining the tier id (Ideally from he auth middleware of the decoded user)
     * I was to sed it via the body but since multer runs prior even b4 the body is loaded, we have to use query parameter
     *
     */
    const tierId = (req.query.tierId as keyof typeof TIER_CONFIG) || 'free';
    //safely get config (fallback to free if user sends a fake tier name)

    const DYNAMIC_LIMIT =
        TIER_CONFIG[tierId as keyof typeof TIER_CONFIG]?.maxUploads;
    log.warn(
        `Processing for upload tier ${tierId} with limit: ${DYNAMIC_LIMIT}`
    );
    const CAN_CLEAN = TIER_CONFIG[tierId].canClean;
    if (!CAN_CLEAN) {
        log.info(
            `Identifying whether the user can clean ${CAN_CLEAN ? 'YES' : 'NO'}`
        );
        log.info(`The current tier that the user is in ${tierId}`);

        return next(
            new AppError(
                'This feature is unavailable in your current subscription plan',
                503,
                'ServiceUnavailable'
            )
        );
    }

    const uploadMiddleware = multer({
        storage: storage,
        limits: {
            fileSize: 200 * 1024 * 1024,
            files: DYNAMIC_LIMIT,
        },
    }).array('files');
    uploadMiddleware(req, res, (err: unknown) => {
        if (err) {
            log.error('Upload middleware error:', { data: { err } });

            const classifiedError = classifyError(err);
            if (err instanceof MulterError && err.code === 'LIMIT_FILE_COUNT') {
                return next(
                    new AppError(
                        `File count exceeded. Your limit is ${DYNAMIC_LIMIT} `,
                        409,
                        'UploadError'
                    )
                );
            }
            switch (classifiedError.type) {
                case 'ENOENT':
                    log.error('Storage unavailable ', {
                        data: {
                            error: 'Storage system unavailable. Please try again.',
                            type: 'StorageUnavailable',
                            suggestion:
                                'The upload directory may have been deleted. Our team has been notified.',
                            path: classifiedError.error.path,
                        },
                    });
                    return next(
                        new AppError(
                            'Service Unavailable',
                            503,
                            'StorageUnavailable'
                        )
                    );
                case 'APP_ERROR':
                    log.error(classifiedError.error.message, {
                        data: {
                            error: classifiedError.error.message,
                            type: classifiedError.error.type,
                        },
                    });
                    return next(
                        new AppError(
                            classifiedError.error.message,
                            classifiedError.error.statusCode,
                            classifiedError.error.type
                        )
                    );
                case 'MULTER_ERROR':
                    const errorMessages: Record<string, string> = {
                        LIMIT_FILE_SIZE: 'File too large. Max 200MB.',
                        LIMIT_FILE_COUNT: `File count exceeded ${DYNAMIC_LIMIT}`,
                        LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
                    };

                    const statusCode =
                        classifiedError.error.code === 'LIMIT_FILE_COUNT'
                            ? 409
                            : 400;
                    log.error(errorMessages[classifiedError.error.code], {
                        data: {
                            error:
                                errorMessages[classifiedError.error.code] ||
                                `Upload error: ${classifiedError.error.message}`,
                            type: 'UploadError',
                            code: classifiedError.error.code,
                        },
                    });
                    return next(
                        new AppError(
                            `Upload error: ${classifiedError.error.message}`,
                            statusCode,
                            'UploadError'
                        )
                    );

                case 'STANDARD_ERROR':
                    if (classifiedError.error.message.includes('ENOENT')) {
                        log.error(
                            'Storage system unavailable. Please try again.',
                            {
                                data: {
                                    error: 'Storage system unavailable. Please try again.',
                                    type: 'StorageUnavailable',
                                },
                            }
                        );
                        return next(
                            new AppError(
                                'Storage system unavailable. Please try again.',
                                503,
                                'StorageUnavailable'
                            )
                        );
                    }
                    log.error(
                        `${classifiedError.error.message || 'Upload failed. Please try again.'}`,
                        {
                            data: {
                                error:
                                    classifiedError.error.message ||
                                    'Upload failed. Please try again.',
                                type: 'UnknownError',
                            },
                        }
                    );
                    return next(
                        new AppError(
                            `${classifiedError.error.message || 'Upload failed. Please try again.'}`,
                            500,
                            'UnknownError'
                        )
                    );

                case 'UNKNOWN':
                default:
                    log.error('Upload failed.Please try again', {
                        data: {
                            error: 'Upload failed. Please try again.',
                            type: 'UnknownError',
                        },
                    });
                    return next(
                        new AppError(
                            'Upload failed.Please try again',
                            500,
                            'UnknownError'
                        )
                    );
            }
        }
        next();
    });
}
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

cleanerRoute.post(
    '/processFolder',
    uploadLimiter,
    handleUploadErrors,
    asyncHandler(async (req, res) => {
        log.highlight(
            `🟢 [BACKEND] request received at: ${new Date().toISOString()}`
        );
        const tierId = (req.query.tierId as keyof typeof TIER_CONFIG) || 'free';
        const CAN_ORGANIZE = TIER_CONFIG[tierId].canOrganize;
        const uploadedFiles = req.files as Express.Multer.File[];
        const uploadedFolderName = req.body.folderName; //fallback
        const EXPIRED = await sendEmailAlert(req);
        if (EXPIRED) {
            return res.status(503).json({ expired: true });
        }
        //const tierId = (req.query.tierId as keyof typeof TIER_CONFIG) || 'free';

        //MAX_UPLOADS = TIER_CONFIG[tierId].maxUploads;

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
        const tidyStats = await tidyFolder(tempDir);
        //setup logic to check if they are in tier 1 to enable the folder organization
        log.info(
            `[BACKEND] duplicate removal done in ${Date.now() - tidyStart} ms`
        );
        let fileOrgStats: ExtensionStats | null = null;
        if (CAN_ORGANIZE) {
            fileOrgStats = await organizeByExtension(tempDir);
        }
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
            log.info('the stats from the backend side logs', {
                data: {
                    stats: {
                        originalFiles: uploadedFiles.length,
                        finalFiles: tidyStats.finalFiles.length,
                        duplicatesRemoved: tidyStats.duplicatesRemoved,
                        spaceSaved: tidyStats.spaceSaved,
                        breakdown: fileOrgStats,
                    },
                },
            });
            res.json({
                downloadURL,
                stats: {
                    originalFiles: uploadedFiles.length,
                    finalFiles: tidyStats.finalFiles.length,
                    duplicatesRemoved: tidyStats.duplicatesRemoved,
                    spaceSaved: tidyStats.spaceSaved,
                    breakdown: fileOrgStats,
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
                    finalFiles: tidyStats.finalFiles.length,
                    duplicatesRemoved: tidyStats.duplicatesRemoved,
                    spaceSaved: tidyStats.spaceSaved,
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
