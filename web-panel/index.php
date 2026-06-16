<?php
/**
 * StreamLoop Pro - Ultimate Edition
 * With Media Manager & Streaming Controller
 */

$action = $_GET['action'] ?? null;
$message = '';
$status = '';

$videoDir = __DIR__ . '/../assets/videos/';
if (!file_exists($videoDir)) mkdir($videoDir, 0777, true);

// 1. Handle Upload
if ($action === 'upload') {
    if (isset($_FILES['video'])) {
        $file = $_FILES['video'];
        $target = $videoDir . basename($file['name']);
        if (move_uploaded_file($file['tmp_name'], $target)) {
            $message = "Video uploaded successfully!";
            $status = "success";
        } else {
            $message = "Upload failed.";
            $status = "error";
        }
    }
}

// 2. Handle Generation
if ($action === 'generate') {
    $niche = $_POST['niche'] ?? 'umum';
    $use_ai = isset($_POST['use_ai']) ? 'true' : 'false';
    $selected_videos = $_POST['selected_videos'] ?? [];
    
    // Pass selected videos as a comma-separated string argument
    $video_list = implode(',', $selected_videos);
    $cmd = "node " . escapeshellarg(__DIR__ . '/../src/index.js') . " " . escapeshellarg($niche) . " " . escapeshellarg($use_ai) . " " . escapeshellarg($video_list) . " 2>&1";
    
    exec($cmd, $output, $return_var);
    $message = ($return_var === 0) ? "Loop video generated with " . count($selected_videos) . " videos!" : "Error: " . implode("<br>", $output);
    $status = ($return_var === 0) ? "success" : "error";
}

// 3. Handle Streaming Config
$streamConfigFile = __DIR__ . '/../config/stream_settings.json';
$streamSettings = file_exists($streamConfigFile) ? json_decode(file_get_contents($streamConfigFile), true) : ['rtmp_url' => '', 'stream_key' => ''];

if ($action === 'save_stream') {
    $streamSettings['rtmp_url'] = $_POST['rtmp_url'];
    $streamSettings['stream_key'] = $_POST['stream_key'];
    file_put_contents($streamConfigFile, json_encode($streamSettings, JSON_PRETTY_PRINT));
    $message = "Streaming config saved!"; $status = "success";
}

// 4. Start/Stop Stream
if ($action === 'start_stream') {
    $rtmp = $streamSettings['rtmp_url'] . $streamSettings['stream_key'];
    $videoPath = __DIR__ . '/../output/final_loop.mp4';
    if (file_exists($videoPath)) {
        exec("start /B ffmpeg -re -stream_loop -1 -i " . escapeshellarg($videoPath) . " -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -f flv " . escapeshellarg($rtmp));
        $message = "Stream STARTED!"; $status = "success";
    }
}
if ($action === 'stop_stream') { exec("taskkill /F /IM ffmpeg.exe"); $message = "Stream STOPPED!"; $status = "success"; }

// Get available videos
$availableVideos = array_diff(scandir($videoDir), array('.', '..'));

$logFile = __DIR__ . '/../logs/combined.log';
$logs = file_exists($logFile) ? array_reverse(array_slice(file($logFile), -15)) : [];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>StreamLoop Pro | Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #ef4444; --accent: #22c55e; --bg: #0f172a; --card: rgba(30, 41, 59, 0.7); }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: white; margin: 0; padding: 2rem; }
        .grid { display: grid; grid-template-columns: 350px 1fr 350px; gap: 1.5rem; max-width: 1400px; margin: auto; }
        .glass-card { background: var(--card); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 1.5rem; height: fit-content; }
        h2 { font-size: 1.2rem; margin-top: 0; color: #f87171; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .video-list { max-height: 400px; overflow-y: auto; background: rgba(0,0,0,0.2); border-radius: 10px; padding: 10px; }
        .video-item { display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem; }
        .btn { border: none; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; width: 100%; color: white; margin-top: 5px; }
        .btn-primary { background: var(--primary); }
        .btn-accent { background: var(--accent); }
        .btn-upload { background: #6366f1; }
        input, select { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 8px; color: white; margin-bottom: 10px; box-sizing: border-box; }
        .alert { padding: 0.8rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.8rem; text-align: center; }
        .alert-success { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
        .alert-error { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    </style>
</head>
<body>
    <?php if ($message): ?>
        <div class="alert alert-<?php echo $status; ?>"><?php echo $message; ?></div>
    <?php endif; ?>

    <div class="grid">
        <!-- Media Manager -->
        <div class="glass-card">
            <h2>📁 Media Manager</h2>
            <form action="?action=upload" method="POST" enctype="multipart/form-data" style="margin-bottom: 1.5rem;">
                <label style="font-size: 0.75rem; color: #94a3b8;">Upload Video Baru (.mp4)</label>
                <input type="file" name="video" accept="video/mp4" required>
                <button type="submit" class="btn btn-upload">📤 Upload Video</button>
            </form>

            <label style="font-size: 0.75rem; color: #94a3b8;">Daftar Video Tersedia:</label>
            <form id="gen-form" action="?action=generate" method="POST">
                <div class="video-list">
                    <?php if (empty($availableVideos)): ?>
                        <p style="font-size: 0.8rem; color: #64748b; text-align: center;">Folder kosong.</p>
                    <?php else: ?>
                        <?php foreach($availableVideos as $v): ?>
                            <div class="video-item">
                                <input type="checkbox" name="selected_videos[]" value="<?php echo $v; ?>" checked style="width: auto; margin: 0;">
                                <span><?php echo htmlspecialchars($v); ?></span>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
        </div>

        <!-- Generation & Automation -->
        <div class="glass-card">
            <h2>🚀 Content Factory</h2>
                <div style="margin-bottom: 1rem;">
                    <label>Niche Produk</label>
                    <select name="niche">
                        <option value="umum">🔥 Umum / Viral</option>
                        <option value="murottal">📖 Murottal</option>
                        <option value="skincare">✨ Skincare</option>
                        <option value="alat_dapur">🍳 Alat Dapur</option>
                    </select>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem;">
                        <input type="checkbox" name="use_ai" style="width: auto; margin: 0;"> Gunakan AI Ollama Hook
                    </label>
                </div>
                <button type="submit" class="btn btn-primary" style="padding: 20px; font-size: 1rem;">✨ GENERATE LOOP VIDEO</button>
            </form>

            <div style="margin-top: 2rem; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 15px;">
                <h3 style="font-size: 0.9rem; margin-top: 0;">Logs:</h3>
                <div style="font-family: monospace; font-size: 0.7rem; max-height: 200px; overflow-y: auto;">
                    <?php foreach ($logs as $log): $data = json_decode($log, true); if ($data): ?>
                        <div style="margin-bottom: 2px;">
                            <span style="color: #6366f1;">[<?php echo date('H:i', strtotime($data['timestamp'])); ?>]</span> 
                            <?php echo htmlspecialchars($data['message']); ?>
                        </div>
                    <?php endif; endforeach; ?>
                </div>
            </div>
        </div>

        <!-- Streaming Controller -->
        <div class="glass-card">
            <h2>📡 Streaming Setup</h2>
            <form action="?action=save_stream" method="POST">
                <label>Server URL</label>
                <input type="text" name="rtmp_url" value="<?php echo htmlspecialchars($streamSettings['rtmp_url']); ?>">
                <label>Stream Key</label>
                <input type="password" name="stream_key" value="<?php echo htmlspecialchars($streamSettings['stream_key']); ?>">
                <button type="submit" class="btn btn-upload" style="background: #475569;">💾 Save Config</button>
            </form>

            <div style="margin-top: 2rem;">
                <a href="?action=start_stream" class="btn btn-accent" style="display: block; text-align: center; text-decoration: none; padding: 15px;">🟢 START LIVE</a>
                <a href="?action=stop_stream" class="btn btn-primary" style="display: block; text-align: center; text-decoration: none; margin-top: 10px;">🔴 STOP LIVE</a>
            </div>
        </div>
    </div>
</body>
</html>
