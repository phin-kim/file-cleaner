import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import cors from 'cors';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { tidyFolder } from './utils/tidy';
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'upload/' }); //temporary storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.post('/api/processFolder', upload.array('files'), async (req, res) => {
    const startTime = Date.now();
    console.log('🟢 [BACKEND] request recieved at', new Date().toISOString());
    try {
        const uploadedFiles = req.files as Express.Multer.File[];
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
            `cleaned-${Date.now()}.zip`
        );
        console.log(`[BACKEND] Zipping folder`);
        const zipStart = Date.now();
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 6 } });
        archive.pipe(output);
        archive.directory(tempDir, false);
        await archive.finalize();
        console.log(`[BACKEND]zipping done in ${Date.now() - zipStart} ms`);
        await fs.remove(tempDir);
        console.log('[BACKEND] temp folder removed');
        console.log(`[BACKEND] response redy in ${Date.now() - startTime}ms`);
        //return zip download link
        res.json({
            downloadURL: `/download/${path.basename(zipPath)}`,
            stats: {
                originalFiles: uploadedFiles.length,
                finalfFiles: stats.finalFiles.length,
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
        res.download(zipPath);
    } catch (error) {
        console.log('Error downloading the files', error);
        res.status(500).json({ error: 'Failed to download' });
    }
});
app.listen(5000, () => console.log('Server running on http://localhost:5000'));
