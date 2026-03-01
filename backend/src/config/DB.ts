import mongoose from 'mongoose';
import createLogger from '../utils/logger';
import AppError from '../utils/appError';
const log = createLogger('Config:db');
const isProd = process.env.NODE_ENV === 'production';
const USERS = isProd
    ? process.env.USER_MONGO_URL ||
      (() => {
          throw AppError.notFound('Missing USER_MONGO_URL in production');
      })()
    : 'mongodb://127.0.0.1:27017/tidyUpDatabase';
export const UserConnection = mongoose.createConnection(USERS);
export const connectDatabases = async (): Promise<void> => {
    try {
        await Promise.all([UserConnection.asPromise()]);
        log.highlight('All databases are connected ', {
            context: 'database-connection',
        });
    } catch (error) {
        log.error('Failure to connect to database', {
            context: 'Database failure',
            data: { error },
        });
    }
};
