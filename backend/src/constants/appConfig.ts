import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../');
const MERGER_BASE_DIR = path.join(PROJECT_ROOT, 'output/file-merger-temps');

const MERGER_OUTPUTS = path.join(MERGER_BASE_DIR, 'outputs');

export const appConfig = {
    /** Google Gemini API Key */
    geminiApiKey: process.env.GEMINI_API_KEY || '',

    /** Gemini model to use */
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',

    /** Maximum retry attempts for API calls */
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),

    /** Base delay between retries in ms */
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '2000', 10),

    /** DPI for PDF to image conversion */
    pdfDpi: parseInt(process.env.PDF_DPI || '200', 10),

    /** Maximum pages per PDF (0 = unlimited) */
    maxPagesPerPdf: parseInt(process.env.MAX_PAGES_PER_PDF || '0', 10),

    /** Output directory for generated files */
    outputDir: MERGER_OUTPUTS,

    /** Puppeteer timeout in ms */
    puppeteerTimeout: parseInt(process.env.PUPPETEER_TIMEOUT || '60000', 10),

    /** Enable MathJax rendering in output HTML */
    enableMathRendering: process.env.ENABLE_MATH_RENDERING !== 'false',
} as const;
