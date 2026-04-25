import { GoogleGenAI } from '@google/genai';
import { readFileSync, existsSync } from 'fs';
import createLogger from '../utils/logger';
const log = createLogger('GeminiPdfMerger');
import type { QuestionExtractionResponse } from '../Types/filer-merger';
import { appConfig } from '../constants/appConfig';
import AppError from '../utils/appError';
/**
 * native pdf processor using Gemini's built-in document vision capabilities
 * This approach uploads PDFs directly to Gemini and leverages its visual understanding
 * to extract and deduplicate questions without manual OCR or image processing.
 */
export class GeminiNativePdfProcessor {
    private client: GoogleGenAI;
    private model: string;
    private maxRetries: number;
    private retryDelayMs: number;
    constructor(
        apiKey = appConfig.geminiApiKey,
        model = appConfig.geminiModel,
        maxRetries = appConfig.maxRetries,
        retryDelayMs = appConfig.retryDelayMs
    ) {
        this.client = new GoogleGenAI({ apiKey });
        this.model = model;
        this.maxRetries = maxRetries;
        this.retryDelayMs = retryDelayMs;
    }
    async processPdfs(pdfPaths: string[]): Promise<QuestionExtractionResponse> {
        log.highlight('Using native pdf vison approach');
        log.info('Uploading PDFs to gemini api...');
        //upload pdfs using files api
        const uploadedFiles = await this.uploadPdfs(pdfPaths);
        log.info(`Uploaded ${uploadedFiles.length} PDF(s)`);
        log.info('Sending to Gemini for visual analysis and deduplication...');
        //build prompt and send uploaded files
        const prompt = this.buildNativePrompt(
            uploadedFiles.map((file) => file.name)
        );
        const contents = [...uploadedFiles.map((file) => file), prompt];
        //call gemini with retry
        const response = await this.callGeminiWithRetry(contents);
        return this.parseResponse(response, pdfPaths);
    }
    private async uploadPdfs(pdfPaths: string[]): Promise<unknown[]> {
        const files: unknown[] = [];
        for (const path of pdfPaths) {
            if (!existsSync(path)) {
                log.warn(`File not found skipping:${path}`);
                continue;
            }
            try {
                log.info(`Uploading ${path}`);
                //read file and upload files via Files API
                const fileData = readFileSync(path);
                const uploadResult = await this.client.files.upload({
                    file: new Blob([fileData]),
                    config: {
                        mimeType: 'application/pdf',
                    },
                });
                files.push(uploadResult);
                log.highlight(`Uploaded ${path}`);
            } catch (error) {
                const msg =
                    error instanceof Error ? error.message : String(error);
                log.error(`Failed to upload ${path}: ${msg}`);
                // Continue with other files
            }
        }
        if (files.length === 0) {
            throw AppError.badRequest('No PDFs were successfully uploaded');
        }
        return files;
    }
    /**
     * build the extraction prompt for native pdf processing
     */
    private buildNativePrompt(fileNames: string[]): string {
        return `You are an expert educational content analyzer. I have provided you with ${fileNames.length} PDF document(s): ${fileNames.join(', ')}.

        These PDFs contain exam questions. Your task:

        1. **VISUALLY ANALYZE every page** of every PDF using your document vision capability
        2. **Extract ALL questions** found across all documents
        3. **DETECT AND REMOVE DUPLICATES**: If the same question (or essentially the same question with minor wording differences) appears in multiple documents, keep only ONE instance
        4. **Return the unique questions as well-formatted HTML**

        CRITICAL INSTRUCTIONS:
        - You have access to BOTH the visual rendering of each page AND the native text embedded in the PDFs
        - For mathematical formulas: use the native extracted text to get accurate LaTeX, then format as \\( \\) for inline and \\[ \\] for display math
        - Preserve question numbering (1, 2, 3...)
        - Maintain sub-parts structure (a, b, c, i, ii...)
        - Preserve tables, diagrams (describe them in text if needed)
        - For multiple choice questions, keep all options (A, B, C, D)
        - Group question parts together (don't split a multi-part question)

        OUTPUT FORMAT - Return ONLY a JSON object:
        {
        "html": "<!DOCTYPE html><html>...</html>",
        "uniqueCount": 25,
        "totalCount": 40,
        "duplicatesRemoved": 15,
        "analysis": "Brief summary of what was found"
        }

        HTML REQUIREMENTS:
        - Complete valid HTML5 document
        - Include MathJax 3 for formula rendering:
        <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        - Clean serif typography with proper spacing
        - Clear header: "Unique Questions (Deduplicated)"
        - List source document names
        - Professional academic formatting`;
    }
    /**Call gemini with exponential backoff retry */
    private async callGeminiWithRetry(contents: unknown): Promise<string> {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                log.highlight(
                    `Gemini api call (attempt ${attempt}/${this.maxRetries})...`
                );
                const result = await this.client.models.generateContent({
                    model: this.model,
                    contents,
                    config: {
                        temperature: 0.1,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    },
                });
                const text = result.text;
                if (!text) {
                    log.error('No response from gemini api ', {
                        data: { result },
                    });
                    throw AppError.badRequest('No response from Gemini');
                }
                log.highlight('Gemini api call successful');
                return text;
            } catch (error) {
                const msg =
                    error instanceof Error ? error.message : String(error);
                log.error(`Gemini API call failed attempt (${attempt}):`, {
                    data: { error },
                });
                if (attempt === this.maxRetries) {
                    log.error('All the retries have failed', { data: { msg } });
                    throw AppError.serviceUnavailable(
                        `All ${this.maxRetries} attempts failed :${msg}`
                    );
                }
                const waitTime = this.retryDelayMs * Math.pow(2, attempt - 1);
                log.warn(`Retry in ${waitTime}ms ...`);
                await new Promise((res) => setTimeout(res, waitTime));
            }
        }
        log.error('UN expected end of loop');
        throw new AppError('Unexpected end of retry loop', 500, 'GeminiRetry');
    }
    private parseResponse(
        response: string,
        pdfPaths: string[]
    ): QuestionExtractionResponse {
        let cleaned = response.trim();
        // Remove markdown code fences
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();
        try {
            const parsed = JSON.parse(
                cleaned
            ) as Partial<QuestionExtractionResponse>;
            return {
                html: parsed.html || this.buildFallbackHtml(cleaned),
                uniqueCount: parsed.uniqueCount || 0,
                totalCount: parsed.totalCount || 0,
                duplicatesRemoved: parsed.duplicatesRemoved || 0,
                analysis: parsed.analysis || 'Processing complete',
            };
        } catch {
            log.warn('Failed to parse JSON, using raw response as HTML');
            return {
                html: this.buildFallbackHtml(response),
                uniqueCount: 0,
                totalCount: 0,
                duplicatesRemoved: 0,
                analysis: 'Parsed from non-JSON response',
            };
        }
    }
    /**
     * Build fallback HTML for unparseable responses
     */
    private buildFallbackHtml(content: string): string {
        return `<!DOCTYPE html>
        <html><head><meta charset="UTF-8">
        <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
        body{font-family:Georgia,serif;max-width:900px;margin:40px auto;padding:20px;line-height:1.6;color:#333}
        h1{text-align:center;border-bottom:2px solid #333;padding-bottom:10px}
        </style></head><body><h1>Unique Questions</h1><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
    }
}
export async function processPdfsNative(
    pdfPaths: string[],
    model = appConfig.geminiModel
): Promise<QuestionExtractionResponse> {
    const processor = new GeminiNativePdfProcessor(
        appConfig.geminiApiKey,
        model
    );
    return processor.processPdfs(pdfPaths);
}
