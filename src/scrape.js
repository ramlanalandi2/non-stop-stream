const ScraperService = require('./services/ScraperService');
const logger = require('./utils/Logger');

async function run() {
    const keyword = process.argv[2] || 'produk viral tiktok';
    try {
        await ScraperService.scrapeTikTokProducts(keyword);
        process.exit(0);
    } catch (error) {
        logger.error('Scrape CLI Error: ' + error.message);
        process.exit(1);
    }
}

run();
