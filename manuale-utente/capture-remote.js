// Cattura le figure del Capitolo 11 (Controllo Remoto), v1.15.37:
//   08-remoto-impostazioni.png — sezione Controllo Remoto delle Impostazioni con
//                                QR code (renderer Vite :5199 + devMock);
//   09-remoto-fx.png           — pagina del telefono, scheda FX;
//   10-remoto-musica.png       — pagina del telefono, scheda MUSICA col MIX acceso.
// La pagina del telefono è servita dal server VERO (out/main, serve `npm run
// build:main`), con uno stato dimostrativo. Le catture passano dal protocollo
// DevTools a densità 2: nitide anche con Windows al 200% e finestre piccole.
//
// Uso:  electron manuale-utente/capture-remote.js <outDir> <phone|settings> --force-device-scale-factor=1
//       (CAP_LANG=it|en; la pagina del telefono segue la lingua del «browser»).
//       Le due parti girano in processi separati: nello stesso processo, dopo la
//       pagina del telefono, il caricamento della regia di sviluppo falliva (ERR_FAILED).
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');

const outDir = process.argv[2] || '.';
const PART = process.argv[3] || 'phone';
const LANG = process.env.CAP_LANG || 'it';
const LANGBTN = { it: 'Italiano', en: 'English' }[LANG] || 'Italiano';
app.commandLine.appendSwitch('lang', LANG === 'it' ? 'it-IT' : 'en-US');
app.disableHardwareAcceleration();

const ROOT = path.join(__dirname, '..');
const server = require(path.join(ROOT, 'out', 'main', 'RemoteControlServer.js'));
const { buildQrMatrix } = require(path.join(ROOT, 'out', 'main', 'qrMatrix.js'));
const loc = require(path.join(ROOT, 'src', 'renderer', 'src', 'locales', LANG + '.json'));

const PIN = '482913';
const DEMO_ADDR = '192.168.1.42'; // indirizzo dimostrativo (lo stesso del devMock)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- stato dimostrativo (nomi nella lingua del manuale) ----
const FX_NAMES = {
    it: ['Applausi', 'Risata', 'Rullo di tamburi', 'Gong', 'Clacson', 'Campanello', 'Buu', 'Buzzer', 'Registratore di cassa', 'Ding', 'Sirena', 'Fanfara'],
    en: ['Applause', 'Laugh', 'Drum roll', 'Gong', 'Horn', 'Bell', 'Boo', 'Buzzer', 'Cash register', 'Ding', 'Siren', 'Fanfare'],
}[LANG];
const FX_COLORS = ['#F59E0B', '#EC4899', '#3B82F6', '#A855F7', null, null, '#EF4444', null, '#10B981', '#06B6D4', null, '#FBBF24'];
const fx = FX_NAMES.map((name, i) => ({
    id: 'fx' + i,
    name,
    isPlaying: i === 0 || i === 2,           // applausi e rullo di tamburi in onda
    ...(FX_COLORS[i] ? { color: FX_COLORS[i] } : {}),
    ...(i === 10 ? { missing: true } : {}),  // un file mancante, per la figura
}));
const music = [
    { id: 'm1', name: 'Midnight City', isPlaying: false, fading: true },
    { id: 'm2', name: 'Blinding Lights', isPlaying: true },
    { id: 'm3', name: 'Redbone', isPlaying: false },
    { id: 'm4', name: LANG === 'it' ? 'Sigla di chiusura' : 'Closing theme', isPlaying: false },
];
const mix = { on: true, nextId: 'm3', nextName: 'Redbone', nextMode: 'tempo', last: 'beatmatched' };

function freePort() {
    return new Promise((resolve, reject) => {
        const s = net.createServer();
        s.on('error', reject);
        s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
    });
}

/** Screenshot via DevTools a densità 2 (clip in px CSS). */
async function emulate(win, viewport) {
    const dbg = win.webContents.debugger;
    if (!dbg.isAttached()) dbg.attach('1.3');
    await dbg.sendCommand('Emulation.setDeviceMetricsOverride', {
        width: viewport.width, height: viewport.height, deviceScaleFactor: 2, mobile: !!viewport.mobile,
    });
    await sleep(500);
}

async function cdpShot(win, file, viewport, clip) {
    const dbg = win.webContents.debugger;
    if (!dbg.isAttached()) await emulate(win, viewport);
    const res = await dbg.sendCommand('Page.captureScreenshot', {
        format: 'png',
        clip: clip ? { ...clip, scale: 1 } : { x: 0, y: 0, width: viewport.width, height: viewport.height, scale: 1 },
    });
    fs.writeFileSync(path.join(outDir, file), Buffer.from(res.data, 'base64'));
    console.log('  ->', file);
}

app.whenReady().then(async () => {
    fs.mkdirSync(outDir, { recursive: true });

    if (PART === 'phone') await capturePhone();
    else await captureSettings();
    console.log('FATTO');
    app.quit();
}).catch(e => { console.error('ERRORE:', e); app.exit(1); });

async function capturePhone() {
    // ---------- pagina del telefono (server vero) ----------
    const port = await freePort();
    server.updateRemoteState({ music, fx, mix });
    server.startRemoteControlServer({ onCommand: () => {} }, PIN, port);
    await sleep(300);

    const phone = new BrowserWindow({
        width: 420, height: 900, show: false, useContentSize: true,
        webPreferences: { offscreen: true, backgroundThrottling: false },
    });
    const PHONE = { width: 390, height: 844, mobile: true };
    // NB: l'emulazione DevTools va attivata DOPO il caricamento della pagina
    // (attivata prima, su una finestra fuori schermo, Electron si chiudeva di colpo).
    await phone.loadURL(`http://127.0.0.1:${port}/#pin=${PIN}`);
    await emulate(phone, PHONE);
    await sleep(1300);
    console.log('  telefono:', await phone.webContents.executeJavaScript(`document.getElementById('connText').textContent + ' · pad ' + document.querySelectorAll('#padGrid .pad').length`));
    await cdpShot(phone, '09-remoto-fx.png', PHONE);
    await phone.webContents.executeJavaScript(`document.getElementById('tabMusic').click()`);
    await sleep(500);
    await cdpShot(phone, '10-remoto-musica.png', PHONE);
    phone.destroy();
    server.stopRemoteControlServer();
}

async function captureSettings() {
    // ---------- sezione Impostazioni con QR code (renderer di sviluppo) ----------
    const W = 1600, H = 1000;
    const win = new BrowserWindow({
        width: W, height: H, show: false, useContentSize: true,
        webPreferences: { offscreen: true, backgroundThrottling: false },
    });
    // Il primo caricamento può essere interrotto da un ricaricamento di Vite
    // (ERR_FAILED/ERR_ABORTED): si riprova una volta.
    try { await win.loadURL('http://localhost:5199/'); }
    catch (e) { console.log('  (nuovo tentativo:', e.message + ')'); await sleep(1500); await win.loadURL('http://localhost:5199/'); }
    // densità 2 SUBITO: attivata dopo la misura del riquadro, ridisponeva la
    // finestra e il ritaglio usciva spostato
    await emulate(win, { width: W, height: H });
    await sleep(1100);
    await win.webContents.executeJavaScript(`(async()=>{
        const trig=document.querySelector('button[aria-haspopup="listbox"]');
        if(!trig) return 'no-trigger';
        trig.click(); await new Promise(r=>setTimeout(r,250));
        const opt=[...document.querySelectorAll('[role=option]')].find(o=>(o.textContent||'').includes(${JSON.stringify(LANGBTN)}));
        if(opt) opt.click(); else trig.click();
        return !!opt;
    })()`);
    await sleep(400);
    await win.webContents.executeJavaScript(`(()=>{const g=document.querySelector('.btn-green');if(g)g.click();})()`);
    await sleep(400);
    await win.webContents.executeJavaScript(`(()=>{ if(window.__seedDemo) window.__seedDemo(${JSON.stringify(LANG)}); })()`);
    await sleep(900);
    // devMock: server «acceso», un dispositivo collegato, QR del link dimostrativo
    const qr = buildQrMatrix(`http://${DEMO_ADDR}:8787/#pin=${PIN}`);
    await win.webContents.executeJavaScript(`(()=>{
        const st = { running: true, pin: ${JSON.stringify(PIN)}, port: 8787, addresses: [${JSON.stringify(DEMO_ADDR)}, '172.26.160.1'], clients: 1, autoStart: false };
        const qr = ${JSON.stringify(qr)};
        window.electron.remoteControlStatus = async () => st;
        window.electron.remoteControlStart = async () => st;
        window.electron.remoteControlQr = async () => qr;
        return 'ok';
    })()`);
    await win.webContents.executeJavaScript(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.querySelector('svg.lucide-wrench'));if(b){b.click();return 'wrench';}return 'no-wrench';})()`);
    await sleep(400);
    await win.webContents.executeJavaScript(`(()=>{
        const lbl=${JSON.stringify(loc.controls.settings)};
        const t=[...document.querySelectorAll('.menu-item')].find(b=>(b.textContent||'').includes(lbl));
        if(t){ t.click(); return 'clicked'; } return 'no-item';
    })()`);
    await sleep(1200);
    const rect = await win.webContents.executeJavaScript(`(()=>{
        const title=${JSON.stringify(loc.modal.settings.remoteControlTitle)};
        const sec=[...document.querySelectorAll('section')].find(s=>(s.querySelector('h3')||{}).textContent===title);
        if(!sec) return null;
        sec.scrollIntoView({ block: 'center' });
        const r=sec.getBoundingClientRect();
        return { x: Math.floor(r.x - 16), y: Math.floor(r.y - 14), width: Math.ceil(r.width + 32), height: Math.ceil(r.height + 28) };
    })()`);
    if (!rect) throw new Error('sezione Controllo Remoto non trovata');
    await sleep(500);
    await cdpShot(win, '08-remoto-impostazioni.png', { width: W, height: H }, rect);
    win.destroy();
}
