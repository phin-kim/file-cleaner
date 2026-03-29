import fs from 'fs-extra';
import path from 'path';
const ONE_HOUR = 1 * 60 * 60 * 1000;
import createLogger from './logger.js';
const log = createLogger('CLEANUP');
//the delete toplevel dirs is to help delete folders in folder-cleaner-temp-storage as the folders there weren't being deleted and it was too mush
export async function cleanupByAge(
    dir: string,
    label = 'CLEANUP',
    deleteTopLevelDirs = false
) {
    const filePath = await fs.pathExists(dir);
    if (!filePath) return;

    let deletedCount = 0;
    let deletedSize = 0;
    const now = Date.now();
    async function cleanupContents(currentPath: string, isRoot = true) {
        try {
            const entries = await fs.readdir(currentPath);
            log.info('Entries present ', {
                context: 'clean up by age',
                data: { entries },
            });
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry);
                try {
                    const stat = await fs.stat(fullPath);
                    //check if its older than one hour
                    if (now - stat.mtimeMs > ONE_HOUR) {
                        //track size b4 deletion
                        if (stat.isFile()) {
                            deletedSize += stat.size;
                            await fs.remove(fullPath);
                            log.info(
                                `[${label}] removed file ${fullPath} age:${Math.round((now - stat.mtimeMs) / (60 * 60 * 1000))} hours`
                            );
                            deletedCount++;
                        } else if (stat.isDirectory()) {
                            //if deleteTOpLevelDirs is true and we are in the root, of the temp folder,delete the whole subfolder
                            if (deleteTopLevelDirs && isRoot) {
                                const dirSize =
                                    await getDirectorySize(fullPath);
                                deletedSize += dirSize;
                                await fs.remove(fullPath);
                                log.info(
                                    `[${label}] removed entire sub-directory ${fullPath}`
                                );
                                deletedCount++;
                                continue;
                            }
                            //get all contents of directory
                            const subEntries = await fs.readdir(fullPath);
                            for (const subEntry of subEntries) {
                                const subPath = path.join(fullPath, subEntry);
                                try {
                                    const subStat = await fs.stat(subPath);
                                    if (subStat.isFile()) {
                                        deletedSize += subStat.size;
                                    } else if (subStat.isDirectory()) {
                                        //for nested directories recursively delete all contents
                                        const dirSize =
                                            await getDirectorySize(subPath);
                                        deletedSize += dirSize;
                                    }
                                    await fs.remove(subPath);
                                    log.info(
                                        `[${label}] removed ${subPath} from old directory`
                                    );
                                    deletedCount++;
                                } catch (error) {
                                    if (
                                        (error as NodeJS.ErrnoException)
                                            .code !== 'ENOENT'
                                    ) {
                                        log.error(
                                            `[${label}] failed to remove ${subPath}`,
                                            { data: { error } }
                                        );
                                    }
                                }
                            }
                            //update the directory modification time to now since we cleaned it
                            await fs.utimes(fullPath, new Date(), new Date());

                            //recursively delete contents first
                            log.info(
                                `[${label}] cleaning old directory ${fullPath} (age: ${Math.round((now - stat.mtimeMs) / (60 * 60 * 1000))} hours)`
                            );
                        }
                    } else {
                        //if directory is not old enough check its contents recursively
                        if (stat.isDirectory()) {
                            await cleanupContents(fullPath, false);
                        }
                    }
                } catch (error) {
                    // ignore errors for files that might have been deleted in the meantime
                    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                        log.error(`[${label}] failed to process ${fullPath}`, {
                            data: { error },
                        });
                    }
                }
            }
        } catch (error) {
            log.error(`[${label}] failed to read directory ${currentPath}`, {
                context: 'cleanupContents',
                data: { error, path: currentPath },
            });
        }
    }
    async function getDirectorySize(
        dirPath: string,
        maxDepth = 5
    ): Promise<number> {
        let size = 0;

        async function walk(currentPath: string, currentDepth: number) {
            if (currentDepth > maxDepth) return 0;
            try {
                const entries = await fs.readdir(currentPath);
                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry);
                    try {
                        const stat = await fs.stat(fullPath);
                        if (stat.isFile()) {
                            size += stat.size;
                        } else if (stat.isDirectory()) {
                            await walk(fullPath, currentDepth + 1);
                        }
                    } catch (error) {
                        log.error(`Error in size calculation`, {
                            context: 'sizeCalculation',
                            data: { error },
                        });
                    }
                }
            } catch (error) {
                log.error(`Error in reading the directory: ${dirPath}`, {
                    data: { error },
                });
            }
        }
        await walk(dirPath, 0);
        return size;
    }
    // start cleanup from parent directory
    await cleanupContents(dir, true);
    if (deletedCount > 0) {
        log.info(
            `[${label}] cleanup complete: removed ${deletedCount} items (${(deletedSize / (1024 * 1024)).toFixed(2)}) MB`
        );
    } else {
        log.info(`[${label}] no items to clean up in ${dir}`);
    }
}

//set up periodic cleanup (run every hour)
export function startPeriodicCleanup(tempDirs: string[]) {
    const runCleanup = () => {
        for (const dir of tempDirs) {
            // Check if this is the specific folder that gets too cluttered
            const shouldDeleteFolders = dir.includes(
                'folder-cleaner-temp-storage'
            );

            cleanupByAge(dir, 'PERIODIC-CLEANUP', shouldDeleteFolders).catch(
                (err) =>
                    log.error(`Cleanup failed for ${dir}`, { data: { err } })
            );
        }
    };

    // Run once on startup
    runCleanup();

    // Then run every hour
    setInterval(runCleanup, ONE_HOUR);
}

//force cleanup all files in a directory regardless of age
export async function forceCleanup(dir: string, label = 'CLEANUP') {
    log.warn('Force cleanup triggered');
    const exists = await fs.pathExists(dir);

    if (!exists) {
        log.error(`the desired file at ${dir} doesn't exist`);
        return;
    }
    let deletedCount = 0;
    let deletedSize = 0;
    async function recursiveClean(currentPath: string) {
        try {
            const stat = await fs.stat(currentPath);
            if (stat.isFile()) {
                deletedSize += stat.size;
            } else if (stat.isDirectory()) {
                const files = await fs.readdir(currentPath);
                for (const file of files) {
                    await recursiveClean(path.join(currentPath, file));
                }
            }
            await fs.remove(currentPath);
            log.info(`[${label} force removed ${currentPath}]`);
            deletedCount++;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                log.error(`[${label}] failed for ${currentPath}`, {
                    data: { error },
                });
            }
        }
    }
    await recursiveClean(dir);
    await fs.emptyDir(dir);
    log.error(
        `[${label}] force cleanup complete: removed ${deletedCount} items (${(deletedSize / (1024 * 1024)).toFixed(2)} MB)`
    );
}
export async function cleanupOrphanedFiles(
    baseDir: string,
    patterns: RegExp[]
) {
    const filePath = await fs.pathExists(baseDir);
    if (!filePath) return;
    async function scan(dir: string) {
        const entries = await fs.readdir(dir);
        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                await scan(fullPath);
            } else {
                //check if filename matched any pattern
                for (const pattern of patterns) {
                    if (pattern.test(entry)) {
                        //check if file is older than 1 hour (likely orphaned)
                        const now = Date.now();
                        if (now - stat.mtimeMs > 60 * 60 * 1000) {
                            await fs.remove(fullPath);
                            log.info(`[ORPHANED-CLEANUP] removed ${fullPath}`);
                        }
                        break;
                    }
                }
            }
        }
    }
    await scan(baseDir);
}
