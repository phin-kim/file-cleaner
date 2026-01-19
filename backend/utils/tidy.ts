import fs from 'fs-extra';
import path from 'path';
import { hashFile } from './hash';
export interface TidyStats {
    finalFiles: string[];
    duplicatesRemoved: number;
    spaceSaved: string; // MB
}

/**
 * Remove duplicate files in a folder based on hash
 * @param folderPath string
 */
export async function tidyFolder(folderPath: string): Promise<TidyStats> {
    const seenHashes = new Set<string>();
    const files = await fs.readdir(folderPath);
    let duplicatesRemoved = 0;
    let spaceSaved = 0;
    const finalFiles: string[] = [];
    await Promise.all(
        files.map(async (fileName) => {
            const filePath = path.join(folderPath, fileName);
            const stats = await fs.stat(filePath);

            // Only process files
            if (stats.isFile()) {
                const hash = await hashFile(filePath);
                if (seenHashes.has(hash)) {
                    await fs.remove(filePath);
                    duplicatesRemoved++;
                    spaceSaved += stats.size;
                } else {
                    seenHashes.add(hash);
                    finalFiles.push(filePath);
                }
            }
        })
    );

    return {
        finalFiles,
        duplicatesRemoved,
        spaceSaved: (spaceSaved / (1024 * 1024)).toFixed(2) + 'MB',
    };
}
