import fs from 'fs-extra';
import { PDFParse } from 'pdf-parse';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { InferenceClient } from '@huggingface/inference';
import path from 'path';
const huggingFace = new InferenceClient(process.env.HF_API_KEY);
const AI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
import pLimit from 'p-limit';
import createLogger from './logger';
import { cleanupByAge } from './cleanUp';
import { fileURLToPath } from 'url';
import cleanMergedQuestions from '../helpers/cleanMerged';
import isValidQuestion from '../helpers/checkValidity';
import cosineSimilarity from '../helpers/similarityCheck';
import clusterKey from '../helpers/clusterKey';
import {
    sleep,
    normalizeQuestions,
    trimEmbeddingsCache,
} from '../helpers/miniHelpers';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//using absolute path instead of relive ones
const mergeCachePath = path.join(__dirname, '../../merged-cache.json');
const embeddingCachePath = path.join(__dirname, '../../embeddings-cache.json');
const log = createLogger('FILE MERGER');

//  Save locks to prevent race conditions
let isSavingMerge = false;
let isSavingEmbedding = false;

//  Cache size limits to prevent memory leaks

//  Retry configuration for API calls
//const MAX_RETRIES = 3;
//const RETRY_DELAY_MS = 1000;

let mergeCache: Record<string, string> = {};
export let embeddingCache: Record<string, number[]> = {};

//ensure cache directories exist b4 any operations
const cacheDir = path.dirname(mergeCachePath);
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    log.info(`created cache directory: ${cacheDir}`);
}
//load cache if it exists
// Replace your current load section with this:
if (fs.existsSync(mergeCachePath)) {
    try {
        const content = fs.readFileSync(mergeCachePath, 'utf-8');
        if (content.trim()) {
            const parsed = JSON.parse(content);
            if (typeof parsed === 'object' && parsed !== null) {
                mergeCache = parsed;
                log.debug(
                    `✅ Loaded ${Object.keys(mergeCache).length} merge cache entries`
                );
            } else {
                throw new Error('Invalid cache format');
            }
        } else {
            log.warn('Merge cache file is empty, starting fresh');
            mergeCache = {};
        }
    } catch (error) {
        log.error('Failed to parse merge cache, starting fresh:', {
            data: { error },
        });
        mergeCache = {};
        // Optionally backup the corrupt file
        fs.renameSync(
            mergeCachePath,
            mergeCachePath + '.corrupt.' + Date.now()
        );
    }
}

if (fs.existsSync(embeddingCachePath)) {
    try {
        const content = fs.readFileSync(embeddingCachePath, 'utf-8');
        if (content.trim()) {
            const parsed = JSON.parse(content);
            if (typeof parsed === 'object' && parsed !== null) {
                //spot check first entry and correct format
                const sampleKey = Object.keys(parsed)[0];
                if (sampleKey) {
                    const sampleValue = parsed[sampleKey];
                    if (
                        !Array.isArray(sampleValue) ||
                        !sampleValue.every((n) => typeof n === 'number')
                    ) {
                        throw new Error(
                            'Embeddings contain invalid data format '
                        );
                    }
                }
                embeddingCache = parsed;
                log.debug(
                    `✅ Loaded ${Object.keys(embeddingCache).length} embeddings cache from entries`
                );
            }
        } else {
            log.warn('Embedding cache file is empty, starting fresh');
            embeddingCache = {};
        }
    } catch (error) {
        log.error('Failed to parse embedding cache, starting fresh:', {
            data: { error },
        });
        embeddingCache = {};
        fs.renameSync(
            embeddingCachePath,
            embeddingCachePath + '.corrupt.' + Date.now()
        );
    }
}
//save cache helper
//Race condition proof saves with temp files and lks
function saveMergeCache() {
    if (isSavingMerge) {
        log.debug(`⏳ merge cache save already in progress, skipping`);
        return;
    }
    try {
        isSavingMerge = true;
        // Only save if there's actual data
        if (Object.keys(mergeCache).length === 0) {
            log.debug('Merge cache is empty, skipping save');
            return;
        }

        // Write to a temp file first, then rename (prevents corruption)
        const tempPath = mergeCachePath + '.tmp';
        fs.writeJSONSync(tempPath, mergeCache, { spaces: 2 });
        fs.renameSync(tempPath, mergeCachePath);

        log.debug(
            `✅ Merge cache saved with ${Object.keys(mergeCache).length} entries`
        );
    } catch (error) {
        log.error('Failed to save merge cache:', { data: { error } });
    }
}

export function saveEmbeddingsCache() {
    if (isSavingEmbedding) {
        log.debug(
            `⏳ Embedding cache save already exists in progress, skipping`
        );
        return;
    }
    try {
        isSavingEmbedding = true;
        if (Object.keys(embeddingCache).length === 0) {
            log.debug('Embedding cache is empty, skipping save');
            return;
        }

        const tempPath = embeddingCachePath + '.tmp';
        fs.writeJSONSync(tempPath, embeddingCache, { spaces: 2 });
        fs.renameSync(tempPath, embeddingCachePath);

        log.debug(
            `✅ Embedding cache saved with ${Object.keys(embeddingCache).length} entries`
        );
    } catch (error) {
        log.error('Failed to save embedding cache:', { data: { error } });
    }
}
//cache size management to prevent leaks

/**
Upload folder -> temp storage
        
1). Extract questions from each file
        
2). Create embeddings for each question (vector representation)
        
3). Cluster similar questions across all files
        
4). Merge questions in each cluster using AI summarization
        
5). Generate single PDF with all questions
        
6). Return PDF download link
 */

//extract the text from the files
export const extractTextFromFile = async (
    filePath: string
): Promise<string> => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.txt') {
            return await fs.readFile(filePath, 'utf-8');
        }
        if (ext === '.pdf') {
            const buffer = await fs.readFile(filePath); // Buffer
            const uint8Array = new Uint8Array(buffer); // Convert to Uint8Array
            const parser = new PDFParse(uint8Array); // parse PDF
            const text = await parser.getText();
            return text.text;
        }
        if (ext === '.docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        }
        console.warn(`[SKIP] Unsupported file type${filePath}`);
        return '';
    } catch (error) {
        console.log(`[PARSE ERROR],${filePath}`, error);
        return '';
    }
};
/**
 * Extract questions from exam-style text
 * Handles:
 * - QUESTION ONE / QUESTION TWO headings
 * - Sub-questions a), b), c), ...
 * - Multi-line questions
 * - Questions without question marks
 */
export function extractQuestion(text: string): string[] {
    /*splits questions into an array of lines
    ["QUESTION ONE", "a) Outline FOUR features of Java (4 marks)", "b) Write a program ...", ""]*/

    const lines = text.split(/\r?\n/);
    const questions: string[] = [];
    let currentQuestion = '';
    log.debug(`[DEBUG] Total lines to process: ${lines.length}`);
    //patterns to skip (HEADER,INSTRUCTIONS,METADATA)
    const skipPatterns = [
        /^\s*BACHELOR OF/i,
        /^\s*Instructions:/i,
        /^\s*QUESTION\s*(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\s*$/i, // Just the header, not the content
        /^--\s*\d+\s*of\s*\d+\s*--/i, // Page markers
        /Examination Irregularity/i,
        /Page \d+ of \d+/i,
        /^\s*\d+\s*$/, // Just numbers
        /^\s*Merged question:/i,
        /^\s*Here's\s*$/i,
        /^\s*Please\s*$/i,
        /^\s*These are not/i,
        /^\s*The provided input/i,
        /^\s*Models are/i,
        /^\s*Analyze and discuss/i,
    ];
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        //skip meta data lines entirely
        if (skipPatterns.some((pattern) => pattern.test(line))) continue;
        //detect start of a new main question or sub-question
        const isMainQuestion =
            /^QUESTION\s+\w+/i.test(line) && line.length > 15;
        const isSubQuestion = /^[a-z]\)\s+\w/.test(line); // Must have content after "a) "
        // Must have marks indicator
        const hasMarks = /\(\d+\s*marks?\)/i.test(line);
        //more strict detection :must have marks or be a sub-question with substantive content
        const isQuestionStart = isSubQuestion || (isMainQuestion && hasMarks);
        if (isQuestionStart) {
            if (currentQuestion && isValidQuestion(currentQuestion)) {
                questions.push(currentQuestion.trim());
            }
            currentQuestion = line;
        } else if (currentQuestion) {
            //continuation but only if it looks like a question content
            if (!skipPatterns.some((patterns) => patterns.test(line))) {
                currentQuestion += ' ' + line;
            }
        }
    }
    if (currentQuestion && isValidQuestion(currentQuestion)) {
        questions.push(currentQuestion.trim());
    }
    log.debug(`[DEBUG] Questions extracted: ${questions.length}`);
    return questions;
}

/**
 * Get embeddings for a list of questions
 */
//sends in batches
export async function getEmbeddings(questions: string[]): Promise<number[][]> {
    //prepare cache keys
    const keys = questions.map((question) => normalizeQuestions(question));
    //initialize results array with cached embeddings where available

    //identify which questions aren't cached

    const uncachedQuestions = questions.filter(
        (question, indx) => !embeddingCache[keys[indx]]
    );
    if (uncachedQuestions.length > 0) {
        console.log(
            `Generating embeddings for ${uncachedQuestions.length} new questions ...`
        );
        //batch requests to HF
        const batchSize = 50;
        for (let i = 0; i < uncachedQuestions.length; i += batchSize) {
            const batch = uncachedQuestions.slice(i, i + batchSize);
            try {
                const response = await huggingFace.featureExtraction({
                    model: 'sentence-transformers/all-MiniLM-L6-v2',
                    inputs: batch,

                    provider: 'hf-inference',
                });
                if (Array.isArray(response)) {
                    //save new embeddings to cache
                    batch.forEach((question, indx) => {
                        const key = normalizeQuestions(question);
                        const embedding = response[indx];
                        if (
                            Array.isArray(embedding) &&
                            embedding.every((n) => typeof n === 'number')
                        ) {
                            embeddingCache[key] = embedding;
                        } else {
                            log.error(
                                `Invalid embedding format received for question`,
                                {
                                    data: {
                                        questionPreview: question.substring(
                                            0,
                                            50
                                        ),
                                    },
                                }
                            );
                        }
                    });
                } else {
                    log.error('Unexpected response format from hugging face');
                }
                saveEmbeddingsCache();
                //trim embedding after adding new entries
                trimEmbeddingsCache();
            } catch (error) {
                log.error('Failed to generate embeddings batch', {
                    data: {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        batchSize: batch.length,
                    },
                });
                throw new Error(
                    'Embedding generations failed.Can not continue processing'
                );
            }
        }
    }
    log.highlight('Done with the embeddings ');
    return questions.map(
        (question) => embeddingCache[normalizeQuestions(question)]
    );
}

export function clusterQuestions(
    questions: string[],
    embeddings: number[][],
    threshold = 0.8
): string[][] {
    log.highlight('Starting cluster');
    const clusters: { [key: string]: number[] } = {};
    questions.forEach((quest, indx) => {
        let added = false;
        for (const clusterID in clusters) {
            const sim = cosineSimilarity(
                embeddings[indx],
                embeddings[clusters[clusterID][0]]
            );
            if (sim > threshold) {
                clusters[clusterID].push(indx);
                added = true;
                break;
            }
        }
        if (!added) clusters[indx] = [indx];
    });
    log.highlight(
        `Clustering complete: ${Object.keys(clusters).length} clusters formed`
    );
    //convert index clusters to actual questions
    log.highlight('Ending clustering');
    return Object.values(clusters).map((indices) =>
        indices.map((ind) => questions[ind])
    );
}
/*retry Wrapper for gemini api calls
async function mergeClusterWithRetry(questions: string[], retries = MAX_RETRIES): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await mergeCluster(questions);
        } catch (error) {
            if (attempt === retries) {
                log.error(`All ${retries} retry attempts failed`, {
                    data: { error: error instanceof Error ? error.message : String(error) }
                });
                return questions[0]; // Fallback to first question
            }
            
            const waitTime = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
            log.warn(`Merge failed, retrying in ${waitTime}ms (attempt ${attempt}/${retries})`);
            await sleep(waitTime);
        }
    }
    return questions[0]; // TypeScript satisfaction
}
*/

export async function mergeCluster(questions: string[]): Promise<string> {
    // Pre-check: if questions are nearly identical, just return the longest one
    const normalized = questions.map((q) =>
        q.toLowerCase().replace(/\s+/g, ' ').trim()
    );
    if (new Set(normalized).size === 1) {
        return questions.reduce((a, b) => (a.length > b.length ? a : b)); // Return longest
    }
    const prompt = `
You are merging duplicate or highly similar exam questions into ONE well-formatted question.

STRICT RULES:
1. Output ONLY the merged question text - NO labels like "Merged question:", NO explanations, NO markdown
2. MUST preserve: question letter/number (e.g., "a)", "b)", "1."), mark values (e.g., "(4 marks)"), and the complete question text
3. If questions are fragments that form one complete question, combine them into a single coherent question
4. If questions are different, pick the most complete and well-formed one
5. NEVER output multiple choice options unless they exist in all inputs
6. NEVER truncate or cut off the question mid-sentence
7. Maximum length: 300 characters
8. If input is garbage (just "Here's", "Please", etc.), output "INVALID"

Examples of GOOD output:
"a) Explain the concept of database normalization and its importance. (4 marks)"
"b) Distinguish between primary key and foreign key with examples. (6 marks)"
"c) Write SQL commands to create a table and insert records. (8 marks)"

Input questions to merge:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Output only the single best merged question:

`;
    log.highlight('Start merging clusters');

    try {
        const response = await AI.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction:
                    'You merge duplicate exam questions into ONE well-formatted academic question. Return ONLY the merged question, no explanations, no metadata, no multiple questions.',
                maxOutputTokens: 150,
                temperature: 0.1,
            },
            contents: [
                {
                    text: prompt,
                },
            ],
        });
        let merged = response.text?.trim() ?? '';
        // Post-process cleanup
        merged = merged
            .replace(/^Merged question:\s*/i, '')
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .replace(/\n+/g, ' ')
            .trim();

        // Validate output
        if (
            merged.length < 10 ||
            /^(Here's|Please|These are|Models are|Analyze|Explain|INVALID)$/i.test(
                merged
            )
        ) {
            // Fallback to best original question
            return questions.reduce((a, b) => (a.length > b.length ? a : b));
        }
        log.highlight('Finalize merging clusters');
        if (!merged) throw new Error('No response from Gemini');
        //cleanup any remaining formatting issues
        return cleanMergedQuestions(merged, questions);
    } catch (error) {
        const errorDetails: Record<string, unknown> = {
            message: error instanceof Error ? error.message : String(error),
        };

        if (error instanceof Error) {
            errorDetails.stack = error.stack;
            errorDetails.name = error.name;

            // Safe property access without type assertions
            const possibleCode = (error as { code?: unknown }).code;
            if (typeof possibleCode === 'string') {
                errorDetails.systemCode = possibleCode;
            }

            const possibleCause = (error as { cause?: unknown }).cause;
            if (possibleCause) {
                errorDetails.cause = possibleCause;
                if (possibleCause instanceof Error) {
                    errorDetails.causeMessage = possibleCause.message;
                    errorDetails.causeStack = possibleCause.stack;
                }
            }
        }

        log.error('Gemini merge failed', { data: { errorDetails } });

        log.debug('Failed cluster questions', {
            data: {
                questionCount: questions.length,
                preview: questions.slice(0, 2),
            },
        });

        return questions[0];
    }
}
export async function processUploadedFiles(folderPath: string) {
    try {
        log.highlight('Starting to process the files');
        const oldFiles = await fs.readdir(folderPath);
        for (const file of oldFiles) {
            const filePath = path.join(folderPath, file);
            const stat = await fs.stat(filePath);
            //delete files older than 1 hour
            if (Date.now() - stat.mtimeMs > 60 * 60 * 1000) {
                await fs.remove(filePath);
                log.debug(`Removed old file:${file}`);
            }
        }
        //get current files
        let files = await fs.readdir(folderPath);
        files = files.filter((file) => !file.startsWith('~$'));
        //check for duplicate name pa
        const uniqueFiles: string[] = [];
        const seen = new Set();
        for (const file of files) {
            //extract base name without timestamp
            const basename = file
                .replace(/^\d+-/, '')
                .replace(/^\d{13,14}/, '');
            if (!seen.has(basename)) {
                seen.add(basename);
                uniqueFiles.push(file);
            } else {
                log.debug(`🚮 Skipping duplicate: ${file}`);
                //delete duplicate
                await fs.remove(path.join(folderPath, file));
            }
        }
        files = uniqueFiles;

        //extract all questions
        const allQuestions: string[] = [];
        for (const file of files) {
            const fullPath = path.join(folderPath, file);
            log.debug(`[PROCESSING FILE] `, { data: { fullPath } });
            const text = await extractTextFromFile(fullPath);
            log.info('Extracting texts from files ');
            const questions = extractQuestion(text);
            log.debug('Extracting questions');
            allQuestions.push(...questions);
        }
        log.debug(`All questions are ${allQuestions.length}`);
        if (allQuestions.length === 0) return [];
        //create embeddings
        const embeddings = await getEmbeddings(allQuestions);
        log.debug('Getting embeddings');
        // cluster similar questions
        const clusters = clusterQuestions(allQuestions, embeddings, 0.8);
        const limit = pLimit(2);
        const mergedQuestions = await Promise.all(
            clusters.map((cluster) =>
                limit(async () => {
                    //unique questions return as-is
                    if (cluster.length === 1) return cluster[0];
                    //use cache key
                    const key = clusterKey(cluster.slice(0, 5));
                    if (mergeCache[key]) {
                        log.debug('Using cached merged questions');
                        return mergeCache[key];
                    }
                    await sleep(800);
                    // Skip merging if cluster contains garbage
                    const hasGarbage = cluster.some((q) =>
                        /^(Here's|Please|These are|Instructions|BACHELOR)/i.test(
                            q.trim()
                        )
                    );
                    if (hasGarbage) {
                        // Return the longest valid question from cluster
                        const valid = cluster.filter((q) => isValidQuestion(q));
                        return valid.length > 0
                            ? valid.reduce((a, b) =>
                                  a.length > b.length ? a : b
                              )
                            : '';
                    }
                    //limit prompt size
                    const trimmedCluster = cluster.slice(0, 5);
                    //if questions are identical pick the first one
                    const first = normalizeQuestions(cluster[0]);
                    const allSame = cluster.every(
                        (quest) => normalizeQuestions(quest) === first
                    );

                    if (allSame) {
                        return cluster[0];
                    }
                    //otherwise call gemini
                    const merged = await mergeCluster(trimmedCluster);
                    mergeCache[key] = merged;
                    saveMergeCache();
                    return merged;
                })
            )
        );
        // after processing ,cleanup temp folder
        log.highlight('finalize the processing of files');
        await cleanupByAge(folderPath, 'TEMP-CLEANUP');
        return mergedQuestions.filter(
            (question) => question && isValidQuestion(question)
        );
    } catch (error) {
        log.error(`Processing failed`, {
            context: 'failed cleaning',
            data: { error },
        });
        //even on error try clean up
        await cleanupByAge(folderPath, 'TEMP_CLEANUP_ERROR');
        throw error;
    }
}
