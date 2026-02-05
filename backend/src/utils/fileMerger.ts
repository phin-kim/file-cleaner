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
const mergeCachePath = '../../merged-cache.json';
const embeddingCachePath = '../../embeddings-cache.json';

let mergeCache: Record<string, string> = {};
let embeddingCache: Record<string, number[]> = {};
//load cache if it exists
if (fs.existsSync(mergeCachePath)) {
    mergeCache = fs.readJSONSync(mergeCachePath);
}
if (fs.existsSync(embeddingCachePath)) {
    embeddingCache = fs.readJSONSync(embeddingCachePath);
}
//save cache helper
function saveMergeCache() {
    fs.writeJSONSync(mergeCachePath, mergeCache, { spaces: 2 });
}
function saveEmbeddingsCache() {
    fs.writeJSONSync(embeddingCachePath, embeddingCache, { spaces: 2 });
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
    //prepare cahcekeys
    const keys = questions.map((question) => normalizeQuestions(question));
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
            const response = await huggingFace.featureExtraction({
                model: 'sentence-transformers/all-MiniLM-L6-v2',
                inputs: batch,

                provider: 'hf-inference',
            });
            //save new embeddings to cache
            batch.forEach((question, indx) => {
                const key = normalizeQuestions(question);
                embeddingCache[key] = response[indx] as number[];
            });
            saveEmbeddingsCache();
        }
    }
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
    //consvert index clusters to actual questions
    return Object.values(clusters).map((indices) =>
        indices.map((ind) => questions[ind])
    );
}
export async function mergeCluster(questions: string[]): Promise<string> {
    const prompt = `
You are merging duplicate or highly similar exam questions.

Rules:
- Produce ONE clear exam question
- Keep academic wording
- Remove repetition
- Preserve intent and difficulty

Questions:
${questions.map((q) => `- ${q}`).join('\n')}

Merged question:
`;

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
        if (!mergedQuestion) throw new Error('No response from Gemini');

        return mergedQuestion;
    } catch (error) {
        console.error('gemini merge failes:  ', error);
        return questions[0];
    }
}
export async function processUploadedFiles(folderPath: string) {
    let files = await fs.readdir(folderPath);
    files = files.filter((file) => !file.startsWith('~$'));
    //extract all questions
    const allQuestions: string[] = [];
    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        console.log(`[PROCESSING FILE] `, fullPath);
        const text = await extractTextFromFile(fullPath);
        const questions = await extractQuestion(text);
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
                    console.log('Using chached merged questions');
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

    return mergedQuestions;
}
