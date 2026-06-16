const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/Logger');

puppeteer.use(StealthPlugin());

class ScraperService {
    constructor() {
        this.dataPath = path.join(__dirname, '../../assets/data/products.json');
        this.videoDir = path.join(__dirname, '../../assets/videos');
    }

    async downloadVideo(url, filename) {
        if (!url || url.startsWith('blob:')) return; 
        const outputPath = path.join(this.videoDir, filename);
        
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                }
            });

            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            logger.error(`Download failed for ${url}: ${error.message}`);
        }
    }

    async scrapePinterestVideos(keyword = 'cool gadgets', limit = 3) {
        logger.info(`🚀 Starting Pinterest Scraper for: ${keyword}`);
        
        const browser = await puppeteer.launch({
            headless: "new", 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

            // Pinterest search URL
            const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}&rs=typed`;
            logger.info(`Navigating to Pinterest: ${searchUrl}`);
            
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });

            // Wait for content to render (Pinterest is heavy on JS)
            logger.info('Waiting for pins to load...');
            await new Promise(r => setTimeout(r, 6000)); 

            // Scroll to trigger more video loading
            await page.evaluate(async () => {
                window.scrollBy(0, 1000);
                await new Promise(r => setTimeout(r, 2000));
            });

            // Extract direct video source links
            const videos = await page.evaluate(() => {
                const results = [];
                const videoTags = document.querySelectorAll('video');
                
                videoTags.forEach(vid => {
                    if (vid.src && vid.src.startsWith('http') && !vid.src.includes('blob:')) {
                        // Try to find the title from the parent or nearest pin description
                        const pin = vid.closest('div[data-test-id="pin"]') || vid.parentElement;
                        const title = pin?.innerText?.split('\n')[0] || 'Aesthetic Product';
                        
                        results.push({
                            title: title.substring(0, 60),
                            videoSrc: vid.src
                        });
                    }
                });
                return results;
            });

            if (videos.length === 0) {
                logger.warn('⚠️ Pinterest Scraper found 0 video tags. Taking debug screenshot...');
                const debugPath = path.join(__dirname, '../../logs/debug_pinterest.png');
                await page.screenshot({ path: debugPath });
                throw new Error('No videos found on Pinterest search page.');
            }

            // Deduplicate
            const uniqueVideos = Array.from(new Set(videos.map(v => v.videoSrc)))
                .map(src => videos.find(v => v.videoSrc === src))
                .slice(0, limit);

            logger.info(`Found ${uniqueVideos.length} unique videos from Pinterest. Downloading...`);

            for (let i = 0; i < uniqueVideos.length; i++) {
                const filename = `pin_${Date.now()}_${i}.mp4`;
                await this.downloadVideo(uniqueVideos[i].videoSrc, filename);
                uniqueVideos[i].localPath = `assets/videos/${filename}`;
            }

            fs.writeFileSync(this.dataPath, JSON.stringify(uniqueVideos, null, 2));
            logger.info('✅ Pinterest Scrape & Download Success!');
            return uniqueVideos;

        } catch (error) {
            logger.error(`Pinterest Scraper Error: ${error.message}`);
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }

    // Alias for the panel
    async scrapeTikTokProducts(keyword, limit) {
        return this.scrapePinterestVideos(keyword, limit);
    }
}

module.exports = new ScraperService();
