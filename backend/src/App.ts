import express from 'express';
import type { Response, Request, NextFunction } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import './config/envLoader.js';
import cookieParser from 'cookie-parser';
import { cleanerRoute } from './routes/folderCleanerRoute.js';
import {
    startPeriodicCleanup,
    cleanupOrphanedFiles,
    cleanupEmbeddings,
} from './utils/cleanUp.js';
import fs from 'fs-extra';
import { mergerRoute } from './routes/fileMergerRoute.js';
import createLogger from './utils/logger.js';
import { authRoute } from './routes/auth.js';
import errorHandler from './utils/errorHandler.js';
import { connectDatabases } from './config/DB.js';
import { paymentRoute } from './routes/paymentRoute.js';
import {
    generalRateLimiter,
    uploadRateLimiter,
    paymentInitiationRateLimiter,
    paymentStatusRateLimiter,
} from './middleware/rateLimiters.js';
import { userRouter } from './routes/userRoute.js';

const log = createLogger('APP.TS');
const PORT = process.env.PORT;
const cookieSecret = process.env.COOKIE_SECRET;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getAuthErrorStatus(err: unknown): number {
    if (err && typeof err === 'object') {
        const error = err as Record<string, unknown>;
        if (typeof error.status === 'number') return error.status;
        if (typeof error.statusCode === 'number') return error.statusCode;
    }
    return 500;
}
function getAuthErrorCode(err: unknown): string {
    if (err && typeof err === 'object') {
        const error = err as Record<string, unknown>;
        if (typeof error.code === 'string') return error.code;
        if (
            error.body &&
            typeof error.body === 'object' &&
            'code' in error.body
        ) {
            const code = (error.body as Record<string, unknown>).code;
            if (typeof code === 'string') return code;
        }
    }
    return 'ERROR';
}
const app = express();
app.set('trust proxy', 1);
app.use(
    cors({
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'https://tidy-upp.netlify.app',
            'http://localhost:4173',
            'https://unparasitical-unsigned-lasonya.ngrok-free.dev',
            'https://tidyupp.site',
            'https://file-cleaner-git-main-phin-kims-projects.vercel.app/',
            'https://file-cleaner-75ltxmcpm-phin-kims-projects.vercel.app/',
            'https://literalistically-paleobiologic-leatrice.ngrok-free.dev',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    })
);
app.all(
    '/api/auth/*splat',
    async (req: Request, res: Response, next: NextFunction) => {
        console.log('Auth route hit:', req.method, req.path);
        try {
            const handler = toNodeHandler(auth);
            await handler(req, res);
        } catch (err: unknown) {
            console.error('=== AUTH ERROR CAUGHT ===');

            const errorObject = err instanceof Error ? err : null;
            const errorCode = getAuthErrorCode(err);
            const statusCode = getAuthErrorStatus(err);

            console.error('Message:', errorObject?.message);
            console.error('Stack:', errorObject?.stack);

            if (!res.headersSent) {
                console.error('Auth route error response:', {
                    path: req.path,
                    method: req.method,
                    message: errorObject?.message,
                    code: errorCode,
                    stack: errorObject?.stack,
                });

                res.status(statusCode).json({
                    success: false,
                    error: errorObject?.message || 'Unknown error',
                    code: errorCode,
                    stack: errorObject?.stack,
                });
            }
            next(err);
        }
    }
);
app.get('/api/auth/ok', (_req, res) => {
    res.status(200).send('ok');
});
app.post(
    '/api/test-signin',
    express.json(),
    async (req: Request, res: Response) => {
        console.log('Route hit: POST /api/test-signin', {
            body: req.body,
            headers: req.headers,
        });
        try {
            const authApi = auth.api as unknown as {
                signInEmail: (args: {
                    body: unknown;
                    headers: Headers;
                }) => Promise<unknown>;
            };

            const result = await authApi.signInEmail({
                body: req.body,
                headers: new Headers({ 'content-type': 'application/json' }),
            });

            res.json(result);
        } catch (err: unknown) {
            const errorObject = err instanceof Error ? err : null;
            const errorCode = getAuthErrorCode(err);
            const statusCode = getAuthErrorStatus(err);

            console.error('Direct signin error:', {
                error: errorObject?.message,
                code: errorCode,
                statusCode,
                stack: errorObject?.stack,
            });
            res.status(statusCode).json({
                success: false,
                error: errorObject?.message || 'Unknown error',
                code: errorCode,
                stack: errorObject?.stack,
            });
        }
    }
);
app.use(express.json());
app.use(cookieParser(cookieSecret));

app.use('/api', generalRateLimiter);
app.use('/api', cleanerRoute);
app.use('/api', uploadRateLimiter, mergerRoute);
//app.use('/api/auth', authRoute);
app.use('/api/user', userRouter);
app.use('/api/payment', paymentStatusRateLimiter, paymentRoute);
app.use('/downloads', express.static(path.join(process.cwd(), 'backend/temp')));

const PROJECT_ROOT = path.resolve(__dirname, '../');
const EMBEDDINGS_FILE = path.join(PROJECT_ROOT, 'embeddings-cache.json');
const MERGER_BASE_DIR = path.join(PROJECT_ROOT, 'output/file-merger-temps');
const CLEANER_BASE_DIR = path.join(PROJECT_ROOT, 'output/folder-cleaner-temps');

const MERGER_UPLOADS = path.join(MERGER_BASE_DIR, 'uploads');
const MERGER_OUTPUTS = path.join(MERGER_BASE_DIR, 'outputs');
const FOLDER_UPLOADS = path.join(CLEANER_BASE_DIR, 'uploads');
const FOLDER_OUTPUTS = path.join(CLEANER_BASE_DIR, 'outputs');
const FOLDER_STORAGE_TEMPS = path.join(
    CLEANER_BASE_DIR,
    'folder-cleaner-temp-storage'
);
log.info(
    `Checking if the temporary storage exits ${FOLDER_STORAGE_TEMPS ? 'YES' : 'NO'}`
);

const CLEAN_UP_DIRS = [
    MERGER_OUTPUTS,
    MERGER_UPLOADS,
    FOLDER_OUTPUTS,
    FOLDER_STORAGE_TEMPS,
    FOLDER_UPLOADS,
];
const pathExists = await fs.pathExists(EMBEDDINGS_FILE);
if (pathExists) {
    cleanupEmbeddings(EMBEDDINGS_FILE);
}
// ───── startup cleanup ─────1
log.highlight('CLEANUP STARTING', { context: 'Cleanup' });
startPeriodicCleanup(CLEAN_UP_DIRS);
//forceCleanup(FOLDER_OUTPUTS);
//also clean up orphaned files on startup
cleanupOrphanedFiles(path.join(__dirname, '../'), [
    /\.tmp$/,
    /^~.*/,
    /\.crdownload$/,
    //add other patterns for temp files
]).catch(console.error);

const startServer = async () => {
    try {
        await connectDatabases();
        app.listen(PORT, () => {
            log.highlight(`Tidy up is running on http://localhost:${PORT}`, {
                context: 'running server',
            });
        });
    } catch (error) {
        log.error('Failed to connect to databases and server failure', {
            context: 'Failed to start',
            data: { error },
        });
    }
};
startServer();
app.use(errorHandler);
