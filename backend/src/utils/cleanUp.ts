import fs from 'fs-extra';
import path from 'path';
const TWO_HOURS = 2 * 60 * 60 * 1000;
import createLogger from './logger.ts';
const log = createLogger('CLEANUP');
export async function cleanupByAge(dir: string, label = 'CLEANUP') {
    const filePath = await fs.pathExists(dir);
    if (!filePath) return;
    let deletedCount = 0;
    let deletedSize = 0;
    const now = Date.now();
    async function cleanupContents(currentPath: string) {
        try {
            const entries = await fs.readdir(currentPath);
            log.info('Enries present ', {
                context: 'clen up by age',
                data: { entries },
            });
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry);
                log.info('fullpath', { data: { fullPath } });
                try {
                    const stat = await fs.stat(fullPath);
                    log.info('Stats', { data: { stat } });
                    //check if its older than one hour
                    if (now - stat.mtimeMs > TWO_HOURS) {
                        //track size b4 deletion
                        if (stat.isFile()) {
                            deletedSize += stat.size;
                            await fs.remove(fullPath);
                            log.info(
                                `[${label}] removed file ${fullPath} age:${Math.round((now - stat.mtimeMs) / (60 * 60 * 1000))} hours`
                            );
                            deletedCount++;
                        } else if (stat.isDirectory()) {
                            //recirsively delete contents first
                            log.info(
                                `[${label}] cleanid old directory ${fullPath} (age: ${Math.round((now - stat.mtimeMs) / (60 * 60 * 1000))} hours)`
                            );
                            //get all contents of directory
                            const subEntries = await fs.readdir(fullPath);
                            for (const subEntry of subEntries) {
                                const subPath = path.join(fullPath, subEntry);
                                try {
                                    const subStat = await fs.stat(subPath);
                                    if (subStat.isFile()) {
                                        deletedSize += subStat.size;
                                    } else if (subStat.isDirectory()) {
                                        //for nested directories recuisively delete all contents
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
                        }
                    } else {
                        //if diretory is not old enough check its conents recursively
                        if (stat.isDirectory()) {
                            await cleanupContents(fullPath);
                        }
                    }
                } catch (error) {
                    // ignore errors for files that might have been delted in the meantime
                    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                        log.error(`[${label}] failed to process ${fullPath}`, {
                            data: { error },
                        });
                    }
                }
            }
        } catch (error) {
            log.error(`[${label}] failed to read directory ${currentPath}`, {
                data: { error },
            });
        }
    }
    async function getDirectorySize(dirPath: string): Promise<number> {
        let size = 0;
        try {
            const entries = await fs.readdir(dirPath);
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry);
                try {
                    const stat = await fs.stat(fullPath);
                    if (stat.isFile()) {
                        size += stat.size;
                    } else if (stat.isDirectory()) {
                        size += await getDirectorySize(fullPath);
                    }
                } catch (error) {
                    log.error('errors in gettingthesize', { data: { error } });
                }
            }
        } catch (error) {
            log.error('errors in gettingthesize', { data: { error } });
        }
        return size;
    }
    // startcleanup from parent direcory
    await cleanupContents(dir);
    if (deletedCount > 0) {
        log.info(
            `[${label}] cleanup complete: removed ${deletedCount} items (${(deletedSize / (1024 * 1024)).toFixed(2)}) MB`
        );
    } else {
        log.info(`[${label}] no items toclean up in ${dir}`);
    }
}

//set up periodic cleanup (run every hour)
export function startPeriodicCleanup(tempDirs: string[]) {
    //run immediately on startup
    for (const dir of tempDirs) {
        cleanupByAge(dir, 'PERIODIC-CLEANUP').catch(console.error);
    }
    //then run every hour
    setInterval(
        () => {
            for (const dir of tempDirs) {
                cleanupByAge(dir, 'PERIODIC-CLEANUP').catch(console.error);
            }
        },
        60 * 60 * 1000
    );
}

//force cleanup all files in a directory regardless of age
export async function forceCleanup(dir: string, label = 'CLEANUP') {
    const filePath = fs.pathExists(dir);
    if (!filePath) return;
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
