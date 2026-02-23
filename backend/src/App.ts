import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { cleanerRoute } from './routes/fileCleaner.js';
import { subRouter } from './routes/subscription.js';
import { startPeriodicCleanup, cleanupOrphanedFiles } from './utils/cleanUp.js';
import { mergerRoute } from './routes/mergerRoute.js';
import createLogger from './utils/logger.js';

const log = createLogger('APP.TS');
const PORT = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(
    cors({ origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] })
);
app.use(express.json());

app.use('/api', cleanerRoute);
app.use('/api', subRouter);
app.use('/api', mergerRoute);

app.use('/downloads', express.static(path.join(process.cwd(), 'backend/temp')));

const ROUTES_TEMP = path.join(__dirname, 'routes', 'temp');
const BACKEND_TEMP = path.join(__dirname, 'temp');
const UPLOADS = path.join(process.cwd(), 'upload');
const MERGER_UPLOADS = path.join(process.cwd(), 'backend/temp/merger/uploads');
const MERGER_OUTPUTS = path.join(process.cwd(), 'backend/temp/outputs');
const TEMP_DIRS = [
    ROUTES_TEMP,
    UPLOADS,
    BACKEND_TEMP,
    MERGER_OUTPUTS,
    MERGER_UPLOADS,
];

// ───── startup cleanup ─────1
log.highlight('CLEANUP STARTING', { context: 'Cleanup' });
startPeriodicCleanup(TEMP_DIRS);
//also clean up orphaned files on startup
cleanupOrphanedFiles(path.join(__dirname, '../'), [
    /\.tmp$/,
    /^~.*/,
    /\.crdownload$/,
    //add other patterns for temp files
]).catch(console.error);

app.listen(PORT, () => log.highlight(`Server is running on port ${PORT}`));
