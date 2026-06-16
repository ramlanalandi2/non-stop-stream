const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/Logger');
const settings = require('../../config/settings.json');

class VideoService {
    constructor() {
        this.assetsPath = path.join(__dirname, '../../');
        this.nicheHooks = {
            "murottal": [
                "📖 TENANGKAN HATI DENGAN LANTRUNAN AYAT SUCI 📖",
                "✨ SPEAKER MUROTTAL: TEMAN IBADAH DI RUMAH ✨",
                "🎧 KUALITAS SUARA JERNIH, COCOK UNTUK HAFALAN 🎧"
            ],
            "alat_ngaji": [
                "👶 CARA SERU ANAK JADI RAJIN MENGAJI! 👶",
                "📚 ALQURAN DIGITAL: BELAJAR TAJWID JADI MUDAH 📚",
                "🌟 HADIAH TERBAIK UNTUK SI KECIL SOLEH & SOLEHAH 🌟"
            ],
            "mukena": [
                "🌸 MUKENA PREMIUM: ADEM & NYAMAN UNTUK SHALAT 🌸",
                "💎 DESAIN MEWAH, HARGA RAMAH DI KANTONG 💎",
                "🕊️ SHALAT LEBIH KHUSYUK DENGAN MUKENA TERBAIK 🕊️"
            ],
            "sejadah": [
                "🕋 SEJADAH EMPUK: ANTI SAKIT LUTUT SAAT SUJUD 🕋",
                "🎨 MOTIF EXCLUSIVE & MUDAH DIBAWA TRAVELING 🎨",
                "🕌 KENYAMANAN IBADAH DIMULAI DARI SEJADAH INI 🕌"
            ],
            "skincare": [
                "✨ WAJAH GLOWING DALAM 7 HARI? INI RAHASIANYA! ✨",
                "🧪 FORMULA TERBAIK UNTUK KULIT SEHAT & BERSIH 🧪",
                "💖 SKINCARE VIRAL YANG SUDAH TERBUKTI HASILNYA 💖"
            ],
            "alat_dapur": [
                "🍳 MASAK JADI 10X LEBIH CEPAT DENGAN ALAT INI! 🍳",
                "🔪 ALAT DAPUR VIRAL: WAJIB PUNYA DI RUMAH! 🔪",
                "🌟 DAPUR RAPI & MASAK JADI SERU SETIAP HARI 🌟"
            ],
            "umum": [
                "🔥 PRODUK VIRAL YANG LAGI DICARI SEMUA ORANG! 🔥",
                "😱 DISKON 50% HANYA UNTUK HARI INI SAJA! 😱",
                "🚀 STOK TERBATAS! KLIK KERANJANG SEKARANG! 🚀"
            ]
        };
    }

    async generateWithOllama(niche) {
        try {
            logger.info(`Calling Ollama for niche: ${niche}...`);
            const response = await axios.post('http://localhost:11434/api/generate', {
                model: 'llama3', // or 'mistral'
                prompt: `Buatkan 1 kalimat Hook promosi singkat dan sangat menarik untuk niche ${niche} dalam bahasa Indonesia. Gunakan emoji. Maksimal 10 kata. Langsung berikan kalimatnya saja tanpa penjelasan.`,
                stream: false
            }, { timeout: 5000 });

            const hook = response.data.response.trim();
            logger.info(`Ollama generated hook: ${hook}`);
            return hook;
        } catch (e) {
            logger.warn('Ollama not reachable, using fallback library.');
            return null;
        }
    }

    async generateLoop(niche = 'umum', useAi = false, videoList = null) {
        try {
            const videoDir = path.join(this.assetsPath, settings.video_dir);
            let videos = [];
            
            if (videoList && videoList.length > 0) {
                videos = videoList.filter(v => fs.existsSync(path.join(videoDir, v)));
            } else {
                videos = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));
            }

            if (videos.length === 0) {
                throw new Error('No videos found or selected. Please upload and select videos first!');
            }

            let hook = '';
            if (useAi) {
                hook = await this.generateWithOllama(niche);
            }
            
            if (!hook) {
                const hooks = this.nicheHooks[niche] || this.nicheHooks['umum'];
                hook = hooks[Math.floor(Math.random() * hooks.length)];
            }

            logger.info(`Niche: ${niche} | Final Hook: ${hook}`);

            const listFile = path.join(this.assetsPath, 'list.txt');
            const listContent = videos.map(v => `file '${path.join(videoDir, v)}'`).join('\n');
            fs.writeFileSync(listFile, listContent);

            const audioFile = path.join(this.assetsPath, settings.audio_path);
            const outputPath = path.join(this.assetsPath, settings.output_path);

            let command = ffmpeg().input(listFile).inputOptions(['-f concat', '-safe 0']);
            if (fs.existsSync(audioFile)) command = command.input(audioFile);

            const filters = [
                {
                    filter: 'drawtext',
                    options: {
                        text: hook,
                        fontsize: 38,
                        fontcolor: 'white',
                        x: '(w-text_w)/2',
                        y: '70',
                        box: 1,
                        boxcolor: 'red@0.8',
                        boxborderw: 10
                    }
                },
                {
                    filter: 'drawtext',
                    options: {
                        text: '👉 KLIK LINK DI BIO UNTUK ORDER 👈',
                        fontsize: 32,
                        fontcolor: 'yellow',
                        x: '(w-text_w)/2',
                        y: 'h-100',
                        box: 1,
                        boxcolor: 'black@0.6'
                    }
                }
            ];

            command
                .complexFilter(filters)
                .outputOptions([
                    `-c:v ${settings.ffmpeg_options.vcodec}`,
                    `-preset ${settings.ffmpeg_options.preset}`,
                    `-b:v ${settings.ffmpeg_options.bitrate}`,
                    `-c:a ${settings.ffmpeg_options.acodec}`,
                    '-shortest'
                ])
                .on('end', () => {
                    logger.info('✅ Video loop generated!');
                    if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
                })
                .save(outputPath);

        } catch (error) {
            logger.error('VideoService Error: ' + error.message);
            throw error;
        }
    }
}

module.exports = new VideoService();
