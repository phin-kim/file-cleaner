import PDFDocument from 'pdfkit';
import fs from 'fs-extra';

export default async function generatePDF(
    questions: string[],
    outputPath: string
) {
    return new Promise<void>((resolve) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        doc.fontSize(16).text('Merged Exam Questions', { align: 'center' });
        doc.moveDown();
        questions.forEach((question, indx) => {
            doc.fontSize(12).text(`${indx + 1}. ${question}`);
            doc.moveDown();
        });
        doc.end();
        stream.on('finish', resolve);
    });
}
