# StreamLoop Pro - Auto-Loop Generator & Live Stream Engine

Professional grade automation for 24/7 affiliate live streaming.

## 🚀 Features
- **Auto-Looping**: Concatenates multiple videos and loops them infinitely for stream-ready output.
- **Dynamic Overlays**: Professional CTA text overlays for high conversion.
- **Audio Integration**: Auto-mix background music into your video loop.
- **Web Control Panel**: Modern Glassmorphism dashboard to trigger generation and monitor logs.
- **Stream Ready**: Optimized for YouTube, TikTok, and Facebook Live via RTMP.

## 📁 Structure
- `assets/videos/`: Place your product showcase videos here (.mp4).
- `assets/audio/`: Place your background music here (music.mp3).
- `config/settings.json`: Configure text overlays, fonts, and FFmpeg quality.
- `web-panel/`: Access via browser to control the system.
- `output/`: The generated loop video will be saved here.

## 🛠 Installation
1. Ensure **FFmpeg** is installed and added to your system PATH.
2. Run `npm install` to install Node.js dependencies.
3. Start your local PHP server (XAMPP/WAMP) and point to the project directory.

## 🖥 Commands

### Generate Loop (CLI)
```bash
node src/index.js
```

### Stream to YouTube / TikTok
Replace `STREAM_KEY` and `RTMP_URL` with your actual stream credentials.

```bash
ffmpeg -re -stream_loop -1 -i output/final_loop.mp4 \
-c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k \
-pix_fmt yuv420p -g 50 \
-c:a aac -b:a 128k \
-f flv "RTMP_URL/STREAM_KEY"
```

## 🧠 Business Logic (Affiliate Tips)
- Use **Product "Problem Solver"** content for maximum sales.
- Ensure the first 3 seconds have a strong visual hook.
- Change `config/settings.json` regularly to update promos without touching the code.

---
*Built by Antigravity AI Software Company Team.*
