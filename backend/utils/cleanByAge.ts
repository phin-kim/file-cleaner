import fs from 'fs-extra';

const TWO_HOURS = 2 * 60 * 60 * 1000;

export default async function cleanupByAge(dir: string, label = 'CLEANUP') {
    if (!(await fs.pathExists(dir))) return;

    const now = Date.now();
    const entries = await fs.readdir(dir);

    for (const entry of entries) {
        const fullPath = `${dir}/${entry}`;

        try {
            const stat = await fs.stat(fullPath);

            if (now - stat.mtimeMs > TWO_HOURS) {
                await fs.remove(fullPath);
                console.log(`[${label}] removed ${fullPath}`);
            }
        } catch (err) {
            console.error(`[${label}] failed for ${fullPath}`, err);
        }
    }
}
