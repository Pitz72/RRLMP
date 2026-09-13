// Cattura modali specifiche (editor clip, impostazioni) dell'app live via Electron.
// Uso: electron manuale-utente/capture-extra.js <outDir> <mode>
//   mode = clip | settings
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const outDir = process.argv[2] || '.';
const mode = process.argv[3] || 'clip';
const LANG = process.env.CAP_LANG || 'it';               // it|en (app solo italiano e inglese dalla 1.15.32)
const LANGBTN = { it: 'Italiano', en: 'English' }[LANG] || 'Italiano';
// v1.15.32: lingua da tendina in alto a destra della schermata di benvenuto.
const PICK_LANG_JS = `(async()=>{
    const trig=document.querySelector('button[aria-haspopup="listbox"]');
    if(!trig) return 'no-trigger';
    trig.click();
    await new Promise(r=>setTimeout(r,250));
    const opt=[...document.querySelectorAll('[role=option]')].find(o=>(o.textContent||'').includes(${JSON.stringify(LANGBTN)}));
    if(opt) opt.click(); else trig.click();
    return !!opt;
})()`;
// Etichette UI lette dal file locale dell'app: unica fonte di verità, così
// lo screenshot combacia sempre con la lingua selezionata.
const loc = require(path.join(__dirname, '..', 'src', 'renderer', 'src', 'locales', LANG + '.json'));
const L = {
    settings: loc.controls.settings,            // voce menu "Impostazioni Generali"
    markers: loc.modal.clip.tab.markers,        // scheda "Marker & Trim"
    chain: loc.modal.settings.tab.chain,        // scheda "Master Chain" (localizzata!)
};
const URL = 'http://localhost:5199/';
const W = 1600, H = 1000;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
    fs.mkdirSync(outDir, { recursive: true });
    const win = new BrowserWindow({
        width: W, height: H, show: false, useContentSize: true,
        webPreferences: { offscreen: true, backgroundThrottling: false },
    });
    await win.loadURL(URL);
    await sleep(1600);
    await win.webContents.executeJavaScript(PICK_LANG_JS);
    await sleep(400);
    await win.webContents.executeJavaScript(`(()=>{const g=document.querySelector('.btn-green');if(g)g.click();})()`);
    await sleep(400);
    await win.webContents.executeJavaScript(`(()=>{ if(window.__seedDemo) window.__seedDemo(${JSON.stringify(LANG)}); })()`);
    await sleep(1100);

    let name = 'extra.png';
    if (mode === 'clip') {
        // apri le impostazioni della PRIMA clip musicale (contextmenu)
        await win.webContents.executeJavaScript(`(()=>{
            const cards=[...document.querySelectorAll('.clip')];
            const target=cards.find(c=>/Midnight City/i.test(c.textContent))||cards[0];
            if(target){ target.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true})); return 'ok'; }
            return 'no-card';
        })()`);
        await sleep(1200);
        // 05a — scheda Generale
        let img0 = await win.webContents.capturePage();
        fs.writeFileSync(path.join(outDir, '05-editor-generale.png'), img0.toPNG());
        console.log('  -> 05-editor-generale.png');
        // 05b — scheda Marker & Trim (forma d'onda)
        await win.webContents.executeJavaScript(`(()=>{const lbl=${JSON.stringify(L.markers)};const t=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes(lbl));if(t)t.click();return !!t;})()`);
        await sleep(1300);
        name = '05b-forma-onda.png';
    } else if (mode === 'settings') {
        // apri il menu Strumenti (icona chiave lucide-wrench) e la voce Impostazioni
        await win.webContents.executeJavaScript(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.querySelector('svg.lucide-wrench'));if(b){b.click();return 'wrench';}return 'no-wrench';})()`);
        await sleep(400);
        await win.webContents.executeJavaScript(`(()=>{
            const lbl=${JSON.stringify(L.settings)};
            const cands=[...document.querySelectorAll('button,[role=menuitem],a,div,li,span')].filter(b=>(b.textContent||'').includes(lbl));
            const el=cands.sort((a,b)=>(a.textContent||'').length-(b.textContent||'').length)[0];
            if(!el) return 'no-item';
            const t=el.closest('button')||el;
            const r=t.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;
            for(const type of ['pointerdown','mousedown','pointerup','mouseup','click']){
                t.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,clientX:x,clientY:y}));
            }
            return 'clicked';
        })()`);
        await sleep(900);
        await win.webContents.executeJavaScript(`(()=>{const lbl=${JSON.stringify(L.chain)};const t=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes(lbl));if(t)t.click();return !!t;})()`);
        await sleep(500);
        name = '06-impostazioni-masterchain.png';
    }

    await sleep(400);
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(outDir, name), img.toPNG());
    console.log('  ->', name);
    app.quit();
}).catch(e => { console.error('ERRORE:', e); app.exit(1); });
