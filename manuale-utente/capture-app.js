// Cattura schermate REALI del renderer (Vite dev su :5199) via Electron capturePage.
// Il renderer gira col devMock (window.electron simulato) perché questa finestra
// non ha preload. Uso:  electron manuale-utente/capture-app.js <outDir>
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const outDir = process.argv[2] || '.';
const LANG = process.env.CAP_LANG || 'it';               // it|en (app solo italiano e inglese dalla 1.15.32)
const LANGBTN = { it: 'Italiano', en: 'English' }[LANG] || 'Italiano';

// v1.15.32: la lingua si sceglie da una tendina in alto a destra della schermata
// di benvenuto — va aperta prima di cliccare l'opzione.
const PICK_LANG_JS = `(async()=>{
    const trig=document.querySelector('button[aria-haspopup="listbox"]');
    if(!trig) return 'no-trigger';
    trig.click();
    await new Promise(r=>setTimeout(r,250));
    const opt=[...document.querySelectorAll('[role=option]')].find(o=>(o.textContent||'').includes(${JSON.stringify(LANGBTN)}));
    if(opt) opt.click(); else trig.click();
    return !!opt;
})()`;

// Per la figura dell'interfaccia: un brano della colonna Musica "in onda", così
// la hero IN ONDA mostra titolo, avanzamento e timer. Stato simulato solo nello
// store del renderer (devMock: nessun audio reale).
const ON_AIR_JS = `(async()=>{
    const { useAudioStore } = await import('/src/store/useAudioStore.ts');
    const { useProjectStore } = await import('/src/store/useProjectStore.ts');
    const clip = useProjectStore.getState().columns.flatMap(c=>c.clips).find(c=>/Midnight City/i.test(c.name));
    if(!clip) return 'no-clip';
    const dur = clip.duration || 244, t = 98;
    const player = new Proxy({}, { get: (_, k) => typeof k !== 'string' ? undefined
        : k.includes('Duration') ? () => dur
        : k.includes('CurrentTime') ? () => t
        : () => undefined });
    useAudioStore.setState({ activeClips: { [clip.id]: { player, isPlaying: true, progress: t / dur, clip } } });
    return 'on-air';
})()`;
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

    // Lingua UI
    console.log('  lingua:', await win.webContents.executeJavaScript(PICK_LANG_JS));
    await sleep(500);
    await shot(win, '01-benvenuto.png');

    // Nuovo progetto + dati demo
    await win.webContents.executeJavaScript(`(()=>{const g=document.querySelector('.btn-green');if(g)g.click();return !!g;})()`);
    await sleep(500);
    await win.webContents.executeJavaScript(`(()=>{ if(window.__seedDemo){window.__seedDemo(${JSON.stringify(LANG)});return 'seeded';} return 'noseed'; })()`);
    await sleep(1000);
    console.log('  hero:', await win.webContents.executeJavaScript(ON_AIR_JS));
    await sleep(800);
    await shot(win, '02-interfaccia.png');

    // Menu Strumenti aperto (per Figura 3.1 + ritaglio barra-controllo)
    try {
        await win.webContents.executeJavaScript(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.querySelector('svg.lucide-wrench'));if(b){b.click();return true;}return false;})()`);
        await sleep(600);
        await shot(win, '07-menu-strumenti.png');
        await win.webContents.executeJavaScript(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.querySelector('svg.lucide-wrench'));if(b)b.click();return true;})()`);
        await sleep(300);
    } catch (e) { console.log('  wrench skip', e.message); }

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
