// backend/src/config.ts
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

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
    console.log('Checking for .env at:', envPath);
    if (fs.existsSync(envPath)) {
        console.log('✅ Found .env at:', envPath);
        dotenv.config({ path: envPath });
        loaded = true;
        break;
    }
}

if (!loaded) {
    console.error(
        '❌ No .env file found in any of these locations:',
        possiblePaths
    );
}

// Debug: Check what variables are available
console.log('📋 Environment variables loaded:');
console.log(
    'GEMINI_API_KEY:',
    process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'
);
console.log('HF_API_KEY:', process.env.HF_API_KEY ? '✅ Set' : '❌ Missing');
console.log(
    'PAYSTACK_SECRET_KEY:',
    process.env.PAYSTACK_SECRET_KEY ? '✅ Set' : '❌ Missing'
);
console.log(
    'COOKIE_SECRET:',
    process.env.COOKIE_SECRET ? '✅ Set' : '❌ Missing'
);

// Export the keys with fallbacks
export const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
export const HF_API_KEY = process.env.HF_API_KEY;
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
export const COOKIE_SECRET = process.env.COOKIE_SECRET;

// Validate required keys
if (!GEMINI_API_KEY) {
    console.error(
        '❌ GEMINI_API_KEY or GOOGLE_API_KEY is required in .env file'
    );
    process.exit(1);
}

if (!HF_API_KEY) {
    console.error('❌ HF_API_KEY is required in .env file');
    process.exit(1);
}
if (!PAYSTACK_SECRET_KEY) {
    console.error('❌ PAYSTACK_SECRET_KEY is required in .env file');
    process.exit(1);
}
if (!COOKIE_SECRET) {
    console.error('❌ COOKIE_SECRET is required in .env file');
    process.exit(1);
}
