// Rasterizzatore SVG -> PNG via Electron (offscreen). Uso:
//   electron manuale-utente/render-svg.js <input.svg> <output.png> [scale]
// Nessuna dipendenza esterna: usa il Chromium di Electron già in node_modules.
//
// NOTA: un BrowserWindow (anche offscreen) viene silenziosamente troncato al
// workArea dello schermo fisico se la dimensione richiesta lo supera (es. un
// banner 2520x1080 su un monitor 1920x1080 catturava solo 1920x855, tagliando
// il contenuto a destra/in basso). Per evitarlo si renderizza SEMPRE a una
// dimensione che sta dentro lo schermo (native scaling via CSS width/height
// sull'elemento <svg>, che scala il contenuto rispettando il viewBox), poi si
// fa un resize bitmap del risultato per arrivare alla `scale` richiesta.
const { app, BrowserWindow, screen } = require('electron');
const fs = require('fs');

const [inSvg, outPng, scaleArg] = process.argv.slice(2);
const scale = Number(scaleArg) || 2;

function readSize(svg) {
    let m = svg.match(/viewBox\s*=\s*"[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)"/);
    if (m) return { w: Math.round(+m[1]), h: Math.round(+m[2]) };
    const wm = svg.match(/width\s*=\s*"([\d.]+)"/);
    const hm = svg.match(/height\s*=\s*"([\d.]+)"/);
    return { w: Math.round(+(wm && wm[1] || 1200)), h: Math.round(+(hm && hm[1] || 800)) };
}

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
    const svg = fs.readFileSync(inSvg, 'utf8');
    const { w, h } = readSize(svg);

    const work = screen.getPrimaryDisplay().workAreaSize;
    const MARGIN = 1; // il limite reale e' il workArea stesso, nessun margine extra
    const renderScale = Math.min(1, (work.width * MARGIN) / w, (work.height * MARGIN) / h);
    const rw = Math.max(1, Math.round(w * renderScale));
    const rh = Math.max(1, Math.round(h * renderScale));

    const win = new BrowserWindow({
        width: rw, height: rh, show: false,
        useContentSize: true,
        webPreferences: { offscreen: true, backgroundThrottling: false },
    });
    // CSS width/height sull'<svg> (non i suoi attributi width/height, che restano
    // il viewBox originale) forza lo scaling nativo del contenuto a rw x rh.
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}html,body{width:${rw}px;height:${rh}px;overflow:hidden;background:transparent}svg{display:block;width:${rw}px;height:${rh}px}</style></head><body>${svg}</body></html>`;
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    await new Promise(r => setTimeout(r, 700));
    const img = await win.webContents.capturePage();
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);
    const resized = (targetW !== rw || targetH !== rh) ? img.resize({ width: targetW, height: targetH }) : img;
    fs.writeFileSync(outPng, resized.toPNG());
    console.log('PNG scritto:', outPng, `${targetW}x${targetH}`, renderScale < 1 ? `(renderizzato a ${rw}x${rh} per il limite schermo, poi ridimensionato)` : '');
    app.quit();
}).catch(e => { console.error('ERRORE:', e); app.exit(1); });
