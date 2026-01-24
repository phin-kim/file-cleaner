import fs from 'fs-extra';
import { PDFParse } from 'pdf-parse';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { InferenceClient } from '@huggingface/inference';
import path from 'path';
const huggingFace = new InferenceClient(process.env.HF_API_KEY);
const AI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
export async function getEmbeddings(questions: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const quest of questions) {
        try {
            const response = await huggingFace.featureExtraction({
                model: 'sentence-transformers/distilbert-base-nli-mean-tokens',
                inputs: [quest],
                provider: 'hf-inference',
            });
            embeddings.push(response[0] as number[]);
        } catch (error) {
            console.error(
                'Error generation embeding for question ',
                quest,
                error
            );
            embeddings.push([]);
        }
    }
    return embeddings;
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
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction:
                    'You merge duplicate or highly similar exam questions into pne academic question',
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
    const mergedQuestions: string[] = [];
    for (const cluster of clusters) {
        if (cluster.length === 1) {
            mergedQuestions.push(cluster[0]);
        } else {
            const merged = await mergeCluster(cluster);
            mergedQuestions.push(merged);
        }
    }
    return mergedQuestions;
}
