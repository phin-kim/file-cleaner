import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import createLogger from '../utils/logger.js';
import AppError from '../utils/appError.js';

const log = createLogger('ZipCreate.ts');

async function createZipWithRetry(
    tempDir: string,
    zippedDir: string,
    safeFolderName: string,
    maxRetries: number = 3,
    retryDelay: number = 1000
): Promise<string> {
    let lastError: Error | null = null;
    const startTime = Date.now();
    try {
        await fs.ensureDir(zippedDir);
        log.info(`[BACKEND] Ensured zipped directory exists at: ${zippedDir}`);
    } catch (dirError) {
        log.error(`[BACKEND] Failed to create zipped directory:`, {
            data: { dirError },
        });
        throw new AppError(
            `Cannot create output directory:${(dirError as Error).message}`,
            500,
            'ZipCreationError'
        );
    }
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            //ensure the directory exists

            const zipPath = path.join(
                zippedDir,
                `${safeFolderName}_cleaned-${Date.now()}.zip`
            );
            await fs.ensureDir(zippedDir);

            //create zip
            const output = fs.createWriteStream(zipPath);

            const archive = archiver('zip', { zlib: { level: 6 } });
            archive.pipe(output);
            // set up error handlers
            let archiveError: Error | null = null;

            archive.on('warning', (err) => {
                log.warn(
                    `[BACKEND] Archiver warning:(attempt(${attempt}))`,
                    err
                );
            });
            archive.on('error', (err) => {
                archiveError = err;
                log.error('[BACKEND] Archiver error:', err);
                throw err;
            });
            // Put files inside a folder that preserves the original uploaded folder name
            archive.directory(tempDir, safeFolderName);

            // Proper async completion handling
            /*await Promise.all([
                archive.finalize(),
                new Promise<void>((resolve, reject) => {
                    output.on('close', () => {
                        log.info(
                            `[BACKEND] ZIP stream closed, size: ${output.bytesWritten} bytes`
                        );
                        resolve();
                    });
                    output.on('error', reject);
                }),
            ]);*/
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(
                        new AppError(
                            'ZIP operation timed out',
                            500,
                            'ZipTimeout'
                        )
                    );
                }, 30000); // 30 second timeout

                output.on('close', () => {
                    clearTimeout(timeout);
                    if (archiveError) {
                        reject(archiveError);
                    } else {
                        log.info(
                            `[BACKEND] ZIP stream closed (attempt ${attempt}), size: ${output.bytesWritten} bytes`
                        );
                        resolve();
                    }
                });

                output.on('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });

                archive.finalize().catch((err) => {
                    clearTimeout(timeout);
                    reject(
                        new AppError(
                            `Archive finalize Error:${err.message}`,
                            500,
                            'FinalizeError'
                        )
                    );
                });
            });
            log.info(`Successfully created zip file  on attempt${attempt}`);
            log.info(`[BACKEND] response ready in ${Date.now() - startTime}ms`);
            return zipPath;
        } catch (error) {
            if (error instanceof AppError) {
                lastError = error;
            } else if (error instanceof Error) {
                //check for enoent specifically
                if ('code' in error && error.code === 'ENOENT') {
                    const path = (error as any).path || '';
                    if (path.includes(tempDir)) {
                        lastError = new AppError(
                            `Source file ot found ${path}`,
                            404,
                            'SourceFileNotFound'
                        );
                    } else {
                        lastError = new AppError(
                            `Output path error:${path}`,
                            500,
                            'OutputPathError'
                        );
                    }
                } else {
                    lastError = new AppError(
                        `Zipping failed:${error.message}`,
                        500,
                        'ZipCreationError'
                    );
                }
            } else {
                lastError = new AppError(
                    `Unknown error:${String(error)}`,
                    500,
                    'UnknownError'
                );
            }
            log.error(`Zipping attempt ${attempt} failed:`, {
                data: { lastError },
            });
            //clean up the failed zip file
            try {
                const failedZipPath = path.join(
                    zippedDir,
                    `${safeFolderName}_cleaned-${Date.now()}-attempt-${attempt}.zip`
                );
                await fs.remove(failedZipPath);
            } catch (error) {}
            //if this wasn't the last attempt wait before retrying
            if (attempt < maxRetries) {
                log.info(`Retrying in ${retryDelay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
                retryDelay *= 2;
            }
        }
    }
    //in the case that all the retries ail
    throw new AppError(
        `Failed to zip file after${maxRetries}attempts,Last Error:${lastError?.message}`,
        500,
        'ZipCreationError'
    );
}
export default createZipWithRetry;
