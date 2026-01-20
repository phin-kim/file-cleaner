import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { cleanerRoute } from '../routes/fileCleaner';
import { subRouter } from '../routes/subscription';
const PORT = process.env.PORT;

const app = express();
app.use(
    cors({ origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] })
);
app.use('/api', cleanerRoute);
app.use('/api', subRouter);
app.use(express.json());
app.listen(PORT, () => console.log(`Serveris running on port ${PORT}`));
