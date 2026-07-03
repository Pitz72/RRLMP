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

// i18n (2026-07-03): la pagina è servita a un dispositivo TERZO (tablet/PC in
// LAN), quindi la lingua giusta è quella del BROWSER del dispositivo, non quella
// della regia. Dizionario embedded (8 lingue, stesse dell'app) + rilevamento
// client-side via navigator.language, fallback inglese. Nessuna dipendenza.

export const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<meta name="theme-color" content="#0f172a" />
<title>RRLMP — Remote Control</title>
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
  <button id="fullscreenBtn" type="button">⛶</button>

  <div class="card" id="pinScreen">
    <h1>RUNTIME LIVE MACHINE PRO</h1>
    <p class="sub" id="subLabel"></p>
    <input id="pin" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="------" />
    <button id="connect"></button>
    <div id="status"></div>
    <div id="controls">
      <button id="stopAll">■ STOP ALL</button>
      <div id="clipList"></div>
      <p id="emptyState"></p>
    </div>
  </div>
<script>
(function () {
  // i18n client-side: lingua del BROWSER del dispositivo remoto (8 lingue, fallback en)
  var RC_I18N = {
    en: { sub: 'Remote Control — enter the PIN shown in the studio', connect: 'Connect', empty: 'No tracks in the Music column.', fsEnter: '⛶ Fullscreen', fsExit: '⛶ Exit fullscreen', connected: 'Connected.', rateLimited: 'Too many attempts, try again later.', wrongPin: 'Wrong PIN.', disconnected: 'Disconnected.', pin6: 'The PIN must have 6 digits.', verifying: 'Verifying…', connError: 'Server connection error.', play: '▶ Play', stop: '■ Stop', title: 'RRLMP — Remote Control' },
    it: { sub: 'Regia Remota — inserisci il PIN mostrato in regia', connect: 'Connetti', empty: 'Nessun brano nella colonna Music.', fsEnter: '⛶ Schermo intero', fsExit: '⛶ Esci da schermo intero', connected: 'Connesso.', rateLimited: 'Troppi tentativi, riprova più tardi.', wrongPin: 'PIN errato.', disconnected: 'Disconnesso.', pin6: 'Il PIN deve avere 6 cifre.', verifying: 'Verifica in corso…', connError: 'Errore di connessione al server.', play: '▶ Play', stop: '■ Stop', title: 'RRLMP — Regia Remota' },
    fr: { sub: 'Régie à distance — saisissez le PIN affiché en régie', connect: 'Connecter', empty: 'Aucun titre dans la colonne Music.', fsEnter: '⛶ Plein écran', fsExit: '⛶ Quitter le plein écran', connected: 'Connecté.', rateLimited: 'Trop de tentatives, réessayez plus tard.', wrongPin: 'PIN incorrect.', disconnected: 'Déconnecté.', pin6: 'Le PIN doit comporter 6 chiffres.', verifying: 'Vérification…', connError: 'Erreur de connexion au serveur.', play: '▶ Lecture', stop: '■ Stop', title: 'RRLMP — Régie à distance' },
    de: { sub: 'Fernsteuerung — geben Sie die im Studio angezeigte PIN ein', connect: 'Verbinden', empty: 'Keine Titel in der Music-Spalte.', fsEnter: '⛶ Vollbild', fsExit: '⛶ Vollbild verlassen', connected: 'Verbunden.', rateLimited: 'Zu viele Versuche, versuchen Sie es später erneut.', wrongPin: 'Falsche PIN.', disconnected: 'Getrennt.', pin6: 'Die PIN muss 6 Ziffern haben.', verifying: 'Überprüfung…', connError: 'Verbindungsfehler zum Server.', play: '▶ Play', stop: '■ Stop', title: 'RRLMP — Fernsteuerung' },
    es: { sub: 'Control remoto — introduce el PIN mostrado en el estudio', connect: 'Conectar', empty: 'No hay pistas en la columna Music.', fsEnter: '⛶ Pantalla completa', fsExit: '⛶ Salir de pantalla completa', connected: 'Conectado.', rateLimited: 'Demasiados intentos, inténtalo más tarde.', wrongPin: 'PIN incorrecto.', disconnected: 'Desconectado.', pin6: 'El PIN debe tener 6 dígitos.', verifying: 'Verificando…', connError: 'Error de conexión con el servidor.', play: '▶ Play', stop: '■ Stop', title: 'RRLMP — Control remoto' },
    pt: { sub: 'Controle remoto — digite o PIN mostrado no estúdio', connect: 'Conectar', empty: 'Nenhuma faixa na coluna Music.', fsEnter: '⛶ Tela cheia', fsExit: '⛶ Sair da tela cheia', connected: 'Conectado.', rateLimited: 'Muitas tentativas, tente novamente mais tarde.', wrongPin: 'PIN incorreto.', disconnected: 'Desconectado.', pin6: 'O PIN deve ter 6 dígitos.', verifying: 'Verificando…', connError: 'Erro de conexão com o servidor.', play: '▶ Play', stop: '■ Stop', title: 'RRLMP — Controle remoto' },
    ru: { sub: 'Удалённое управление — введите PIN, показанный в студии', connect: 'Подключить', empty: 'Нет треков в колонке Music.', fsEnter: '⛶ Полный экран', fsExit: '⛶ Выйти из полного экрана', connected: 'Подключено.', rateLimited: 'Слишком много попыток, попробуйте позже.', wrongPin: 'Неверный PIN.', disconnected: 'Отключено.', pin6: 'PIN должен состоять из 6 цифр.', verifying: 'Проверка…', connError: 'Ошибка соединения с сервером.', play: '▶ Play', stop: '■ Stop', title: 'RRLMP — Удалённое управление' },
    zh: { sub: '远程控制 — 请输入直播间显示的 PIN 码', connect: '连接', empty: 'Music 列中没有曲目。', fsEnter: '⛶ 全屏', fsExit: '⛶ 退出全屏', connected: '已连接。', rateLimited: '尝试次数过多，请稍后再试。', wrongPin: 'PIN 码错误。', disconnected: '已断开连接。', pin6: 'PIN 码必须为 6 位数字。', verifying: '正在验证…', connError: '服务器连接错误。', play: '▶ 播放', stop: '■ 停止', title: 'RRLMP — 远程控制' }
  };
  var lang = (navigator.language || 'en').toLowerCase().split('-')[0];
  var T = RC_I18N[lang] || RC_I18N.en;
  document.documentElement.lang = lang in RC_I18N ? lang : 'en';
  document.title = T.title;
  document.getElementById('subLabel').textContent = T.sub;
  document.getElementById('connect').textContent = T.connect;
  document.getElementById('emptyState').textContent = T.empty;
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
      fullscreenBtn.textContent = isFullscreen() ? T.fsExit : T.fsEnter;
    }
    updateFullscreenLabel();
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
      actionBtn.textContent = clip.isPlaying ? T.stop : T.play;
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
          setStatus(T.connected, 'ok');
          controls.style.display = 'block';
        } else {
          setStatus(msg.error === 'rate-limited' ? T.rateLimited : T.wrongPin, 'err');
        }
      } else if (msg.type === 'state') {
        renderClipList(msg.clips);
      }
    };
    ws.onclose = function () {
      if (socket === ws) {
        socket = null;
        controls.style.display = 'none';
        setStatus(T.disconnected, 'err');
      }
    };
    ws.onerror = function () { /* gestito da onclose */ };
  }

  function tryConnect() {
    var pin = pinInput.value.trim();
    if (!/^\\d{6}$/.test(pin)) {
      setStatus(T.pin6, 'err');
      return;
    }
    btn.disabled = true;
    setStatus(T.verifying);
    fetch('/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin })
    })
      .then(function (res) {
        if (res.status === 429) { setStatus(T.rateLimited, 'err'); return null; }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        if (data.ok) {
          openCommandChannel(pin);
        } else {
          setStatus(T.wrongPin, 'err');
        }
      })
      .catch(function () { setStatus(T.connError, 'err'); })
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
