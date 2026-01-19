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
    const seenHashes = new Map<string, string>();
    const files = await fs.readdir(folderPath);
    let duplicatesRemoved = 0;
    let spaceSaved = 0;
    const finalFiles: string[] = [];
    for (const fileName of files) {
        const filePath = path.join(folderPath, fileName);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
            const hash = await hashFile(filePath);
            if (seenHashes.has(hash)) {
                await fs.remove(filePath);
                duplicatesRemoved++;
                spaceSaved += stats.size;
                console.log(`Removed duplicate: ${fileName}`);
            } else {
                seenHashes.set(hash, filePath);
                finalFiles.push(filePath);
            }
        }
    }

    return {
        finalFiles,
        duplicatesRemoved,
        spaceSaved: (spaceSaved / (1024 * 1024)).toFixed(2) + 'MB',
    };
}
