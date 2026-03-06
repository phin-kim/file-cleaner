import bcrypt from 'bcrypt';
import fs from 'fs-extra';
import crypto from 'crypto';
const SALT_ROUNDS = 12;
export async function hashPassword(password: string) {
    return bcrypt.hash(password, SALT_ROUNDS);
}
export async function comparePasswords(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

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
export const hashPhoneNumber = (phoneNumber: string) => {
    return crypto.createHash('sha256').update(phoneNumber).digest('hex');
};
