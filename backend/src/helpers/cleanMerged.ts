function cleanMergedQuestions(
    merged: string,
    originalQuestions: string[]
): string {
    if (!merged) return originalQuestions[0];

    let cleaned = merged
        // Remove Gemini artifacts
        .replace(/^Merged question:?\s*/i, '')
        .replace(/^Here's? (the|a) merged question:?\s*/i, '')
        .replace(/^Here['']s? (the|a)?\s*/i, '')
        .replace(/^\*\*.*?\*\*\s*/g, '') // Remove ** markers
        .replace(/^\*\s*/g, '') // Remove bullet stars
        .replace(/^[0-9]+[\\.\\)]\s*/, '') // Remove leading numbers like "1." or "1)"
        .replace(/^[-–—]\s*/, '') // Remove leading dashes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    // Detect garbage/incomplete outputs
    const garbagePatterns = [
        /^Please\s*$/i,
        /^Here's\s*$/i,
        /^These are\s*/i,
        /^Models are\s*/i,
        /^Analyze\s*$/i,
        /^Explain\s*$/i,
        /^The provided input\s*/i,
        /^Instructions:/i,
        /^BACHELOR OF/i,
        /^QUESTION\s*(ONE|TWO|THREE)\s*$/i,
        /^--\s*\d+\s*of/i,
        /^Page \d+ of/i,
    ];

    // Check if it's garbage
    if (garbagePatterns.some((p) => p.test(cleaned))) {
        return selectBestOriginal(originalQuestions);
    }

    // Detect incomplete sentences (ending with prepositions, articles, conjunctions)
    const incompleteEndings = [
        /\b(step|by|to|and|or|but|with|from|of|in|on|at|for|a|an|the|then|when|where|how|what|why|who|which|i|ii|iii|iv)\s*$/i,
        /[:;]\s*$/, // Ends with colon/semicolon (likely cut off)
        /,\s*$/, // Ends with comma
    ];

    if (incompleteEndings.some((p) => p.test(cleaned))) {
        // Try to find a complete original question that matches
        const completeOriginal = originalQuestions.find(
            (q) =>
                !incompleteEndings.some((p) => p.test(q)) &&
                q.length > cleaned.length * 0.8
        );
        if (completeOriginal) return completeOriginal;

        // Otherwise try to append from originals
        const continuation = findContinuation(cleaned, originalQuestions);
        if (continuation) cleaned += ' ' + continuation;
    }

    // Ensure it has marks if originals had marks
    const originalsHaveMarks = originalQuestions.some((q) =>
        /\(\d+\s*marks?\)/i.test(q)
    );
    const hasMarks = /\(\d+\s*marks?\)/i.test(cleaned); // Fixed regex!

    if (originalsHaveMarks && !hasMarks) {
        // Try to extract marks from originals
        const marksMatch = originalQuestions[0].match(/\(\d+\s*marks?\)/i);
        if (marksMatch) {
            cleaned = cleaned.replace(/[.?!]\s*$/, '') + ' ' + marksMatch[0];
        }
    }

    // Ensure proper ending
    if (!/[.?!]\s*$/.test(cleaned) && !/\(\d+\s*marks?\)\s*$/.test(cleaned)) {
        cleaned += '.';
    }

    // Sanity check: if cleaned is much shorter than originals, might be truncated
    const avgOriginalLength =
        originalQuestions.reduce((a, b) => a + b.length, 0) /
        originalQuestions.length;
    if (
        cleaned.length < avgOriginalLength * 0.5 &&
        originalQuestions.length > 0
    ) {
        return selectBestOriginal(originalQuestions);
    }

    return cleaned;
}

// Helper to select the best original question
function selectBestOriginal(questions: string[]): string {
    // Prefer the longest one that has marks and doesn't look like garbage
    const validQuestions = questions.filter((q) => {
        const isGarbage =
            /^(Please|Here's|These are|Instructions|BACHELOR|QUESTION ONE)/i.test(
                q
            );
        return !isGarbage && q.length > 20;
    });

    if (validQuestions.length === 0) return questions[0];

    return validQuestions.reduce((best, current) => {
        const bestHasMarks = /\(\d+\s*marks?\)/.test(best);
        const currentHasMarks = /\(\d+\s*marks?\)/.test(current);

        if (currentHasMarks && !bestHasMarks) return current;
        if (current.length > best.length) return current;
        return best;
    });
}

// Helper to find continuation text from original questions
function findContinuation(partial: string, originals: string[]): string | null {
    const partialLower = partial.toLowerCase().replace(/\s+/g, ' ');

    for (const original of originals) {
        const originalLower = original.toLowerCase().replace(/\s+/g, ' ');
        if (originalLower.startsWith(partialLower)) {
            const continuation = original.slice(partial.length).trim();
            if (continuation.length > 5) return continuation;
        }
    }

    // Check for partial word matches (e.g., "step by" -> "step by step")
    for (const original of originals) {
        if (
            original.length > partial.length &&
            original.toLowerCase().includes(partial.toLowerCase())
        ) {
            // Extract the part after the common substring
            const idx = original.toLowerCase().indexOf(partial.toLowerCase());
            if (idx !== -1) {
                return original.slice(idx + partial.length).trim();
            }
        }
    }

    return null;
}

export default cleanMergedQuestions;
