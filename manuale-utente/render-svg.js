// Rasterizzatore SVG -> PNG via Electron (offscreen). Uso:
//   electron manuale-utente/render-svg.js <input.svg> <output.png> [scale]
// Nessuna dipendenza esterna: usa il Chromium di Electron già in node_modules.
const { app, BrowserWindow } = require('electron');
const path = require('path');
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
    const win = new BrowserWindow({
        width: w, height: h, show: false,
        useContentSize: true,
        webPreferences: { offscreen: true, backgroundThrottling: false },
    });
    win.webContents.setZoomFactor(1);
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}html,body{width:${w}px;height:${h}px;overflow:hidden;background:transparent}svg{display:block;width:${w}px;height:${h}px}</style></head><body>${svg}</body></html>`;
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    await new Promise(r => setTimeout(r, 700));
    const img = await win.webContents.capturePage();
    const resized = scale !== 1 ? img.resize({ width: Math.round(w * scale), height: Math.round(h * scale) }) : img;
    fs.writeFileSync(outPng, resized.toPNG());
    console.log('PNG scritto:', outPng, `${Math.round(w*scale)}x${Math.round(h*scale)}`);
    app.quit();
}).catch(e => { console.error('ERRORE:', e); app.exit(1); });
