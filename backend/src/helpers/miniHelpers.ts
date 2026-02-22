const MAX_CACHE_ENTRIES = 10000;
import { embeddingCache } from '../utils/fileMerger';
import createLogger from '../utils/logger';
const log = createLogger('Mini Helpers');
import { saveEmbeddingsCache } from '../utils/fileMerger';
export function normalizeQuestions(question: string) {
    return question.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}
export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function trimEmbeddingsCache() {
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
