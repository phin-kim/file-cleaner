import { GoogleGenAI, type Content, type Part } from '@google/genai';
import { readFileSync, existsSync } from 'fs';
import createLogger from '../utils/logger';
const log = createLogger('GeminiPdfMerger');
import type { QuestionExtractionResponse } from '../Types/filer-merger';
import { appConfig } from '../constants/appConfig';
import AppError from '../utils/appError';
import pLimit from 'p-limit';
interface GeminiFileResponse {
    name: string;
    mimeType: string;
    uri: string;
}
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
        const BATCH_SIZE = 5;
        const limit = pLimit(2);
        const fileChunks: GeminiFileResponse[][] = [];
        for (let i = 0; i < uploadedFiles.length; i += BATCH_SIZE) {
            const chunk = uploadedFiles.slice(i, i + BATCH_SIZE);
            if (chunk.length > 0) fileChunks.push(chunk);
        }
        log.warn(`Queueing ${fileChunks.length} extraction batches ...`);
        //map chunks to parallel API tasks
        const batchTasks = fileChunks.map((chunk, index) =>
            limit(async () => {
                log.info(
                    `Processing each batch #${index + 1} (${chunk.length}) files`
                );
                const fileParts = chunk.map((file) => ({
                    fileData: {
                        fileUri: file.uri,
                        mimeType: file.mimeType,
                    },
                }));
                /*const fileParts = uploadedFiles.map((file) => ({
                    fileData: {
                        fileUri: file.uri,
                        mimeType: file.mimeType,
                    },
                }));*/
                const instruction = this.buildNativePrompt(
                    chunk.map((f) => f.name)
                );
                const promptWithConstraint = `
                ${instruction}
                
                STRICT CONSTRAINT: Do not provide a preamble or thought process.
                - Use ONLY the attached ${chunk.length} files. 
                - Output must be valid JSON with the "itemsHtml" key containing only <li> tags.
                Go straight to the HTML output. 
                If you encounter duplicates within this batch, merge them immediately.
            `;

                const contents = [
                    {
                        role: 'user',
                        parts: [...fileParts, { text: promptWithConstraint }],
                    },
                ];
                //const contents = [...uploadedFiles, promptPart];

                return await this.callGeminiWithRetry(contents);
            })
        );
        //wait for all extractions to finish
        const batchResponses = await Promise.all(batchTasks);
        //final merge pass
        //we send all batch results to gemini one last time to remove duplicates and fix html
        const mergedResponses = await this.mergeBatchResponses(batchResponses);

        return this.parseResponse(mergedResponses, pdfPaths);
    }
    private async mergeBatchResponses(batchTexts: string[]): Promise<string> {
        if (batchTexts.length === 1) {
            // If there's only one batch, we still want to ensure it's wrapped in an <ol>
            return `<ol class="exam-list">${batchTexts[0]}</ol>`;
        }

        log.highlight('Merging batch results for final deduplication...');

        const mergePrompt = `
        The following are lists of exam questions extracted from multiple document batches.
        1. Combine them into a single, clean HTML document.
        2. Strictly remove any identical or nearly identical duplicate questions.
        3. Maintain the professional styling (question blocks, MathJax, etc.).
        4. Return ONLY the final deduplicated questions inside <li> tags. Do not explain your steps or provide Python code.
        DATA TO MERGE:
        ${batchTexts.join('\n\n---NEXT BATCH---\n\n')}
    `;

        const contents = [
            {
                role: 'user',
                parts: [{ text: mergePrompt }],
            },
        ];

        const mergedItems = await this.callGeminiWithRetry(contents);

        // 2. Wrap the items in the <ol> tag here
        const finalHtml = `<ol class="exam-list">${mergedItems}</ol>`;

        // 3. Return the wrapped HTML
        return finalHtml;
    }
    private async uploadPdfs(
        pdfPaths: string[]
    ): Promise<GeminiFileResponse[]> {
        log.highlight(
            `Starting parralel upload for ${pdfPaths.length} files ...`
        );
        const limit = pLimit(3);
        const uploadTasks = pdfPaths.map((path) =>
            limit(async () => {
                if (!existsSync(path)) return null;
                try {
                    log.info(`Uploading :${path.split('\\').pop()}`);
                    const fileData = readFileSync(path);
                    const uploadResult = (await this.client.files.upload({
                        file: new Blob([fileData]),
                        config: {
                            mimeType: 'application/pdf',
                        },
                    })) as GeminiFileResponse;
                    // files.push(uploadResult);
                    log.highlight(`Uploaded ${path}`);
                    return uploadResult;
                } catch (error: any) {
                    // Handle the 503 by logging clearly
                    log.error(
                        `Failed ${path.split('\\').pop()}: ${error.message || 'Service Unavailable'}`
                    );
                    return null;
                }
            })
        );
        const results = await Promise.all(uploadTasks);
        const successfulUploads = results.filter(
            (f): f is GeminiFileResponse => f !== null
        );
        log.highlight(
            `Successfully uploaded ${successfulUploads.length}/${pdfPaths.length} files.`
        );
        return successfulUploads;
    }
    /**
     * build the extraction prompt for native pdf processing
     */
    private buildNativePrompt(fileNames: string[]): string {
        /*"html": "<!DOCTYPE html><html>...</html>",
        "uniqueCount": 25,*/
        return `You are an expert educational content analyzer. I have provided you with ${fileNames.length} PDF document(s): ${fileNames.join(', ')}.

        These PDFs contain exam questions. Your task:

        1. **VISUALLY ANALYZE every page** of every PDF using your document vision capability
        2. **Extract ALL questions** found across all documents
        3. **DETECT AND REMOVE DUPLICATES**: If the same question (or essentially the same question with minor wording differences) appears in multiple documents, keep only ONE instance
        4. **Return the unique questions as well-formatted HTML**
        5. STRICTURE: Do not add any external knowledge, trivia, or general questions. If it is not in the source, it is FORBIDDEN to include it.
        6. NO PREAMBLE: Do not say "Here are the questions" or "I have analyzed the files."

        CRITICAL INSTRUCTIONS:
        - You have access to BOTH the visual rendering of each page AND the native text embedded in the PDFs
        - For mathematical formulas: use the native extracted text to get accurate LaTeX, then format as \\( \\) for inline and \\[ \\] for display math
        - Preserve question numbering (1, 2, 3...)
        - Maintain sub-parts structure (a, b, c, i, ii...)
        - Preserve tables, diagrams (describe them in text if needed)
        - For multiple choice questions, keep all options (A, B, C, D)
        - Group question parts together (don't split a multi-part question)
        - Do not wrap them in <html> or <body> tags.

        OUTPUT FORMAT - Return ONLY a JSON object:
        {
        "itemsHtml": "<li>Question 1...</li><li>Question 2...</li>",
        
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
    private async callGeminiWithRetry(
        // parts: Part[],
        contents: Content[]
    ): Promise<string> {
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
                        maxOutputTokens: 16384,
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
        log.error('Unexpected end of loop');
        throw new AppError('Unexpected end of retry loop', 500, 'GeminiRetry');
    }
    private parseResponse(
        response: string,
        pdfPaths: string[]
    ): QuestionExtractionResponse {
        let cleaned = response.trim();
        // Remove markdown code fences
        /**
         * it failed on merge coz it was returning html and we expected json so we handle both 
         * if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();*/
        // 1. Better Markdown Fence Removal (Handles ```html, ```json, etc.)
        cleaned = cleaned
            .replace(/^```[a-z]*\n/i, '')
            .replace(/\n```$/i, '')
            .trim();

        // 2. Heuristic Check: Is this JSON or just raw HTML?
        const looksLikeJson = cleaned.startsWith('{') && cleaned.endsWith('}');

        if (looksLikeJson) {
            try {
                const parsed = JSON.parse(
                    cleaned
                ) as Partial<QuestionExtractionResponse>;
                return {
                    html: parsed.html || this.buildFallbackHtml(cleaned),
                    uniqueCount: parsed.uniqueCount || 0,
                    totalCount: parsed.totalCount || 0,
                    duplicatesRemoved: parsed.duplicatesRemoved || 0,
                    analysis: parsed.analysis || 'Extraction successful',
                };
            } catch (e) {
                log.warn(
                    'Response looked like JSON but parsing failed. Falling back to HTML treatment.'
                );
            }
        }

        // 3. Treatment as Raw HTML (The Merge Result)
        // If it's not JSON, the entire response is likely the HTML content itself.
        log.info('Treating response as direct HTML content');
        return {
            html: this.ensureHtmlWrapped(cleaned), // Ensure it has <body> etc.
            uniqueCount: (cleaned.match(/<li|<div class="question"/g) || [])
                .length, // Rough count
            totalCount: 0,
            duplicatesRemoved: 0,
            analysis: 'Merged from multiple batches',
        };
    }
    /**
     * Ensures that if Gemini sends back raw snippets, they are valid HTML
     */
    private ensureHtmlWrapped(content: string): string {
        if (content.includes('<html') || content.includes('<body'))
            return content;
        return `<div class="extracted-content">${content}</div>`;
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
