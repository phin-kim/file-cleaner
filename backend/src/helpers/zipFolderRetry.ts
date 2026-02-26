import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import createLogger from '../utils/logger';
const log = createLogger('Zip create');
async function createZipWithRetry(
    tempDir: string,
    zippedDir: string,
    safeFolderName: string,
    maxRetries: number = 3,
    retryDelay: number = 1000
): Promise<string> {
    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            //ensure the directory exists

            await fs.ensureDir(zippedDir);
            const zipPath = path.join(
                zippedDir,
                `${safeFolderName}_cleaned-${Date.now()}.zip`
            );

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
                    reject(new Error('ZIP operation timed out'));
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

                archive.finalize().catch(reject);
            });
            log.info(`Successfully created zip file  on attempt${attempt}`);
            log.info(`[BACKEND] response ready in ${Date.now() - startTime}ms`);
            return zipPath;
        } catch (error) {
            lastError = error as Error;
            log.error(`Zipping attempt${attempt} failed:`);
            try {
                //clean up the zip file if it exists
                const failedZipPath = path.join(
                    zippedDir,
                    `${safeFolderName}_cleaned-${Date.now()}-attempt-${attempt}.zip`
                );
                await fs.remove(failedZipPath);
            } catch (error) {}
            //if this wasn't the last attempt ,wait b4 retrying
            if (attempt < maxRetries) {
                log.info(`Retrying in ${retryDelay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, retryDelay));
                //increase the delay (exponential backoff)
                retryDelay *= 2;
            }
        }
    }
    //in the case that all the retries ail
    throw new Error(
        `Failed to zip file after${maxRetries}attempts,Last Error:${lastError?.message}`
    );
}
export default createZipWithRetry;
