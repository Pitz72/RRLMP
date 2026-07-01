// Rimuove i binari ffprobe-static delle piattaforme/architetture diverse da quella corrente.
// ffprobe-static spedisce nel pacchetto npm i binari precompilati per darwin/linux/win32
// (arm64/x64/ia32) tutti insieme (~336MB): ne serve solo uno per build, il resto va sprecato
// nel pacchetto finale (causa principale del superamento dei 500MB, indagine 2026-07-01).
// Eseguito come postinstall: gira su ogni npm install, quindi anche nei runner CI per-OS.
const fs = require('fs');
const path = require('path');
const os = require('os');

const binRoot = path.join(__dirname, '..', 'node_modules', 'ffprobe-static', 'bin');
if (!fs.existsSync(binRoot)) {
  process.exit(0);
}

const keepPlatform = os.platform();
const keepArch = os.arch();

for (const platform of fs.readdirSync(binRoot)) {
  const platformDir = path.join(binRoot, platform);
  if (!fs.statSync(platformDir).isDirectory()) continue;

  if (platform !== keepPlatform) {
    fs.rmSync(platformDir, { recursive: true, force: true });
    continue;
  }

  for (const arch of fs.readdirSync(platformDir)) {
    const archDir = path.join(platformDir, arch);
    if (!fs.statSync(archDir).isDirectory()) continue;
    if (arch !== keepArch) {
      fs.rmSync(archDir, { recursive: true, force: true });
    }
  }
}

console.log(`[prune-native-binaries] ffprobe-static: tenuto solo ${keepPlatform}/${keepArch}`);
