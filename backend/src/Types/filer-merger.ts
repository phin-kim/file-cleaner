export interface ErrorDetails {
    message: string;
    stack?: string;
    name?: string;
    status?: number;
    cause?: string;
    statusText?: string;
    responseData?: unknown;
    causeStack?: string;
    causeMessage?: string;
    systemCode?: string;
}
export interface QuestionExtractionResponse {
    /** HTML content containing unique questions */
    html: string;
    /** Count of unique questions */
    uniqueCount: number;
    /** Count of total questions before deduplication */
    totalCount: number;
    /** Count of duplicates removed */
    duplicatesRemoved: number;
    /** Brief analysis of what was found */
    analysis: string;
}
