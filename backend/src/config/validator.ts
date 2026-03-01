import AppError from '../utils/appError';
import createLogger from '../utils/logger.js';
import { loginSchema, type LoginInput } from '../schema/validatorSchema.js';
const log = createLogger('VALIDATOR');
export interface Input {
    email: string;
    password: string;
}

export function validateRegisterInput(body: unknown): LoginInput {
    const result = loginSchema.safeParse(body);

    if (!result.success) {
        const message = result.error.issues
            .map((issue) => issue.message)
            .join(', ');
        log.error('Error fro zod validator', {
            context: 'ZODERROR',
            data: { message },
        });
        throw AppError.validation(message);
    }

    return result.data;
}
