async (src, state) => {
  const SR = 48000;
  const bytes = await (await fetch(src + '.wav')).arrayBuffer();
  // WAV PCM s16le stereo (prodotto da ffmpeg): parsing a mano, decodeAudioData
  // si blocca nella finestra nascosta.
  const dv = new DataView(bytes); let off = 12, dataOff = 0, inLen = 0;
  while (off < dv.byteLength) { const id = String.fromCharCode(dv.getUint8(off), dv.getUint8(off+1), dv.getUint8(off+2), dv.getUint8(off+3)); const sz = dv.getUint32(off + 4, true); if (id === 'data') { dataOff = off + 8; inLen = sz; break; } off += 8 + sz; }
  const frames = Math.floor(inLen / 4);
  const buf = new AudioBuffer({ numberOfChannels: 2, length: frames, sampleRate: SR });
  const L0 = buf.getChannelData(0), R0 = buf.getChannelData(1);
  for (let i = 0; i < frames; i++) { L0[i] = dv.getInt16(dataOff + i * 4, true) / 32768; R0[i] = dv.getInt16(dataOff + i * 4 + 2, true) / 32768; }
  // L'AudioContextManager fa `new window.AudioContext()`: gli diamo un contesto offline.
  window.AudioContext = class extends OfflineAudioContext { constructor() { super(2, buf.length, SR); } };
  const M = window.ACM.default; M.destroy();
  const m = M.getInstance();
  const s = { ...window.ACM.DEFAULT_MASTER_CHAIN };
  if (state === 'off') s.enabled = false;
  if (state === 'glueoff') s.compressorEnabled = false;
  m.applyMasterChainSettings(s);
  const ctx = m.getContext();
  const node = ctx.createBufferSource(); node.buffer = buf; node.connect(m.getMusicBus()); node.start();
  const out = await ctx.startRendering();
  // WAV float32
  const n = out.length, ch = 2, dataLen = n * ch * 4;
  const ab = new ArrayBuffer(44 + dataLen); const v = new DataView(ab);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + dataLen, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 3, true); v.setUint16(22, ch, true); v.setUint32(24, SR, true);
  v.setUint32(28, SR * ch * 4, true); v.setUint16(32, ch * 4, true); v.setUint16(34, 32, true); w(36, 'data'); v.setUint32(40, dataLen, true);
  const L = out.getChannelData(0), R = out.getChannelData(1); let o = 44;
  for (let i = 0; i < n; i++) { v.setFloat32(o, L[i], true); v.setFloat32(o + 4, R[i], true); o += 8; }
  let bin = ''; const u8 = new Uint8Array(ab); const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) bin += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  window.__out = btoa(bin);
  return window.__out.length;
}
