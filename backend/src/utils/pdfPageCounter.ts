import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

export async function countPdfPages(filePath: string): Promise<number> {
    const raw = await readFile(filePath);
    const pdf = await PDFDocument.load(raw, {
        ignoreEncryption: true,
    });
    return pdf.getPageCount();
}

export async function countPdfPagesFromPaths(
    pdfPaths: string[]
): Promise<number> {
    let totalPages = 0;
    for (const pdfPath of pdfPaths) {
        totalPages += await countPdfPages(pdfPath);
    }
    return totalPages;
}
