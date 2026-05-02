const MAX_CACHE_ENTRIES = 10000;
//import { embeddingCache } from '../utils/fileMerger.js';
import createLogger from '../utils/logger.js';
//import { saveEmbeddingsCache } from '../utils/fileMerger.js';

import type { JWTUserPayload, UserDocument } from '../Types/authenticate.js';
//import type { Request } from 'express';

const log = createLogger('Mini Helpers');
export function normalizeQuestions(question: string) {
    return question.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}
export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/*export function trimEmbeddingsCache() {
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
/**
 * Type Guard to check if the user property is the full Mongoose Document
 */
export const isUserDocument = (
    user: JWTUserPayload | UserDocument
): user is UserDocument => {
    return (user as UserDocument)._id !== undefined;
};
