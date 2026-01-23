import { Router } from 'express';
import path from 'path';
import fs from 'fs-extra';
import multer from 'multer';
import { processUploadedFiles } from '../utils/fileMerger';
import generatePDF from '../utils/generatePDF';
export const mergerRoute = Router();
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const folderName = req.body.folderName || 'folder';
        const uploadPath = path.join(
            process.cwd(),
            'backend/temp/uploads',
            folderName
        );
        await fs.ensureDir(uploadPath);
        cb(null, file.originalname);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
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
            'backend/temp/uploads',
            folderName
        );
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
        const outputFile = path.join(
            process.cwd(),
            'backend/temp',
            `merged-${Date.now()}.pdf`
        );
        await generatePDF(mergedQuestions, outputFile);
        setTimeout(
            () => {
                fs.remove(uploadDir).catch(console.error);
            },
            2 * 60 * 60 * 1000
        );
        res.json({
            success: true,
            downloadURL: `/downloads/${path.basename(outputFile)}`,
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
