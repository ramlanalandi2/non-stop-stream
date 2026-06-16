const logger = require('./utils/Logger');
const VideoService = require('./services/VideoService');
const { initAssets } = require('./utils/AssetManager');
require('dotenv').config();

async function bootstrap() {
    logger.info('=== Auto-Loop Generator System Starting ===');
    
    const niche = process.argv[2] || 'umum';
    const useAi = process.argv[3] === 'true';
    const videoList = process.argv[4] ? process.argv[4].split(',') : null;

    try {
        // Step 1: Ensure basic assets exist
        await initAssets();

        // Step 2: Generate Video
        await VideoService.generateLoop(niche, useAi, videoList);
    } catch (error) {
        logger.error('Critical failure: ' + error.message);
        process.exit(1);
    }
}

bootstrap();
