const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // This ensures the browser is downloaded into your project folder
    // making it easier for pnpm to track it.
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
