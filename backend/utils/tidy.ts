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
    const seenNames = new Map<string, string>();
    const files = await fs.readdir(folderPath);
    let duplicatesRemoved = 0;
    let spaceSaved = 0;
    const finalFiles: string[] = [];
    for (const fileName of files) {
        const filePath = path.join(folderPath, fileName);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
            // Normalize filename to collapse common duplicate naming patterns
            const normalize = (name: string) => {
                const ext = path.extname(name);
                let base = path.basename(name, ext);
                // If filename contains multiple comma-separated names, take the first
                base = base.split(',')[0].trim();
                // Remove trailing " (1)", " (2)", etc.
                base = base.replace(/\s*\(\d+\)$/g, '').trim();
                return (base + ext).toLowerCase();
            };

            const normalized = normalize(fileName);
            // If we've already seen this normalized name, treat as duplicate and remove
            if (seenNames.has(normalized)) {
                await fs.remove(filePath);
                duplicatesRemoved++;
                spaceSaved += stats.size;
                console.log(`Removed name-duplicate: ${fileName} (normalized: ${normalized})`);
                continue;
            }
            const hash = await hashFile(filePath);
            if (seenHashes.has(hash)) {
                await fs.remove(filePath);
                duplicatesRemoved++;
                spaceSaved += stats.size;
                console.log(`Removed duplicate by hash: ${fileName}`);
                continue;
            }

            // Keep this file
            seenHashes.set(hash, filePath);
            seenNames.set(normalized, filePath);
            finalFiles.push(filePath);
        }
    }

    return {
        finalFiles,
        duplicatesRemoved,
        spaceSaved: (spaceSaved / (1024 * 1024)).toFixed(2) + 'MB',
    };
}
