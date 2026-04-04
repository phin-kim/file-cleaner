import mongoose from 'mongoose';
import createLogger from '../utils/logger.js';
import AppError from '../utils/appError.js';
const log = createLogger('Config:db');
const isProd = process.env.NODE_ENV === 'production';
const TIDY_UP = isProd
    ? process.env.TIDY_UP_DB ||
      (() => {
          throw AppError.notFound('Missing TIDY_UP_DB in production');
      })()
    : 'mongodb://127.0.0.1:27017/tidyUpDB';
/*const TRANSACTIONS = isProd
    ? process.env.USER_MONGO_URL ||
      (() => {
          throw AppError.notFound('Missing USER_MONGO_URL in production');
      })()
    : 'mongodb://127.0.0.1:27017/tidy-up/TDTransactionsDatabase';*/
export const TidyUpConnection = mongoose.createConnection(TIDY_UP);
//export const TransactionsConnection = mongoose.createConnection(TRANSACTIONS);
export const connectDatabases = async (): Promise<void> => {
    try {
        await Promise.all([
            TidyUpConnection.asPromise(),
            //TransactionsConnection.asPromise(),
        ]);

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
