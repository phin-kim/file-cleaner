import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import './config/envLoader.js';
import { cleanerRoute } from './routes/folderCleanerRoute.js';
import { subRouter } from './routes/subscription.js';
import {
    startPeriodicCleanup,
    cleanupOrphanedFiles,
    forceCleanup,
} from './utils/cleanUp.js';
import { mergerRoute } from './routes/fileMergerRoute.js';
import createLogger from './utils/logger.js';

const log = createLogger('APP.TS');
const PORT = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(
    cors({
        origin: ['http://localhost:5173', 'https://tidy-upp.netlify.app'],

        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    })
);
app.use(express.json());

app.use('/api', cleanerRoute);
app.use('/api', subRouter);
app.use('/api', mergerRoute);
//change this later on
app.use('/downloads', express.static(path.join(process.cwd(), 'backend/temp')));

const PROJECT_ROOT = path.resolve(__dirname, '../');
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
log.info(`Checking if the temporary storage exits${FOLDER_STORAGE_TEMPS}`);
/*const ROUTES_TEMP = path.join(__dirname, 'routes', 'temp');
const BACKEND_TEMP = path.join(__dirname, 'temp');
const UPLOADS = path.join(process.cwd(), 'upload');
C:\Users\USER\Desktop\SIDE-PROJECTS\tidy-up\backend\output\folder-cleaner-temps\folder-cleaner-temp-storage
*/

const CLEAN_UP_DIRS = [
    MERGER_OUTPUTS,
    MERGER_UPLOADS,
    FOLDER_OUTPUTS,
    FOLDER_STORAGE_TEMPS,
    FOLDER_UPLOADS,
];

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

app.listen(PORT, () => log.highlight(`Server is running on port ${PORT}`));
