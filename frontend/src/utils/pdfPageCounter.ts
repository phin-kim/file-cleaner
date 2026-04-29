import { PDFDocument } from 'pdf-lib';

export async function countPdfPages(file: File): Promise<number> {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        return 0;
    }
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
    });
    return pdf.getPageCount();
}

export async function countPdfPagesFromFiles(files: File[]): Promise<number> {
    const counts = await Promise.all(files.map((file) => countPdfPages(file)));
    return counts.reduce((sum, count) => sum + count, 0);
}
