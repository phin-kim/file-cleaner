import { Router } from 'express';
import path from 'path';
import fs from 'fs-extra';
import multer from 'multer';
import { processUploadedFiles } from '../utils/fileMerger';
import generatePDF from '../utils/generatePDF';
export const mergerRoute = Router();
const uploadDir = path.join(process.cwd(), 'backend/temp/merger/uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: async (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const safeName = path.basename(file.originalname);
        cb(null, `${Date.now()}-${safeName}`);
    },
});
const upload = multer({ storage });
mergerRoute.post('/merge-files', upload.array('files'), async (req, res) => {
    try {
        const folderName = req.body.folderName;
        if (!folderName) {
            return res.status(400).json({ error: 'Folder is required' });
        }
        const uploadDir = path.join(
            process.cwd(),
            'backend/temp/merger/uploads'
        );
        console.log('[DEBUG] folder exists?', fs.existsSync(uploadDir));
        const mergedQuestions = await processUploadedFiles(uploadDir);
        if (!mergedQuestions || mergedQuestions.length === 0) {
            return res.status(200).json({
                success: true,
                stats: {
                    inputQuestions: 0,
                    outputQuestions: 0,
                    duplicatesRemoved: 0,
                },
                downloadURL: null,
            });
        }
        const outputDir = path.join(process.cwd(), 'backend/temp/outputs');
        await fs.ensureDir(outputDir); //creates the folder if missing
        const outputFile = path.join(outputDir, `merged-${Date.now()}.pdf`);

        await generatePDF(mergedQuestions, outputFile);
        setTimeout(
            () => {
                fs.remove(uploadDir).catch(console.error);
            },
            2 * 60 * 60 * 1000
        );
        // Build absolute download URL so frontend (different origin) can access it
        const host = req.get('host') || 'localhost:5000';
        const protocol = req.protocol || 'http';
        const downloadURL = `${protocol}://${host}/api/download/${path.basename(outputFile)}`;
        res.json({
            success: true,
            downloadURL,
        });
    } catch (error) {
        console.error('Merge route error', error);
        res.status(500).json({ error: 'Failed to merge files' });
    }
});
mergerRoute.get('/download-merged/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        //adjust filename to where merged pdfs are stored
        const filePath = path.join(process.cwd(), 'backend/temp', filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        //foce download
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Error sending merged pdf', err);
            } else {
                console.log(`[BACKEND] sent merged PDF:${filename}`);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to download merged PDF' });
    }
});
