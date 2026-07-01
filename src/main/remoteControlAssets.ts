// Controllo Remoto (2026-07-01, Step 2-3/N) — asset statici della pagina web
// servita dal server LAN: shell HTML/CSS/JS + manifest PWA + service worker.
// Tenuti in un file separato da RemoteControlServer.ts per non appesantire la
// logica del server con markup/stringhe lunghe.
//
// Step 3: dopo la verifica PIN via HTTP (/api/verify-pin, solo per un feedback
// immediato all'utente), la pagina apre una connessione WebSocket indipendente
// e la autentica di nuovo con lo stesso PIN (il server non fida della sola
// verifica HTTP per autorizzare comandi sul socket). Un solo comando abilitato
// per ora: STOP ALL.

export const INDEX_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<meta name="theme-color" content="#0f172a" />
<title>RRLMP — Regia Remota</title>
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icon.png" />
<style>
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    background: #0f172a;
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    width: 100%;
    max-width: 360px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 28px;
    text-align: center;
  }
  h1 { font-size: 18px; margin: 0 0 4px; letter-spacing: 0.05em; }
  p.sub { color: #94a3b8; font-size: 12px; margin: 0 0 24px; }
  input {
    width: 100%;
    font-size: 28px;
    letter-spacing: 0.4em;
    text-align: center;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #475569;
    background: #0f172a;
    color: #e2e8f0;
    margin-bottom: 16px;
  }
  input:focus { outline: none; border-color: #0ea5e9; }
  button {
    width: 100%;
    padding: 14px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 10px;
    background: #0ea5e9;
    color: #0f172a;
    cursor: pointer;
  }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  #status { margin-top: 16px; font-size: 13px; min-height: 18px; }
  #status.ok { color: #4ade80; }
  #status.err { color: #f87171; }
  #controls { display: none; margin-top: 20px; }
  #stopAll {
    background: #dc2626;
    color: #fff;
    font-size: 18px;
    padding: 22px;
    letter-spacing: 0.05em;
  }
</style>
</head>
<body>
  <div class="card">
    <h1>RUNTIME LIVE MACHINE PRO</h1>
    <p class="sub">Regia Remota — inserisci il PIN mostrato in regia</p>
    <input id="pin" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="------" />
    <button id="connect">Connetti</button>
    <div id="status"></div>
    <div id="controls">
      <button id="stopAll">■ STOP ALL</button>
    </div>
  </div>
<script>
(function () {
  var pinInput = document.getElementById('pin');
  var btn = document.getElementById('connect');
  var status = document.getElementById('status');
  var controls = document.getElementById('controls');
  var stopAllBtn = document.getElementById('stopAll');
  var socket = null;

  function setStatus(text, cls) {
    status.textContent = text;
    status.className = cls || '';
  }

  function openCommandChannel(pin) {
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var ws = new WebSocket(proto + '//' + location.host + '/ws');
    ws.onopen = function () {
      ws.send(JSON.stringify({ type: 'auth', pin: pin }));
    };
    ws.onmessage = function (event) {
      var msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      if (msg.type === 'auth-result') {
        if (msg.ok) {
          socket = ws;
          setStatus('Connesso.', 'ok');
          controls.style.display = 'block';
        } else {
          setStatus(msg.error === 'rate-limited' ? 'Troppi tentativi, riprova più tardi.' : 'PIN errato.', 'err');
        }
      }
    };
    ws.onclose = function () {
      if (socket === ws) {
        socket = null;
        controls.style.display = 'none';
        setStatus('Disconnesso.', 'err');
      }
    };
    ws.onerror = function () { /* gestito da onclose */ };
  }

  function tryConnect() {
    var pin = pinInput.value.trim();
    if (!/^\\d{6}$/.test(pin)) {
      setStatus('Il PIN deve avere 6 cifre.', 'err');
      return;
    }
    btn.disabled = true;
    setStatus('Verifica in corso…');
    fetch('/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin })
    })
      .then(function (res) {
        if (res.status === 429) { setStatus('Troppi tentativi, riprova più tardi.', 'err'); return null; }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        if (data.ok) {
          openCommandChannel(pin);
        } else {
          setStatus('PIN errato.', 'err');
        }
      })
      .catch(function () { setStatus('Errore di connessione al server.', 'err'); })
      .finally(function () { btn.disabled = false; });
  }

  btn.addEventListener('click', tryConnect);
  pinInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryConnect(); });

  stopAllBtn.addEventListener('click', function () {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    stopAllBtn.disabled = true;
    socket.send(JSON.stringify({ type: 'command', name: 'stopAll' }));
    setTimeout(function () { stopAllBtn.disabled = false; }, 500);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () { /* PWA opzionale, nessun impatto se fallisce */ });
  }
})();
</script>
</body>
</html>
`;

export const MANIFEST_JSON = JSON.stringify({
    name: 'RRLMP — Regia Remota',
    short_name: 'RRLMP Remoto',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    orientation: 'any',
    icons: [
        { src: '/icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' }
    ]
});

// Service worker minimale: cache solo la shell statica (mai le risposte di
// /api/*, che devono sempre arrivare fresche dal server). Rende la pagina
// installabile e riduce i tempi di ricarica in LAN, ma il controllo remoto
// vero e proprio richiede sempre una connessione di rete al server.
export const SERVICE_WORKER_JS = `
const CACHE_NAME = 'rrlmp-remote-shell-v1';
const SHELL_URLS = ['/', '/manifest.json', '/icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return; // mai cachare i comandi/verifiche
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
`;
