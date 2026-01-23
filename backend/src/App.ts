import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { cleanerRoute } from '../routes/fileCleaner';
import { subRouter } from '../routes/subscription';
import cleanupByAge from '../utils/cleanByAge';
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

const ROUTES_TEMP = path.join(__dirname, 'routes', 'temp');
const BACKEND_TEMP = path.join(__dirname, 'temp');
const UPLOADS = path.join(process.cwd(), 'upload');

// ───── startup cleanup ─────
console.log('[CLEANUP] startup');
cleanupByAge(ROUTES_TEMP, 'ROUTES_TEMP');
cleanupByAge(BACKEND_TEMP, 'BACKEND_TEMP');
cleanupByAge(UPLOADS, 'UPLOADS');

// ───── scheduled cleanup ─────
setInterval(
    () => {
        console.log('[CLEANUP] scheduled');
        cleanupByAge(ROUTES_TEMP, 'ROUTES_TEMP');
        cleanupByAge(BACKEND_TEMP, 'BACKEND_TEMP');
        cleanupByAge(UPLOADS, 'UPLOADS');
    },
    30 * 60 * 1000
);
app.listen(PORT, () => console.log(`Serveris running on port ${PORT}`));
