import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import createLogger from './logger.js';

const log = createLogger('Pdf generator');
export default async function generatePDF(
    questions: string[],
    outputPath: string
) {
    return new Promise<void>((resolve, reject) => {
        log.highlight('generating pdf');
        const doc = new PDFDocument({
            size: 'A4',
            bufferPages: true, //allows to add page numbers at the end
            margin: 50,
        });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        //adding header and branding
        doc.fillColor('#2c3e50')
            .fontSize(20)
            .text('Tidy-up Exam Prep', { align: 'center' });
        doc.fontSize(10)
            .fillColor('#7f8c8d')
            .text(`Generated on ${new Date().toLocaleDateString()}`, {
                align: 'center',
            });
        doc.moveDown(2);
        //Draw a separator line
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#eee').stroke();
        doc.moveDown(1.5);
        //loop through the questions with "SPACE CHECKING"

        questions.forEach((question, indx) => {
            const questionText = `${indx + 1}.${question.trim()}`;
            const heightNeeded = doc.heightOfString(questionText, {
                width: 495,
            });
            if (doc.y + heightNeeded > 750) {
                // If near bottom of A4
                doc.addPage();
            }
            doc.fillColor('#000000').fontSize(12).text(questionText, {
                align: 'left',
                lineGap: 4,
                paragraphGap: 10,
            });

            doc.moveDown(0.5); // Space between questions
        });

        doc.end();
        stream.on('finish', () => {
            log.highlight(
                'Done generating pdf for backend to send url to frontend'
            );
            resolve();
        });
        stream.on('error', (streamError) => {
            log.error('PDF stream error', { data: { streamError } });
            reject(streamError);
        });
    });
}
