export interface PaystackVerificationResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        status: string;
        reference: string;
        amount: number;
        message: string;
        gateway_response: string;
        log: {
            attempts: number;
            success: boolean;
            history: [type: string, message: string, time: number];
        };
        customer: {
            email: string;
        };
    };
}
