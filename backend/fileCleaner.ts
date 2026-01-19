import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import cors from 'cors';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { tidyFolder } from './utils/tidy';
const app = express();
app.use(
    cors({ origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] })
);
app.use(express.json());
const upload = multer({ dest: 'upload/' }); //temporary storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.post('/api/processFolder', upload.array('files'), async (req, res) => {
    const startTime = Date.now();
    console.log('🟢 [BACKEND] request recieved at', new Date().toISOString());
    try {
        const uploadedFiles = req.files as Express.Multer.File[];
        const uploadedFolderName = req.body.folderName; //fallback
        const safeFolderName = uploadedFolderName.replace(/[^a-z0-9_-]/gi, '_');
        console.log(`[BACKEND] ${uploadedFiles.length} files received`);
        if (!uploadedFiles || uploadedFiles.length === 0) {
            console.warn('⚠ [BACKEND] no files recieved ');
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const tempDir = path.join(__dirname, 'temp', Date.now().toString());
        await fs.ensureDir(tempDir);
        console.log('[BACKEND] temp folder created at ', tempDir);
        // move uploaded files to temp dir
        for (const file of uploadedFiles) {
            const destPath = path.join(tempDir, file.originalname);
            await fs.move(file.path, destPath);
            console.log(`[BACKEND] moved ${file.originalname} to temp`);
        }
        //remove duplicate files based on hash
        console.log('[BACKEND] starting duplicate removal...');
        const tidyStart = Date.now();
        const stats = await tidyFolder(tempDir);
        console.log(
            `[BACKEND] duplicate removal done in ${Date.now() - tidyStart} ms`
        );
        const zipPath = path.join(
            __dirname,
            'temp',
            `${safeFolderName}_cleaned-${Date.now()}.zip`
        );
        console.log(`[BACKEND] Zipping folder`);
        const zipStart = Date.now();
        const output = fs.createWriteStream(zipPath);

        const archive = archiver('zip', { zlib: { level: 6 } });
        archive.pipe(output);

        archive.on('warning', (err) => {
            console.warn('[BACKEND] Archiver warning:', err);
        });
        archive.on('error', (err) => {
            console.error('[BACKEND] Archiver error:', err);
            throw err;
        });
        // Directory with root path (avoids extra unnamed folder)
        archive.directory(tempDir, false); // `false` ensures no extra root folder

        // Proper async completion handling
        await Promise.all([
            archive.finalize(),
            new Promise<void>((resolve, reject) => {
                output.on('close', () => {
                    console.log(
                        `[BACKEND] ZIP stream closed, size: ${output.bytesWritten} bytes`
                    );
                    resolve();
                });
                output.on('error', reject);
            }),
        ]);

        console.log(`[BACKEND]zipping done in ${Date.now() - zipStart} ms`);

        console.log(`[BACKEND] response ready in ${Date.now() - startTime}ms`);
        // Build absolute download URL so frontend (different origin) can access it
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        const downloadURL = `${protocol}://${host}/download/${path.basename(zipPath)}`;

        // return zip download link
        res.json({
            downloadURL,
            stats: {
                originalFiles: uploadedFiles.length,
                finalFiles: stats.finalFiles.length,
                duplicatesRemoved: stats.duplicatesRemoved,
                spaceSaved: stats.spaceSaved,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process folder' });
    }
});
app.get('/download/:filename', (req, res) => {
    try {
        console.log(
            `⬇️ [BACKEND] Download requested for ${req.params.filename}`
        );
        const zipPath = path.join(__dirname, 'temp', req.params.filename);
        if (!fs.existsSync(zipPath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        //force download
        res.download(zipPath, (err) => {
            if (err) {
                console.error('Error sending file', err);
            } else {
                console.log(`[BACKEND] sent file ${zipPath}`);
            }
        });
    } catch (error) {
        console.log('Error downloading the files', error);
        res.status(500).json({ error: 'Failed to download' });
    }
});
app.listen(5000, () => console.log('Server running on http://localhost:5000'));
