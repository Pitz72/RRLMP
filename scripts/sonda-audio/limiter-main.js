// Sonda del limiter: DynamicsCompressorNode di Chromium su OfflineAudioContext
// (sinusoide 1 kHz). Uso dalla radice del repo: npx electron scripts/sonda-audio/limiter-main.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, webPreferences: { backgroundThrottling: false } });
  await w.loadURL('about:blank');
  const code = fs.readFileSync(path.join(__dirname, 'limiter-page.js'), 'utf8');
  try {
    const out = await w.webContents.executeJavaScript(code);
    console.log(out);
  } catch (e) { console.error('ERR', e); }
  app.quit();
});
