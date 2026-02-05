import fs from 'fs-extra';
import crypto from 'crypto';

/**
 * Compute MD5 hash of a file using streams
 * @param filePath string
 * @returns Promise<string>
 */
export function hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
}
