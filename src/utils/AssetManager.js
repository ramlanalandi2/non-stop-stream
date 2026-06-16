const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/Logger');

async function initAssets() {
    const audioDir = path.join(__dirname, '../assets/audio');
    const musicPath = path.join(audioDir, 'music.mp3');

    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

    if (!fs.existsSync(musicPath)) {
        logger.info('🎵 Music file not found. Downloading default royalty-free music...');
        const defaultMusicUrl = 'https://www.bensound.com/bensound-music/bensound-lofifibusiness.mp3'; // Example URL, in real world use a stable CDN
        
        try {
            const response = await axios({
                method: 'GET',
                url: defaultMusicUrl,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(musicPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    logger.info('✅ Default music downloaded successfully.');
                    resolve();
                });
                writer.on('error', reject);
            });
        } catch (e) {
            logger.error('Failed to download default music: ' + e.message);
            // Fallback: create an empty file or warn user
        }
    }
}

module.exports = { initAssets };
