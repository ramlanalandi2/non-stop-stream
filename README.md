# Non Stop Stream

Automation project for preparing looped video content and live-stream assets.

## Tech Stack

- Node.js
- FFmpeg
- PHP/XAMPP compatible web files

## Features

- Generate loop-ready video output.
- Prepare stream assets for RTMP workflows.
- Keep input videos, generated output, and logs outside source control when possible.

## Local Setup

```powershell
npm install
```

Generate or run project scripts according to the files in `src/` and project configuration.

## Notes

- Install FFmpeg and make sure it is available in PATH.
- Do not commit large generated video files.
- Keep stream keys and credentials out of Git.

