const ffmpeg = require('ffmpeg-static');
const ffprobe = require('ffprobe-static');
const { execSync } = require('child_process');

try {
  console.log('FFmpeg path:', ffmpeg);
  const ffmpegVersion = execSync(`"${ffmpeg}" -version`).toString().split('\n')[0];
  console.log('FFmpeg version:', ffmpegVersion);

  console.log('ffprobe path:', ffprobe.path);
  const ffprobeVersion = execSync(`"${ffprobe.path}" -version`).toString().split('\n')[0];
  console.log('ffprobe version:', ffprobeVersion);
  
  process.exit(0);
} catch (err) {
  console.error('Diagnostic failed:', err.message);
  process.exit(1);
}
