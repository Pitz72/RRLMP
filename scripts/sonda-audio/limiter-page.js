(async () => {
  const SR = 48000;
  const db = (x) => 20 * Math.log10(x);
  const lin = (d) => Math.pow(10, d / 20);
  // Sinusoide 1 kHz costante a `levelDb` di picco; ritorna il picco d'uscita a regime (ultimi 0.5 s)
  async function steady(cfg, levelDb) {
    const dur = 1.5;
    const ctx = new OfflineAudioContext(2, SR * dur, SR);
    const osc = ctx.createOscillator(); osc.frequency.value = 1000;
    const g = ctx.createGain(); g.gain.value = lin(levelDb);
    let node = osc.connect(g);
    if (cfg) {
      const c = ctx.createDynamicsCompressor();
      c.threshold.value = cfg.threshold; c.ratio.value = cfg.ratio ?? 20; c.knee.value = cfg.knee ?? 0;
      c.attack.value = 0.002; c.release.value = 0.1;
      const t = ctx.createGain(); t.gain.value = lin(cfg.trim ?? 0);
      node = node.connect(c).connect(t);
    }
    node.connect(ctx.destination); osc.start();
    const buf = await ctx.startRendering();
    const d = buf.getChannelData(0); let pk = 0;
    for (let i = Math.floor(SR * 1.0); i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
    return db(pk);
  }
  // Transiente: fondo -20 dBFS, botta a `hitDb` per 30 ms a t=0.5 s. Ritorna picco assoluto e fondo 300 ms dopo
  async function transient(cfg, hitDb) {
    const dur = 1.2;
    const ctx = new OfflineAudioContext(1, SR * dur, SR);
    const osc = ctx.createOscillator(); osc.frequency.value = 1000;
    const g = ctx.createGain(); g.gain.value = lin(-20);
    g.gain.setValueAtTime(lin(hitDb), 0.5); g.gain.setValueAtTime(lin(-20), 0.53);
    let node = osc.connect(g);
    const c = ctx.createDynamicsCompressor();
    c.threshold.value = cfg.threshold; c.ratio.value = 20; c.knee.value = 0; c.attack.value = 0.002; c.release.value = 0.1;
    const t = ctx.createGain(); t.gain.value = lin(cfg.trim ?? 0);
    node.connect(c).connect(t).connect(ctx.destination); osc.start();
    const d = (await ctx.startRendering()).getChannelData(0);
    let pk = 0; for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
    let fl = 0; for (let i = Math.floor(SR * 0.83); i < Math.floor(SR * 0.86); i++) fl = Math.max(fl, Math.abs(d[i]));
    return { peak: db(pk), floor: db(fl) };
  }
  const lines = [];
  const f = (x) => x.toFixed(2).padStart(7);
  lines.push('ELECTRON ' + navigator.userAgent.match(/Electron\/[\d.]+/)?.[0] + ' ' + navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0]);
  lines.push('\n== 1. CONFIG FINO ALLA 1.15.33: soglia -1, 20:1, knee 0, nessun trim ==');
  for (const L of [-60, -20, -6, -3, -1, 0, 3, 6, 12, 24]) {
    const o = await steady({ threshold: -1 }, L); lines.push(`in ${f(L)} -> out ${f(o)}  (diff ${f(o - L)})`);
  }
  lines.push('\n== 2. MAKEUP IMPLICITO vs SOGLIA (ingresso -40 dBFS) ==');
  for (const T of [0, -0.1, -0.5, -1, -2, -3, -4, -5, -6, -8, -10]) {
    const o = await steady({ threshold: T }, -40); lines.push(`soglia ${f(T)} -> makeup ${f(o + 40)}  (per dB ${(T ? (o + 40) / -T : 0).toFixed(3)})`);
  }
  lines.push('\n== 3. PASSTHROUGH chain OFF: soglia 0, ratio 1 ==');
  for (const L of [-40, -6, 0, 6]) { const o = await steady({ threshold: 0, ratio: 1 }, L); lines.push(`in ${f(L)} -> out ${f(o)}`); }
  lines.push('\n== 4. TETTO con trim esatto, al variare della soglia interna (out a 0/+6/+12/+24 dBFS) ==');
  for (const T of [-1, -2, -3, -4, -5, -6, -8]) {
    const mk = (await steady({ threshold: T }, -40)) + 40;
    const r = [];
    for (const L of [0, 6, 12, 24]) r.push(await steady({ threshold: T, trim: -mk }, L));
    lines.push(`soglia ${f(T)} trim ${f(-mk)} -> ${r.map(f).join(' ')}   (max-soglia ${f(Math.max(...r) - T)})`);
  }
  return lines.join('\n');
})()
