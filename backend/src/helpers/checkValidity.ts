function isValidQuestion(question: string): boolean {
    const minLength = 15;
    const maxLength = 500;
    const hasContent = /[a-z]{3,}/i.test(question);
    const notJustNumbers = !/^\d+$/.test(question);
    const notFragment =
        !/^(Here's|Please|These are|Models are|Analyze|Explain)$/i.test(
            question.trim()
        );
    return (
        question.length >= minLength &&
        question.length <= maxLength &&
        hasContent &&
        notJustNumbers &&
        notFragment
    );
}

export default isValidQuestion;
