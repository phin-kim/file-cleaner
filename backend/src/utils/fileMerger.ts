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
const MAX_CACHE_ENTRIES = 10000;

//  Retry configuration for API calls
//const MAX_RETRIES = 3;
//const RETRY_DELAY_MS = 1000;

let mergeCache: Record<string, string> = {};
let embeddingCache: Record<string, number[]> = {};

//ensure cahe directories exist b4 any operations
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
                    `✅ Loaded ${Object.keys(embeddingCache).length} embeddings cahce from entries`
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
//Race conditon proof saves withtemp files and lks
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

function saveEmbeddingsCache() {
    if (isSavingEmbedding) {
        log.debug(
            `⏳ Embedding cache save already exists in progresss, skipping`
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
//cache size manaegemnt to prevent leaks
function trimEmbeddingsCache() {
    if (Object.keys(embeddingCache).length > MAX_CACHE_ENTRIES) {
        const entries = Object.entries(embeddingCache);
        const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
        toRemove.forEach(([key]) => delete embeddingCache[key]);
        log.debug(
            `✂ Trimmed embeddings chase to a max of ${MAX_CACHE_ENTRIES} entries`
        );
        saveEmbeddingsCache();
    }
}
function clusterKey(cluster: string[]) {
    return cluster
        .map((question) => question.toLowerCase().trim())
        .sort()
        .join('|');
}
function normalizeQuestions(question: string) {
    return question.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}
function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
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
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        //detect start of a new main question or subquestion
        const isMainQuestion = /^QUESTION\s+\w+/i.test(line);
        const isSubQuestion = /^[a-z]\)/i.test(line);
        const hasMarksorKeywords =
            /(marks|Write|Describe|Outline|Define|Differentiate|Compute|Calculate)/i.test(
                line
            );
        if (isMainQuestion || isSubQuestion || hasMarksorKeywords) {
            //save previous question if exists
            if (currentQuestion) {
                questions.push(currentQuestion.trim());
            }
            currentQuestion = line;
        } else {
            //consinuation of prevous question (multiline)
            currentQuestion += ' ' + line;
        }
    }
    //push the last question
    if (currentQuestion) {
        questions.push(currentQuestion.trim());
    }
    return questions;
}
/**
 * Get embeddings for a list of questions
 */
//sends in batches
export async function getEmbeddings(questions: string[]): Promise<number[][]> {
    //prepare cache keys
    const keys = questions.map((question) => normalizeQuestions(question));
    //intialize results arry with cached emebeddings where available

    //identify which questions arent cached

    const uncachedQuestions = questions.filter(
        (question, indx) => !embeddingCache[keys[indx]]
    );
    if (uncachedQuestions.length > 0) {
        console.log(
            `Generating embedings for ${uncachedQuestions.length} new questions ...`
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
                                `Invalid embedding format recieved for question`,
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
                    log.error('Unexpected repsonse format from ugging face');
                }
                saveEmbeddingsCache();
                //trim embeding after adding new entries
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
                    'Embedding generations failed.Cannoe continue processing'
                );
            }
        }
    }
    log.highlight('Done with the embedings ');
    return questions.map(
        (question) => embeddingCache[normalizeQuestions(question)]
    );
}
function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
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
/*retry Wrappr for gemini api clls
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
    const prompt = `
You are merging duplicate or highly similar exam questions.

Rules:
- Produce ONE clear exam question
- Keep academic wording
- Remove repetition
- Preserve intent and difficulty
- If they dont look like questions don't bother touching them
Questions:
${questions.map((q) => `- ${q}`).join('\n')}

Merged question:
`;
    log.highlight('Start merging clusters');

    try {
        const response = await AI.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction:
                    'You merge duplicate or highly similar exam questions into pne academic question',
                maxOutputTokens: 80,
                temperature: 0.2,
            },
            contents: [
                {
                    text: prompt,
                },
            ],
        });
        const mergedQuestion = response.text?.trim();
        log.highlight('Finalize merging clusters');

        if (!mergedQuestion) throw new Error('No response from Gemini');
        return mergedQuestion;
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
            //deldte files older than 1 hour
            if (Date.now() - stat.mtimeMs > 60 * 60 * 1000) {
                await fs.remove(filePath);
                log.debug(`Removed old file:${file}`);
            }
        }
        //get current files
        let files = await fs.readdir(folderPath);
        files = files.filter((file) => !file.startsWith('~$'));
        //check for duplicate name partens
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
            console.log(`[PROCESSING FILE] `, fullPath);
            const text = await extractTextFromFile(fullPath);
            const questions = extractQuestion(text);
            allQuestions.push(...questions);
        }
        if (allQuestions.length === 0) return [];
        //create embeddings
        const embeddings = await getEmbeddings(allQuestions);
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
                        console.log('Using cached merged questions');
                        return mergeCache[key];
                    }
                    await sleep(800);
                    //limit prompt size
                    const trimmedCluster = cluster.slice(0, 5);
                    //if questioins are identical pick the first one
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
        return mergedQuestions;
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
