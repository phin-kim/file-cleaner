import fs from 'fs-extra';
import path from 'path';
export interface ExtensionStats {
    [category: string]: {
        count: number;
        sizeByBytes: number;
    };
}
import createLogger from './logger';
const log = createLogger('OrganizeFolder.ts');
export async function organizeByExtension(folderPath: string) {
    const files = await fs.readdir(folderPath);
    const stats: ExtensionStats = {};
    const extensionMap: Record<string, string[]> = {
        Pictures: ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
        Documents: ['.pdf', '.doc', '.docx', '.txt'],
        Code: ['.js', '.ts', '.html', '.css', '.py'],
        'Audio/Video': ['.mp3', '.wav', '.mp4', '.mov', '.mkv'],
    };

    for (const fileName of files) {
        const filePath = path.join(folderPath, fileName);
        const fileInfo = await fs.stat(filePath);
        //skip directories we might have created in this loop
        if (!fileInfo.isFile()) continue;

        const ext = path.extname(fileName).toLowerCase();
        let targetFolder = 'Others'; //default folder

        for (const [category, extensions] of Object.entries(extensionMap)) {
            if (extensions.includes(ext)) {
                targetFolder = category;
                break;
            }
        }
        //initialize category stats if they don't exist
        if (!stats[targetFolder]) {
            stats[targetFolder] = { count: 0, sizeByBytes: 0 };
        }
        //update the stats
        stats[targetFolder].count += 1;
        stats[targetFolder].sizeByBytes += fileInfo.size;

        const targetDirPath = path.join(folderPath, targetFolder);

        await fs.ensureDir(targetDirPath);

        await fs.move(filePath, path.join(targetDirPath, fileName));
    }
    log.highlight('Checking the organize folder.ts for the response ');
    log.info('This are the stats', { data: { stats } });
    return stats;
}
