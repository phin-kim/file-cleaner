import fs from 'fs-extra';
import AppError from '../utils/appError.js';
async function ensureDirExists(dirPath: string) {
    try {
        await fs.ensureDir(dirPath);
    } catch (error) {
        //if ensure dir fails try to create manually
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error: unknown) {
            //in the event that mk dir also fails throw  a clear error
            throw new AppError(`Cannot create directory ${dirPath}:`);
        }
    }
}
export default ensureDirExists;
