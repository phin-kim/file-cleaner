import { GoogleGenAI, type Content } from '@google/genai';
import { readFileSync, existsSync } from 'fs';
import createLogger from '../utils/logger';
const log = createLogger('GeminiPdfMerger');
import type { QuestionExtractionResponse } from '../Types/filer-merger';
import { appConfig } from '../constants/appConfig';
import AppError from '../utils/appError';
import { Storage } from '@google-cloud/storage';
import pLimit from 'p-limit';
interface GeminiFileResponse {
    name: string;
    mimeType: string;
    uri: string;
}
const storage = new Storage({
    projectId: appConfig.projectId,
});
const BUCKET_NAME = 'tidy-up-exam-files';

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
        location = appConfig.location || 'us-central1',
        projectId = appConfig.projectId,
        model = appConfig.geminiModel || 'gemini-1.5-flash',
        maxRetries = appConfig.maxRetries,
        retryDelayMs = appConfig.retryDelayMs
    ) {
        log.debug(`Initializing Gemini processor with Model: ${model}, Project: ${projectId}, Location: ${location}`);

        if (appConfig.useVertexAi) {
            if (!projectId) {
                log.error('GOOGLE_CLOUD_PROJECT is missing from environment');
                throw new AppError('GOOGLE_CLOUD_PROJECT is required for Vertex AI', 500);
            }
            this.client = new GoogleGenAI({
                vertexai: true,
                location: location,
                project: projectId,
            });
        } else {
            if (!appConfig.geminiApiKey) {
                log.error('GEMINI_API_KEY is missing from environment');
                throw new AppError('GEMINI_API_KEY is required for Gemini API', 500);
            }
            this.client = new GoogleGenAI({
                apiKey: appConfig.geminiApiKey,
            });
        }

        this.model = model;
        this.maxRetries = maxRetries;
        this.retryDelayMs = retryDelayMs;
    }
    async processPdfs(pdfPaths: string[]): Promise<QuestionExtractionResponse> {
        log.highlight('Using native pdf vison approach');
        log.info('Uploading PDFs to gemini api...');
        //upload pdfs using files api
        const uploadedFiles = await this.getGcsFileReference(pdfPaths);
        log.info(`Ready to process ${uploadedFiles.length} GCS reference(s)`);
        log.info('Sending to Gemini for visual analysis and deduplication...');
        const BATCH_SIZE = 10;
        const limit = pLimit(2);
        const fileChunks: GeminiFileResponse[][] = [];
        for (let i = 0; i < uploadedFiles.length; i += BATCH_SIZE) {
            const chunk = uploadedFiles.slice(i, i + BATCH_SIZE);
            if (chunk.length > 0) fileChunks.push(chunk);
        }
        log.warn(`Queueing ${fileChunks.length} extraction batches ...`);
        // map chunks to parallel API tasks
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
                const contents = [
                    {
                        role: 'user',
                        parts: [...fileParts, { text: instruction }],
                    },
                ];
                const raw = await this.callGeminiWithRetry(contents);
                return this.parseBatchExtraction(raw);
            })
        );
        const batchResponses = await Promise.all(batchTasks);
        const merged = this.mergeBatchItems(batchResponses);
        return this.buildFinalResponse(merged);
    }
    /* private async uploadPdfs(
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
                    const ext = path.toLowerCase().split('.').pop();
                    const mimeType =
                        ext === 'docx'
                            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                            : 'application/pdf';

                    const uploadResult = (await this.client.files.upload({
                        file: new Blob([fileData]),
                        config: {
                            mimeType,
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
    } */
    //returns the GCS path this is a replacement for uplod pdfs coz Vertex AI cant process files directly like AIstudio
    private async getGcsFileReference(
        pdfPaths: string[]
    ): Promise<GeminiFileResponse[]> {
        log.highlight(
            `Syncing ${pdfPaths.length} local files to Google Cloud Storage...`
        );

        const bucket = storage.bucket(BUCKET_NAME);

        const uploadTasks = pdfPaths.map(async (localPath) => {
            const fileName = localPath.split(/[\\/]/).pop() || '';

            // Upload the local file to GCS
            await bucket.upload(localPath, {
                destination: fileName,
            });

            log.info(`Synced to GCS: ${fileName}`);

            const ext = fileName.toLowerCase().split('.').pop();
            const mimeType =
                ext === 'docx'
                    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    : 'application/pdf';

            return {
                uri: `gs://${BUCKET_NAME}/${fileName}`,
                mimeType,
                name: fileName,
            };
        });

        const fileReferences = await Promise.all(uploadTasks);
        return fileReferences as unknown as GeminiFileResponse[];
    }
    /**
     * build the extraction prompt for native pdf processing
     */
    private buildNativePrompt(fileNames: string[]): string {
        return `You are an expert academic assistant. Your task is to extract exam questions from the attached PDFs into a professional study worksheet.
Attached files (${fileNames.length}): ${fileNames.join(', ')}.

STRICT GROUNDING & ACADEMIC RULES:
- Read all the documents thoroughly. Extract the questions exactly as they appear in the source.
- Group related sub-questions (e.g., a, b, c) under their main question.
- Merge exact duplicates and near-duplicates. If two questions are semantically the same but worded slightly differently, keep ONLY ONE.
- Normalize the start of each extracted question: Strip away ALL leading numbering, bullets, or headers like "QUESTION 1", "Q1.", "(i)", etc. The output HTML should start directly with the question text.
- Retain marks allocation (e.g., [4 marks]) neatly.
- Do not include document preambles, explanations, instructions, or code fences.
- Use ONLY information found in the attached files.

OUTPUT FORMAT (JSON ONLY):
{
  "itemsHtml": "<li><strong>...</strong><br/><br/>a) ... [2 marks]<br/><br/>b) ... [4 marks]</li>",
  "totalCount": 0,
  "duplicatesRemoved": 0,
  "analysis": "Extraction complete."
}

HTML RULES:
- "itemsHtml" must contain a sequence of <li>...</li> elements ONLY.
- Combine each main question and its sub-parts into ONE SINGLE <li> element.
- DO NOT use nested <ol>, <ul>, or <li> tags. Use <br/><br/> for spacing.
- Emphasize the question body using <strong> tags.
- Keep mathematical notation intact.`;
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
                        thinkingConfig: {
                            includeThoughts: false,
                        },
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
    private parseBatchExtraction(response: string): {
        itemsHtml: string;
        totalCount: number;
        duplicatesRemoved: number;
        analysis: string;
    } {
        const cleaned = response
            .trim()
            .replace(/^```[a-z]*\n/i, '')
            .replace(/\n```$/i, '')
            .trim();
        try {
            const parsed = JSON.parse(cleaned) as Partial<{
                itemsHtml: string;
                totalCount: number;
                duplicatesRemoved: number;
                analysis: string;
            }>;
            const safeItems = this.sanitizeItemsHtml(parsed.itemsHtml ?? '');
            return {
                itemsHtml: safeItems,
                totalCount: Number(parsed.totalCount ?? 0),
                duplicatesRemoved: Number(parsed.duplicatesRemoved ?? 0),
                analysis: parsed.analysis ?? 'Extraction successful',
            };
        } catch (error) {
            log.warn('Gemini returned non-JSON for extraction batch', {
                data: { error: error instanceof Error ? error.message : error },
            });
            const safeItems = this.sanitizeItemsHtml(cleaned);
            return {
                itemsHtml: safeItems,
                totalCount: this.extractListItems(safeItems).length,
                duplicatesRemoved: 0,
                analysis: 'Fallback extraction used',
            };
        }
    }
    private mergeBatchItems(
        batches: Array<{
            itemsHtml: string;
            totalCount: number;
            duplicatesRemoved: number;
            analysis: string;
        }>
    ): {
        itemsHtml: string;
        totalCount: number;
        duplicatesRemoved: number;
        analysis: string;
    } {
        const allItems: string[] = [];
        let totalCount = 0;
        let duplicatesRemovedByModel = 0;
        for (const batch of batches) {
            totalCount += Math.max(0, batch.totalCount);
            duplicatesRemovedByModel += Math.max(0, batch.duplicatesRemoved);
            allItems.push(...this.extractListItems(batch.itemsHtml));
        }
        const seen = new Set<string>();
        const uniqueItems: string[] = [];
        for (const item of allItems) {
            const fingerprint = this.fingerprintItem(item);
            if (fingerprint.length === 0 || seen.has(fingerprint)) continue;
            seen.add(fingerprint);
            uniqueItems.push(item);
        }
        const deterministicRemoved = allItems.length - uniqueItems.length;
        return {
            itemsHtml: uniqueItems.join(''),
            totalCount: totalCount > 0 ? totalCount : allItems.length,
            duplicatesRemoved: Math.max(
                duplicatesRemovedByModel,
                deterministicRemoved
            ),
            analysis: `Merged ${batches.length} grounded batch(es) from source PDFs only`,
        };
    }
    private buildFinalResponse(merged: {
        itemsHtml: string;
        totalCount: number;
        duplicatesRemoved: number;
        analysis: string;
    }): QuestionExtractionResponse {
        return {
            html: `<ol class="exam-list">${merged.itemsHtml}</ol>`,
            uniqueCount: this.extractListItems(merged.itemsHtml).length,
            totalCount: merged.totalCount,
            duplicatesRemoved: merged.duplicatesRemoved,
            analysis: merged.analysis,
        };
    }
    private sanitizeItemsHtml(input: string): string {
        if (!input) return '';
        const liMatches = this.extractListItems(input);
        if (liMatches.length > 0) return liMatches.join('');
        return '';
    }
    private extractListItems(input: string): string[] {
        return input.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) ?? [];
    }
    private fingerprintItem(itemHtml: string): string {
        return itemHtml
            .replace(/<[^>]+>/g, ' ') // Remove HTML tags
            .replace(/&nbsp;/gi, ' ')
            .replace(/^(?:question|q|part|item)\s*(?:\d+|[a-z]|[ivx]+)[:.)\s-]*/i, '') // Remove "Question 1:", "Q1.", "a)", "(i)" etc.
            .replace(/^[0-9a-z]{1,2}[:.)\s-]+/i, '') // Remove "1.", "a.", "1)" at the start
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .toLowerCase();
    }
    /**
     * Build fallback HTML for unparseable responses
     */
    /* private buildFallbackHtml(content: string): string {
        return `<!DOCTYPE html>
        <html><head><meta charset="UTF-8">
        <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
        body{font-family:Georgia,serif;max-width:900px;margin:40px auto;padding:20px;line-height:1.6;color:#333}
        h1{text-align:center;border-bottom:2px solid #333;padding-bottom:10px}
        </style></head><body><h1>Unique Questions</h1><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
    } */
}
export async function processPdfsNative(
    pdfPaths: string[],
    model = appConfig.geminiModel
): Promise<QuestionExtractionResponse> {
    const processor = new GeminiNativePdfProcessor(
        appConfig.location,
        appConfig.projectId,
        model
    );
    return processor.processPdfs(pdfPaths);
}
