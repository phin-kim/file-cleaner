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
