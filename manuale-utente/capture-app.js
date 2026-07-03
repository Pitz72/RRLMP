// Cattura schermate REALI del renderer (Vite dev su :5199) via Electron capturePage.
// Il renderer gira col devMock (window.electron simulato) perché questa finestra
// non ha preload. Uso:  electron manuale-utente/capture-app.js <outDir>
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const outDir = process.argv[2] || '.';
const URL = 'http://localhost:5199/';
const W = 1600, H = 900;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

app.disableHardwareAcceleration();

async function shot(win, name) {
    await sleep(600);
    const img = await win.webContents.capturePage();
    const p = path.join(outDir, name);
    fs.writeFileSync(p, img.toPNG());
    console.log('  ->', name);
}

app.whenReady().then(async () => {
    fs.mkdirSync(outDir, { recursive: true });
    const win = new BrowserWindow({
        width: W, height: H, show: false, useContentSize: true,
        webPreferences: { offscreen: true, backgroundThrottling: false },
    });
    await win.loadURL(URL);
    await sleep(1600);

    // Lingua italiana
    await win.webContents.executeJavaScript(`(()=>{const it=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Italiano'));if(it)it.click();return !!it;})()`);
    await sleep(500);
    await shot(win, '01-benvenuto.png');

    // Nuovo progetto + dati demo
    await win.webContents.executeJavaScript(`(()=>{const g=document.querySelector('.btn-green');if(g)g.click();return !!g;})()`);
    await sleep(500);
    await win.webContents.executeJavaScript(`(()=>{ if(window.__seedDemo){window.__seedDemo();return 'seeded';} return 'noseed'; })()`);
    await sleep(1000);
    await shot(win, '02-interfaccia.png');

    // Pad FX
    try {
        await win.webContents.executeJavaScript(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='FX');if(b)b.click();return !!b;})()`);
        await sleep(700);
        await shot(win, '03-pad-fx.png');
        await win.webContents.executeJavaScript(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='FX');if(b)b.click();return true;})()`);
    } catch (e) { console.log('  FX skip', e.message); }

    // Automix
    try {
        await win.webContents.executeJavaScript(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='MIX');if(b)b.click();return !!b;})()`);
        await sleep(700);
        await shot(win, '04-automix.png');
        await win.webContents.executeJavaScript(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='MIX');if(b)b.click();return true;})()`);
    } catch (e) { console.log('  MIX skip', e.message); }

    console.log('FATTO');
    app.quit();
}).catch(e => { console.error('ERRORE:', e); app.exit(1); });
