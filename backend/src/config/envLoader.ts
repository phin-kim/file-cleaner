// backend/src/config.ts
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import createLogger from '../utils/logger.js';

const log = createLogger('EnvLoader.ts');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple possible paths for .env
const possiblePaths = [
    path.resolve(__dirname, '../../.env'), // from backend/src/ to root
    path.resolve(__dirname, '../.env'), // from backend/src/ to backend/
    path.resolve(process.cwd(), '.env'), // current working directory
    path.resolve(process.cwd(), '../.env'), // one level up from cwd
];

let loaded = false;
for (const envPath of possiblePaths) {
    log.info('Checking for .env at:', { data: { envPath } });
    if (fs.existsSync(envPath)) {
        log.info('✅ Found .env at:', { data: { envPath } });
        dotenv.config({ path: envPath });
        loaded = true;
        break;
    }
}

if (!loaded) {
    log.error('❌ No .env file found in any of these locations:', {
        data: { possiblePaths },
    });
}

// Debug: Check what variables are available
log.debug('📋 Environment variables loaded:');
log.debug(
    `GEMINI_API_KEY:,
    ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`
);
log.debug(`HF_API_KEY: ${process.env.HF_API_KEY ? '✅ Set' : '❌ Missing'}`);
log.debug(
    `PAYHERO_AUTH_TOKEN:,
    ${process.env.PAYHERO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`
);
log.debug(
    `COOKIE_SECRET:,
    ${process.env.COOKIE_SECRET ? '✅ Set' : '❌ Missing'}`
);
log.debug(
    `BREVO_API_KEY:, ${process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing'}`
);

// Export the keys with fallbacks
export const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
export const HF_API_KEY = process.env.HF_API_KEY;
export const PAYHERO_AUTH_TOKEN = process.env.PAYHERO_AUTH_TOKEN;
export const COOKIE_SECRET = process.env.COOKIE_SECRET;
export const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Validate required keys
if (!GEMINI_API_KEY) {
    log.error('❌ GEMINI_API_KEY or GOOGLE_API_KEY is required in .env file');
    process.exit(1);
}
if (!BREVO_API_KEY) {
    log.error('❌ BREVO_API_KEY  is required in .env file');
    process.exit(1);
}

if (!HF_API_KEY) {
    log.error('❌ HF_API_KEY is required in .env file');
    process.exit(1);
}
if (!PAYHERO_AUTH_TOKEN) {
    log.error('❌ PAYHERO_AUTH_TOKEN is required in .env file');
    process.exit(1);
}
if (!COOKIE_SECRET) {
    log.error('❌ COOKIE_SECRET is required in .env file');
    process.exit(1);
}
