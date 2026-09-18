// Sonda della catena master: fa girare il VERO AudioContextManager (bundlato da
// run-chain.sh) su un OfflineAudioContext e salva l'uscita in WAV float32.
// Uso: electron chain-main.js <cartella di lavoro> <etichetta>
// La cartella deve contenere blank.html, acm.bundle.js e i WAV sorgente
// (PCM 16 bit stereo 48 kHz: loud.wav, dyn.wav). Lo prepara run-chain.sh.
const { app, BrowserWindow } = require('electron');
const fs = require('fs'); const path = require('path');
const [workDir, tag] = process.argv.slice(-2);
app.disableHardwareAcceleration();
process.on('unhandledRejection', (e) => { console.error('FATAL', e); process.exit(1); });
app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false, webPreferences: { backgroundThrottling: false, webSecurity: false } });
  await w.loadFile(path.join(workDir, 'blank.html'));
  const run = fs.readFileSync(path.join(__dirname, 'chain-page.js'), 'utf8');
  for (const src of ['loud', 'dyn']) {
    for (const state of ['off', 'glueoff', 'glueon']) {
      const len = await w.webContents.executeJavaScript(`(${run})(${JSON.stringify(src)}, ${JSON.stringify(state)})`);
      // Trasferimento a pezzi: una stringa unica da ~30 MB blocca executeJavaScript.
      let b64 = ''; const CH = 1 << 20;
      for (let i = 0; i < len; i += CH) b64 += await w.webContents.executeJavaScript(`window.__out.slice(${i}, ${i + CH})`);
      fs.writeFileSync(path.join(workDir, `out-${tag}-${src}-${state}.wav`), Buffer.from(b64, 'base64'));
    }
  }
  app.quit();
});
