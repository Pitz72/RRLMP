// Controllo Remoto (2026-07-01/02) — asset statici della pagina web servita
// dal server LAN. Tenuti in un file separato da RemoteControlServer.ts per non
// appesantire la logica del server con markup/stringhe lunghe.
//
// v1.11.3 — DECISIONE UTENTE (2026-07-02): il controllo remoto torna alla
// prima idea, la più semplice — pagina HTTP aperta nel BROWSER del tablet/PC
// in LAN. Niente più PWA installabile (richiedeva secure context → il buco
// nero dei certificati) e niente app Android (APK/WebView/mDNS, "stavamo
// complicando tutto"). Al posto dell'installazione: un pulsante SCHERMO
// INTERO (Fullscreen API, nascosto dove non supportata, es. iPhone).
//
// Flusso: dopo la verifica PIN via HTTP (/api/verify-pin, solo per un feedback
// immediato all'utente), la pagina apre una connessione WebSocket indipendente
// e la autentica di nuovo con lo stesso PIN (il server non fida della sola
// verifica HTTP per autorizzare comandi sul socket). La pagina mostra la lista
// della colonna Music (messaggi 'state' sul WebSocket, in tempo reale) con un
// bottone play/stop per clip, oltre allo STOP ALL globale.

export const INDEX_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<meta name="theme-color" content="#0f172a" />
<title>RRLMP — Regia Remota</title>
<link rel="icon" href="/icon.png" />
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
    max-width: 420px;
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
  /* v1.11.3: pulsante schermo intero — fisso in alto a destra, sempre
     raggiungibile (sia sulla schermata PIN che sui controlli). */
  #fullscreenBtn {
    position: fixed;
    top: 12px;
    right: 12px;
    width: auto;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 400;
    background: transparent;
    color: #94a3b8;
    border: 1px solid #475569;
    display: none;
  }
  #clipList { margin-top: 16px; text-align: left; max-height: 50vh; overflow-y: auto; }
  .clip-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    background: #0f172a;
    border: 1px solid #334155;
  }
  .clip-row.playing { border-color: #4ade80; }
  .clip-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .clip-btn { flex-shrink: 0; width: auto; padding: 8px 14px; font-size: 12px; }
  .clip-btn.play { background: #0ea5e9; }
  .clip-btn.stop { background: #f59e0b; color: #0f172a; }
  #emptyState { font-size: 12px; color: #64748b; text-align: center; margin-top: 16px; display: none; }
</style>
</head>
<body>
  <button id="fullscreenBtn" type="button">⛶ Schermo intero</button>

  <div class="card" id="pinScreen">
    <h1>RUNTIME LIVE MACHINE PRO</h1>
    <p class="sub">Regia Remota — inserisci il PIN mostrato in regia</p>
    <input id="pin" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="------" />
    <button id="connect">Connetti</button>
    <div id="status"></div>
    <div id="controls">
      <button id="stopAll">■ STOP ALL</button>
      <div id="clipList"></div>
      <p id="emptyState">Nessun brano nella colonna Music.</p>
    </div>
  </div>
<script>
(function () {
  // v1.11.3: schermo intero via Fullscreen API (serve un gesto utente, quindi
  // un pulsante è l'unica via). Nascosto dove l'API non c'è (es. iPhone).
  var fullscreenBtn = document.getElementById('fullscreenBtn');
  var docEl = document.documentElement;
  if (docEl.requestFullscreen || docEl.webkitRequestFullscreen) {
    fullscreenBtn.style.display = 'block';
    function isFullscreen() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }
    function updateFullscreenLabel() {
      fullscreenBtn.textContent = isFullscreen() ? '⛶ Esci da schermo intero' : '⛶ Schermo intero';
    }
    fullscreenBtn.addEventListener('click', function () {
      if (isFullscreen()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        (docEl.requestFullscreen || docEl.webkitRequestFullscreen).call(docEl);
      }
    });
    document.addEventListener('fullscreenchange', updateFullscreenLabel);
    document.addEventListener('webkitfullscreenchange', updateFullscreenLabel);
  }

  var pinInput = document.getElementById('pin');
  var btn = document.getElementById('connect');
  var status = document.getElementById('status');
  var controls = document.getElementById('controls');
  var stopAllBtn = document.getElementById('stopAll');
  var clipList = document.getElementById('clipList');
  var emptyState = document.getElementById('emptyState');
  var socket = null;

  function setStatus(text, cls) {
    status.textContent = text;
    status.className = cls || '';
  }

  function sendCommand(name, clipId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    var msg = { type: 'command', name: name };
    if (clipId) msg.clipId = clipId;
    socket.send(JSON.stringify(msg));
  }

  function renderClipList(clips) {
    clipList.innerHTML = '';
    if (!clips || !clips.length) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';
    clips.forEach(function (clip) {
      var row = document.createElement('div');
      row.className = 'clip-row' + (clip.isPlaying ? ' playing' : '');

      var name = document.createElement('span');
      name.className = 'clip-name';
      name.textContent = clip.name; // textContent: mai innerHTML, il nome viene da un file audio non fidato

      var actionBtn = document.createElement('button');
      actionBtn.className = 'clip-btn ' + (clip.isPlaying ? 'stop' : 'play');
      actionBtn.textContent = clip.isPlaying ? '■ Stop' : '▶ Play';
      actionBtn.addEventListener('click', function () {
        sendCommand(clip.isPlaying ? 'stopClip' : 'playClip', clip.id);
      });

      row.appendChild(name);
      row.appendChild(actionBtn);
      clipList.appendChild(row);
    });
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
      } else if (msg.type === 'state') {
        renderClipList(msg.clips);
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
    stopAllBtn.disabled = true;
    sendCommand('stopAll');
    setTimeout(function () { stopAllBtn.disabled = false; }, 500);
  });
})();
</script>
</body>
</html>
`;
