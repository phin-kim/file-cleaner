const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Only use local cache if we are NOT in production
    cacheDirectory:
        process.env.NODE_ENV === 'production'
            ? undefined
            : join(__dirname, '.cache', 'puppeteer'),
};
