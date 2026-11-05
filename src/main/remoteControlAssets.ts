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
// i18n (2026-07-03): la pagina è servita a un dispositivo TERZO (tablet/PC in
// LAN), quindi la lingua giusta è quella del BROWSER del dispositivo, non quella
// della regia. Dizionario embedded (italiano e inglese, come l'app) + rilevamento
// client-side via navigator.language, fallback inglese. Nessuna dipendenza.
//
// v1.15.37 — PAD FX DAL TELEFONO. La pagina diventa una superficie di controllo:
//  - scheda FX (predefinita): la cartwall della regia, con i colori dei pad,
//    disposta per riempire lo schermo senza scorrere (pagine se i pad sono tanti);
//  - il pad parte alla PRESSIONE del dito (pointerdown), non al rilascio: è il
//    comportamento di un pad hardware e toglie 80-150 ms rispetto al click;
//  - ogni tocco riceve una conferma (ack) dalla regia; se non arriva entro 1,5 s
//    il pad si colora di rosso e il telefono vibra: l'operatore lo sa subito;
//  - collegamento sorvegliato: ping ogni 3 s (ritardo mostrato in alto), e se la
//    regia tace la pagina si ricollega da sola; idem al risveglio del telefono;
//  - il PIN resta memorizzato sul dispositivo, e il QR code delle Impostazioni lo
//    passa nel frammento (#pin=…, mai inviato in rete): inquadrare e basta;
//  - i tocchi fatti senza collegamento NON vengono messi in coda: un applauso
//    che parte dieci secondi dopo è peggio di un applauso che non parte.
//  - lettori di schermo (TalkBack/VoiceOver): il doppio tocco genera un click
//    senza pointerdown, gestito a parte; stato dei pad in aria-pressed/aria-label.
//
// NB: questo è un template literal TypeScript — nel codice della pagina niente
// backtick, niente dollaro-graffa, e ogni barra rovesciata va raddoppiata.

export const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<meta name="theme-color" content="#0b0f17" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black" />
<title>RRLMP — Remote Control</title>
<link rel="icon" href="/icon.png" />
<link rel="apple-touch-icon" href="/icon.png" />
<style>
  /* Palette verificata WCAG (testo su fondo): vedi test remoteControlAssets. */
  :root {
    --bg: #0b0f17;
    --panel: #1b2230;
    --panel-2: #252e3f;
    --line: #3b4659;
    --tx: #f8fafc;
    --tx-2: #cbd5e1;
    --ok: #4ade80;
    --warn: #fbbf24;
    --err: #f87171;
    --accent: #38bdf8;
    --ink-dark: #0b0f17;
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { height: 100%; margin: 0; }
  body {
    background: var(--bg);
    color: var(--tx);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 17px;
    overscroll-behavior: none;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
  button { font: inherit; color: inherit; cursor: pointer; }
  [hidden] { display: none !important; }
  .screen { height: 100%; }

  /* ---------- schermata PIN ---------- */
  #pinScreen { display: flex; align-items: center; justify-content: center; padding: 20px; }
  .card {
    width: 100%; max-width: 440px; background: var(--panel); border: 1px solid var(--line);
    border-radius: 18px; padding: 28px 24px; text-align: center;
  }
  .logo { width: 64px; height: 64px; border-radius: 14px; }
  h1 { font-size: 20px; margin: 12px 0 6px; letter-spacing: .04em; }
  .help { color: var(--tx-2); font-size: 16px; margin: 0 0 20px; line-height: 1.4; }
  #pin {
    width: 100%; font-size: 34px; letter-spacing: .35em; text-align: center; padding: 14px 10px;
    border-radius: 12px; border: 2px solid var(--line); background: var(--bg); color: var(--tx);
    margin-bottom: 16px; -webkit-user-select: text; user-select: text;
  }
  #pin:focus { outline: none; border-color: var(--accent); }
  #pin::placeholder { color: #8b96a8; }
  .primary {
    width: 100%; padding: 16px; font-size: 19px; font-weight: 700; border: none; border-radius: 12px;
    background: var(--accent); color: var(--ink-dark);
  }
  .primary:disabled { background: #475569; color: #ffffff; }
  .msg { margin: 16px 0 0; min-height: 24px; font-size: 16px; font-weight: 600; }
  .msg.ok { color: var(--ok); }
  .msg.err { color: var(--err); }
  .msg.warn { color: var(--warn); }

  /* ---------- superficie di controllo ---------- */
  #ctrlScreen {
    display: flex; flex-direction: column;
    padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
    gap: 8px;
  }
  .bar { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .conn { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; font-size: 17px; font-weight: 800; }
  .conn .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--err); flex-shrink: 0; }
  .conn.ok .dot { background: var(--ok); box-shadow: 0 0 10px var(--ok); }
  .conn.wait .dot { background: var(--warn); }
  .conn.ok #connText { color: var(--ok); }
  .conn.wait #connText { color: var(--warn); }
  .conn.err #connText { color: var(--err); }
  /* lo stato si legge sempre per intero: va a capo invece di troncarsi */
  #connText { line-height: 1.2; }
  #latency { color: var(--tx-2); font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .tbtn {
    height: 44px; min-width: 44px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--line);
    background: var(--panel); font-size: 15px; font-weight: 700; color: var(--tx);
  }
  .tabs { display: flex; gap: 8px; flex-shrink: 0; }
  .tabs .tbtn { flex: 1; font-size: 17px; letter-spacing: .06em; }
  .tabs .tbtn[aria-selected="true"] { background: var(--tx); color: var(--ink-dark); border-color: var(--tx); }

  .view { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
  #padArea { flex: 1; min-height: 0; position: relative; }
  #padGrid { display: grid; gap: 8px; height: 100%; width: 100%; }
  .pad {
    position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; padding: 10px 8px 8px; border-radius: 14px; border: 2px solid var(--line);
    border-top: 10px solid var(--pad-color, #64748b);
    background: var(--panel); color: var(--tx); font-weight: 800; text-align: center; line-height: 1.15;
    touch-action: none; overflow: hidden; transition: transform .06s ease-out;
  }
  .pad .name {
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    overflow-wrap: anywhere; font-size: var(--pad-fs, 18px);
  }
  .pad .state { font-size: 12px; font-weight: 800; letter-spacing: .08em; min-height: 14px; }
  .pad.live {
    background: var(--pad-color, #22c55e); color: var(--pad-ink, #000000);
    border-color: #ffffff; box-shadow: 0 0 0 3px #ffffff, 0 0 22px var(--pad-color, #22c55e);
  }
  .pad.pressing { transform: scale(.95); }
  .pad.pending { border-style: dashed; border-color: var(--tx); }
  .pad.failed { border-color: var(--err); box-shadow: 0 0 0 4px var(--err); }
  .pad.failed .state { color: var(--err); }
  .pad.live.failed .state { color: var(--pad-ink, #000000); }
  .pad.missing { border-style: dashed; border-color: var(--err); border-top-color: var(--err); color: var(--tx-2); }
  .pad.missing .state { color: #fca5a5; }
  .offline .pad { filter: grayscale(1); }
  .pager { display: flex; align-items: center; justify-content: center; gap: 12px; flex-shrink: 0; }
  .pager .tbtn { min-width: 72px; font-size: 20px; }
  #pageLabel { font-weight: 700; color: var(--tx-2); font-variant-numeric: tabular-nums; }
  .empty { color: var(--tx-2); text-align: center; margin: 24px 12px; font-size: 17px; line-height: 1.4; }

  #musicList { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
  .row {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px;
    background: var(--panel); border: 2px solid var(--line); border-left: 8px solid var(--line);
  }
  .row.live { border-color: var(--ok); }
  .row .name { flex: 1; min-width: 0; font-size: 17px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row .live-tag { color: var(--ok); font-size: 12px; font-weight: 800; letter-spacing: .08em; display: block; }
  .row .act {
    flex-shrink: 0; min-width: 104px; height: 48px; border-radius: 10px; border: none; font-weight: 800; font-size: 16px;
    background: var(--accent); color: var(--ink-dark); touch-action: manipulation;
  }
  .row.live .act { background: var(--warn); color: var(--ink-dark); }
  .row.failed { border-color: var(--err); }
  .row.fading { border-color: var(--warn); }
  .row .out-tag { color: var(--warn); font-size: 12px; font-weight: 800; letter-spacing: .08em; display: block; }
  .row.fading .act { background: var(--panel-2); color: var(--tx); border: 2px solid var(--warn); }

  /* v1.15.37: modalità MIX dal telefono */
  .mixbar { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .mixtoggle {
    flex-shrink: 0; min-width: 132px; height: 52px; padding: 0 14px; border-radius: 12px; border: 2px solid var(--line);
    background: var(--panel); color: var(--tx); font-size: 17px; font-weight: 900; letter-spacing: .06em; touch-action: manipulation;
  }
  .mixtoggle[aria-pressed="true"] { background: var(--ok); color: var(--ink-dark); border-color: var(--ok); }
  .mixhint { margin: 0; color: var(--tx-2); font-size: 15px; line-height: 1.3; }
  .nextbtn {
    flex-shrink: 0; width: 100%; min-height: 96px; padding: 10px 14px; border: none; border-radius: 16px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
    background: #c4b5fd; color: var(--ink-dark); touch-action: manipulation; transition: transform .06s ease-out;
  }
  .nextbtn:active, .nextbtn.pressing { transform: scale(.98); }
  .nextbtn:disabled { background: var(--panel-2); color: var(--tx-2); }
  .nextbtn.failed { box-shadow: 0 0 0 4px var(--err); }
  .nb-top { font-size: 22px; font-weight: 900; letter-spacing: .06em; }
  .nb-name { font-size: 18px; font-weight: 800; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .nb-mode { font-size: 14px; font-weight: 700; }
  .mixlast { margin: 0; min-height: 20px; font-size: 15px; font-weight: 700; text-align: center; flex-shrink: 0; }
  .mixlast.ok { color: var(--ok); }
  .mixlast.warn { color: var(--warn); }

  .stopbar { display: flex; gap: 8px; flex-shrink: 0; }
  .stop {
    flex: 1; height: 64px; border: none; border-radius: 14px; font-size: 20px; font-weight: 900; letter-spacing: .05em;
    touch-action: manipulation; transition: transform .06s ease-out;
  }
  .stop:active, .stop.pressing { transform: scale(.97); }
  .stop.fx { background: var(--warn); color: var(--ink-dark); }
  .stop.all { background: #dc2626; color: #ffffff; }
  .stop.failed { box-shadow: 0 0 0 4px var(--err); }
  .tbtn:focus-visible, .pad:focus-visible, .stop:focus-visible, .act:focus-visible, .primary:focus-visible {
    outline: 3px solid var(--accent); outline-offset: 2px;
  }
  @media (max-height: 520px) and (orientation: landscape) {
    .stop { height: 52px; font-size: 18px; }
    .tbtn { height: 40px; }
  }
</style>
</head>
<body>
  <section id="pinScreen" class="screen">
    <div class="card">
      <img class="logo" src="/icon.png" alt="" />
      <h1>RUNTIME LIVE MACHINE PRO</h1>
      <p class="help" id="pinHelp"></p>
      <input id="pin" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="------" />
      <button id="connect" class="primary" type="button"></button>
      <p id="pinMsg" class="msg" role="status" aria-live="polite"></p>
    </div>
  </section>

  <section id="ctrlScreen" class="screen" hidden>
    <header class="bar">
      <div id="conn" class="conn wait">
        <span class="dot" aria-hidden="true"></span>
        <span id="connText" role="status" aria-live="polite"></span>
        <span id="latency" aria-hidden="true"></span>
      </div>
      <button id="fsBtn" class="tbtn" type="button" hidden>⛶</button>
      <button id="logoutBtn" class="tbtn" type="button">PIN</button>
    </header>
    <div class="tabs" role="tablist">
      <button id="tabFx" class="tbtn" role="tab" type="button" aria-selected="true">FX</button>
      <button id="tabMusic" class="tbtn" role="tab" type="button" aria-selected="false"></button>
    </div>

    <main id="fxView" class="view">
      <div id="padArea"><div id="padGrid"></div></div>
      <p id="fxEmpty" class="empty" hidden></p>
      <div id="pager" class="pager" hidden>
        <button id="prevPage" class="tbtn" type="button">◀</button>
        <span id="pageLabel"></span>
        <button id="nextPage" class="tbtn" type="button">▶</button>
      </div>
    </main>

    <main id="musicView" class="view" hidden>
      <div class="mixbar">
        <button id="mixToggle" class="mixtoggle" type="button" aria-pressed="false"></button>
        <p id="mixHint" class="mixhint"></p>
      </div>
      <button id="mixNext" class="nextbtn" type="button">
        <span id="mixNextTop" class="nb-top"></span>
        <span id="mixNextName" class="nb-name"></span>
        <span id="mixNextMode" class="nb-mode"></span>
      </button>
      <p id="mixLast" class="mixlast" role="status" aria-live="polite"></p>
      <div id="musicList"></div>
      <p id="musicEmpty" class="empty" hidden></p>
    </main>

    <footer class="stopbar">
      <button id="stopFx" class="stop fx" type="button"></button>
      <button id="stopAll" class="stop all" type="button"></button>
    </footer>
  </section>
<script>
(function () {
  'use strict';

  // ---------- i18n: lingua del BROWSER del dispositivo remoto (it/en, fallback en) ----------
  var RC_I18N = {
    en: {
      title: 'RRLMP — Remote Control', pinHelp: 'Enter the PIN shown in the studio (Settings → Remote Control).',
      connect: 'Connect', pin6: 'The PIN must have 6 digits.', connecting: 'Connecting…',
      wrongPin: 'Wrong PIN.', pinChanged: 'The PIN was changed in the studio: enter the new one.',
      rateLimited: 'Too many attempts. Wait a few minutes and try again.',
      connected: 'Connected', reconnecting: 'Reconnecting…', offline: 'Not connected — retrying…',
      stopped: 'Remote control turned off in the studio — waiting…',
      music: 'MUSIC', stopFx: '■ STOP FX', stopAll: '■ STOP ALL',
      live: 'ON AIR', missing: 'FILE MISSING', notReceived: 'NOT RECEIVED',
      cmdLost: 'The studio did not confirm the command.', noConn: 'Not connected: the command was not sent.',
      fxEmpty: 'No effects on the FX pad. Add them in the studio: drag audio files onto the FX pad.',
      musicEmpty: 'No tracks in the Music column.', play: '▶ PLAY', stop: '■ STOP',
      page: 'Page', prev: 'Previous page', next: 'Next page',
      fsEnter: 'Fullscreen', fsExit: 'Exit fullscreen', logout: 'Change PIN', delay: 'ms', onAirLabel: 'on air',
      mixOnLbl: 'MIX ON', mixOffLbl: 'MIX OFF', mixHintOn: 'Changing track = beat-matched mix', mixHintOff: 'Changing track = hard cut',
      next: '▶▶ NEXT', start: '▶ START', endOfList: 'END OF PLAYLIST', modeTempo: 'beat-matched mix', modeClassic: 'classic crossfade',
      modeStart: 'starts the first track', lastBeat: 'Last change: beat-matched mix', lastClassic: 'Last change: classic crossfade (beat not lockable)',
      lastSkipped: 'Last change not carried out', fadingTag: 'GOING OUT', mixRow: 'MIX ▶', musicTabMix: 'MUSIC · MIX'
    },
    it: {
      title: 'RRLMP — Regia Remota', pinHelp: 'Inserisci il PIN mostrato in regia (Impostazioni → Controllo Remoto).',
      connect: 'Collegati', pin6: 'Il PIN deve avere 6 cifre.', connecting: 'Collegamento in corso…',
      wrongPin: 'PIN errato.', pinChanged: 'Il PIN è stato cambiato in regia: inserisci quello nuovo.',
      rateLimited: 'Troppi tentativi. Aspetta qualche minuto e riprova.',
      connected: 'Collegato', reconnecting: 'Ricollegamento…', offline: 'Non collegato — riprovo…',
      stopped: 'Controllo remoto spento in regia — in attesa…',
      music: 'MUSICA', stopFx: '■ STOP FX', stopAll: '■ STOP ALL',
      live: 'IN ONDA', missing: 'FILE MANCANTE', notReceived: 'NON ARRIVATO',
      cmdLost: 'La regia non ha confermato il comando.', noConn: 'Non collegato: il comando non è partito.',
      fxEmpty: 'Nessun effetto nel pad FX. Aggiungili in regia trascinando i file audio sul pad FX.',
      musicEmpty: 'Nessun brano nella colonna Music.', play: '▶ PLAY', stop: '■ STOP',
      page: 'Pagina', prev: 'Pagina precedente', next: 'Pagina successiva',
      fsEnter: 'Schermo intero', fsExit: 'Esci da schermo intero', logout: 'Cambia PIN', delay: 'ms', onAirLabel: 'in onda',
      mixOnLbl: 'MIX ACCESO', mixOffLbl: 'MIX SPENTO', mixHintOn: 'Cambiare brano = mix a tempo', mixHintOff: 'Cambiare brano = taglio netto',
      next: '▶▶ PROSSIMO', start: '▶ START', endOfList: 'FINE SCALETTA', modeTempo: 'mix a tempo', modeClassic: 'crossfade classico',
      modeStart: 'parte il primo brano', lastBeat: 'Ultimo passaggio: mix a tempo', lastClassic: 'Ultimo passaggio: crossfade classico (ritmo non agganciabile)',
      lastSkipped: 'Ultimo passaggio non eseguito', fadingTag: 'IN USCITA', mixRow: 'MIX ▶', musicTabMix: 'MUSICA · MIX'
    }
  };
  var lang = (navigator.language || 'en').toLowerCase().split('-')[0];
  var T = RC_I18N[lang] || RC_I18N.en;
  document.documentElement.lang = RC_I18N[lang] ? lang : 'en';
  document.title = T.title;

  function $(id) { return document.getElementById(id); }
  var pinScreen = $('pinScreen'), ctrlScreen = $('ctrlScreen');
  var pinInput = $('pin'), connectBtn = $('connect'), pinMsg = $('pinMsg');
  var conn = $('conn'), connText = $('connText'), latencyEl = $('latency');
  var tabFx = $('tabFx'), tabMusic = $('tabMusic'), fxView = $('fxView'), musicView = $('musicView');
  var padArea = $('padArea'), padGrid = $('padGrid'), fxEmpty = $('fxEmpty');
  var pager = $('pager'), prevPage = $('prevPage'), nextPage = $('nextPage'), pageLabel = $('pageLabel');
  var musicList = $('musicList'), musicEmpty = $('musicEmpty');
  var mixToggle = $('mixToggle'), mixHint = $('mixHint'), mixNextBtn = $('mixNext');
  var mixNextTop = $('mixNextTop'), mixNextName = $('mixNextName'), mixNextMode = $('mixNextMode'), mixLast = $('mixLast');
  var stopFxBtn = $('stopFx'), stopAllBtn = $('stopAll'), fsBtn = $('fsBtn'), logoutBtn = $('logoutBtn');

  $('pinHelp').textContent = T.pinHelp;
  connectBtn.textContent = T.connect;
  tabMusic.textContent = T.music;
  stopFxBtn.textContent = T.stopFx;
  stopAllBtn.textContent = T.stopAll;
  fxEmpty.textContent = T.fxEmpty;
  musicEmpty.textContent = T.musicEmpty;
  prevPage.setAttribute('aria-label', T.prev);
  nextPage.setAttribute('aria-label', T.next);
  logoutBtn.setAttribute('aria-label', T.logout);
  logoutBtn.title = T.logout;

  // ---------- memoria locale (può mancare: navigazione privata, dati bloccati) ----------
  var memory = {};
  function store(key, value) {
    memory[key] = value;
    try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (e) { /* solo in memoria */ }
  }
  function recall(key) {
    try { var v = localStorage.getItem(key); if (v !== null) return v; } catch (e) { /* solo in memoria */ }
    return memory.hasOwnProperty(key) ? memory[key] : null;
  }
  var PIN_KEY = 'rrlmp-remote-pin', TAB_KEY = 'rrlmp-remote-tab';
  function isPin(v) { return typeof v === 'string' && /^[0-9]{6}$/.test(v); }

  // PIN dal QR code: http://indirizzo:8787/#pin=123456 — il frammento non viaggia
  // in rete; lo si memorizza e lo si toglie subito dalla barra degli indirizzi.
  function takePinFromHash() {
    var m = (location.hash || '').match(/pin=([0-9]{6})/);
    if (!m) return false;
    store(PIN_KEY, m[1]);
    try { history.replaceState(null, '', location.pathname); } catch (e) { location.hash = ''; }
    return true;
  }
  takePinFromHash();

  // ---------- stato ----------
  var socket = null;          // socket autenticato in uso
  var connecting = null;      // socket in fase di apertura/autenticazione
  var everConnected = false;
  var retryTimer = null, retryCount = 0;
  var pingTimer = null, lastMessageAt = 0;
  var serverStopped = false;
  var seq = 0, pendingAcks = {};
  var fxState = [], musicState = [], mixState = { on: false };
  var stateReceived = false;  // finché la regia non ha mandato lo stato, niente "nessun effetto"
  var padEls = {};            // id -> elemento del pad
  var page = 0, layout = { cols: 1, rows: 1, per: 1, pages: 1 };
  var activeTab = recall(TAB_KEY) === 'music' ? 'music' : 'fx';
  var ACK_TIMEOUT_MS = 1500, PING_EVERY_MS = 3000, DEAD_AFTER_MS = 7000;

  function setPinMsg(text, cls) { pinMsg.textContent = text || ''; pinMsg.className = 'msg' + (cls ? ' ' + cls : ''); }
  function setConn(kind, text) { conn.className = 'conn ' + kind; connText.textContent = text; if (kind !== 'ok') latencyEl.textContent = ''; }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* non supportato */ } }

  function showPinScreen(message, cls) {
    ctrlScreen.hidden = true;
    pinScreen.hidden = false;
    setPinMsg(message, cls);
    pinInput.value = '';
    connectBtn.disabled = false;
  }
  function showControls() {
    pinScreen.hidden = true;
    ctrlScreen.hidden = false;
    applyTab();
    relayout();
  }

  // ---------- collegamento ----------
  function clearRetry() { if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; } }
  function scheduleRetry() {
    clearRetry();
    if (!isPin(recall(PIN_KEY))) return;
    var delays = [300, 1000, 2000, 3000];
    var delay = delays[Math.min(retryCount, delays.length - 1)];
    retryCount++;
    retryTimer = setTimeout(connect, delay);
  }

  function failAllPending() {
    for (var k in pendingAcks) {
      if (pendingAcks.hasOwnProperty(k)) {
        clearTimeout(pendingAcks[k].timer);
        var p = pendingAcks[k];
        delete pendingAcks[k];
        if (p.onFail) p.onFail('disconnected');
      }
    }
  }

  function dropSocket(ws) {
    if (!ws) return;
    ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
    try { ws.close(); } catch (e) { /* già chiuso */ }
  }

  function lostConnection() {
    var wasConnected = !!socket;
    dropSocket(socket);
    socket = null;
    stopPing();
    failAllPending();
    ctrlScreen.classList.add('offline');
    if (serverStopped) setConn('err', T.stopped);
    else setConn(wasConnected ? 'wait' : 'err', wasConnected ? T.reconnecting : T.offline);
    scheduleRetry();
  }

  function connect() {
    clearRetry();
    var pin = recall(PIN_KEY);
    if (!isPin(pin)) { showPinScreen(''); return; }
    if (socket || connecting) return;
    var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    var ws;
    try { ws = new WebSocket(proto + '//' + location.host + '/ws'); } catch (e) { scheduleRetry(); return; }
    connecting = ws;
    var openTimer = setTimeout(function () {
      // apertura bloccata (rete assente, regia irraggiungibile): si riprova
      if (connecting === ws) { connecting = null; dropSocket(ws); lostConnection(); }
    }, 5000);

    ws.onopen = function () { ws.send(JSON.stringify({ type: 'auth', pin: pin })); };
    ws.onmessage = function (event) {
      var msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }
      lastMessageAt = Date.now();
      if (msg.type === 'auth-result') {
        clearTimeout(openTimer);
        connecting = null;
        if (msg.ok) {
          socket = ws;
          everConnected = true;
          serverStopped = false;
          retryCount = 0;
          ctrlScreen.classList.remove('offline');
          setConn('ok', T.connected);
          showControls();
          startPing();
          requestWakeLock();
        } else {
          dropSocket(ws);
          if (msg.error === 'rate-limited') { showPinScreen(T.rateLimited, 'err'); return; }
          store(PIN_KEY, null);
          showPinScreen(everConnected ? T.pinChanged : T.wrongPin, 'err');
        }
        return;
      }
      if (ws !== socket) return;
      handleMessage(msg);
    };
    ws.onclose = function () {
      clearTimeout(openTimer);
      if (connecting === ws) connecting = null;
      if (ws === socket || !socket) lostConnection();
    };
    ws.onerror = function () { /* gestito da onclose */ };
  }

  function handleMessage(msg) {
    if (msg.type === 'state') {
      stateReceived = true;
      fxState = Array.isArray(msg.fx) ? msg.fx : [];
      musicState = Array.isArray(msg.music) ? msg.music : [];
      mixState = msg.mix && typeof msg.mix === 'object' ? msg.mix : { on: false };
      renderPads();
      renderMusic();
      renderMix();
    } else if (msg.type === 'ack') {
      var p = pendingAcks[msg.seq];
      if (!p) return;
      clearTimeout(p.timer);
      delete pendingAcks[msg.seq];
      if (msg.ok) { if (p.onOk) p.onOk(); }
      else if (p.onFail) p.onFail(msg.error || 'rejected');
    } else if (msg.type === 'pong') {
      var rtt = Math.round(now() - (msg.t || 0));
      if (rtt >= 0 && rtt < 10000) latencyEl.textContent = rtt + ' ' + T.delay;
    } else if (msg.type === 'bye') {
      if (msg.reason === 'pin-changed') {
        dropSocket(socket); socket = null; stopPing(); failAllPending(); clearRetry();
        store(PIN_KEY, null);
        showPinScreen(T.pinChanged, 'warn');
      } else if (msg.reason === 'stopped') {
        serverStopped = true;
      }
    }
  }

  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function startPing() {
    stopPing();
    lastMessageAt = Date.now();
    pingTimer = setInterval(function () {
      if (!socket) return;
      if (Date.now() - lastMessageAt > DEAD_AFTER_MS) { lostConnection(); return; } // la regia tace: collegamento morto
      try { socket.send(JSON.stringify({ type: 'ping', t: now() })); } catch (e) { lostConnection(); }
    }, PING_EVERY_MS);
    try { socket.send(JSON.stringify({ type: 'ping', t: now() })); } catch (e) { /* gestito dal giro successivo */ }
  }
  function stopPing() { if (pingTimer) { clearInterval(pingTimer); pingTimer = null; } }

  // Risveglio del telefono / ritorno in primo piano / rete tornata: subito, senza
  // attese. Se il socket c'è ma la regia tace da un po' (il telefono dormiva), lo
  // si sonda con un ping: risposta entro 1,5 s = vivo, altrimenti ci si ricollega.
  var probeTimer = null;
  function wake() {
    if (pinScreen.hidden === false) return;
    if (socket) {
      try { socket.send(JSON.stringify({ type: 'ping', t: now() })); } catch (e) { lostConnection(); return; }
      if (Date.now() - lastMessageAt > DEAD_AFTER_MS && !probeTimer) {
        var probeStart = Date.now();
        probeTimer = setTimeout(function () {
          probeTimer = null;
          if (socket && lastMessageAt < probeStart) lostConnection();
        }, 1500);
      }
      return;
    }
    retryCount = 0;
    connect();
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { wake(); requestWakeLock(); } });
  window.addEventListener('pageshow', wake);
  window.addEventListener('online', wake);
  window.addEventListener('focus', wake);

  // Schermo sempre acceso dove il browser lo consente (di solito solo in HTTPS:
  // in LAN in chiaro non c'è, e la pagina si ricollega da sola al risveglio).
  var wakeLock = null;
  function requestWakeLock() {
    try {
      if (!('wakeLock' in navigator) || wakeLock) return;
      navigator.wakeLock.request('screen').then(function (l) {
        wakeLock = l;
        l.addEventListener('release', function () { wakeLock = null; });
      }).catch(function () { /* non consentito */ });
    } catch (e) { /* non supportato */ }
  }

  // ---------- comandi ----------
  function sendCommand(name, clipId, onOk, onFail) {
    if (!socket || socket.readyState !== 1) {
      vibrate([40, 60, 40]);
      setConn(serverStopped ? 'err' : 'wait', T.noConn);
      if (onFail) onFail('disconnected');
      return false;
    }
    seq++;
    var mySeq = seq;
    var msg = { type: 'command', name: name, seq: mySeq };
    if (clipId) msg.clipId = clipId;
    try { socket.send(JSON.stringify(msg)); } catch (e) { lostConnection(); if (onFail) onFail('disconnected'); return false; }
    pendingAcks[mySeq] = {
      onOk: onOk, onFail: onFail,
      timer: setTimeout(function () {
        var p = pendingAcks[mySeq];
        if (!p) return;
        delete pendingAcks[mySeq];
        if (p.onFail) p.onFail('timeout');
      }, ACK_TIMEOUT_MS)
    };
    return true;
  }

  function flashFailed(el, stateEl, restoreText) {
    vibrate([40, 60, 40]);
    el.classList.add('failed');
    if (stateEl) stateEl.textContent = T.notReceived;
    setTimeout(function () {
      el.classList.remove('failed');
      if (stateEl) stateEl.textContent = restoreText();
    }, 1600);
  }

  // Gesto immediato: pointerdown (dito, penna, mouse sinistro). Il click arriva
  // da solo con tastiera e lettori di schermo: lo si usa SOLO se non è stato
  // preceduto da un pointerdown sullo stesso elemento (niente doppio comando).
  function onPress(el, handler) {
    var lastDown = 0;
    function press(ev) {
      if (ev.type === 'pointerdown' && ev.pointerType === 'mouse' && ev.button !== 0) return;
      if (ev.cancelable) ev.preventDefault();
      lastDown = Date.now();
      handler(ev);
    }
    if (window.PointerEvent) el.addEventListener('pointerdown', press);
    else {
      el.addEventListener('touchstart', press, { passive: false });
      el.addEventListener('mousedown', function (ev) { if (Date.now() - lastDown > 800) press(ev); });
    }
    el.addEventListener('click', function (ev) {
      if (Date.now() - lastDown < 800) { ev.preventDefault(); return; }
      handler(ev);
    });
  }

  function pressFeedback(el) {
    el.classList.add('pressing');
    setTimeout(function () { el.classList.remove('pressing'); }, 140);
  }

  // ---------- pad FX ----------
  function luminance(hex) {
    var n = parseInt(hex.slice(1), 16);
    var c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  // Testo sul pad acceso: bianco o nero, il più contrastato (WCAG). Nero PIENO e
  // non il blu-nero della pagina: con bianco/nero puri il migliore dei due è
  // sempre almeno 4.58:1 su qualunque colore (con #0b0f17 l'indaco #6366F1
  // restava a 4.47:1 col bianco e 4.30:1 col blu-nero).
  function inkFor(hex) {
    var L = luminance(hex);
    var onBlack = (L + 0.05) / 0.05;
    var onWhite = 1.05 / (L + 0.05);
    return onWhite > onBlack ? '#ffffff' : '#000000';
  }
  function isHex(c) { return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c); }

  function padStateText(clip) {
    if (clip.missing) return T.missing;
    return clip.isPlaying ? '▶ ' + T.live : '';
  }

  function findClip(id) {
    for (var i = 0; i < fxState.length; i++) if (fxState[i].id === id) return fxState[i];
    return null;
  }

  function firePad(el) {
    var id = el.getAttribute('data-id');
    var clip = findClip(id);
    if (!clip) return;
    pressFeedback(el);
    if (clip.missing) { vibrate([40, 60, 40]); return; }
    vibrate(12);
    el.classList.add('pending');
    var stateEl = el.querySelector('.state');
    sendCommand('fxTrigger', id, function () {
      el.classList.remove('pending');
    }, function () {
      el.classList.remove('pending');
      flashFailed(el, stateEl, function () { var c = findClip(id); return c ? padStateText(c) : ''; });
    });
  }

  function makePad(clip) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'pad';
    el.setAttribute('data-id', clip.id);
    var name = document.createElement('span');
    name.className = 'name';
    var state = document.createElement('span');
    state.className = 'state';
    el.appendChild(name);
    el.appendChild(state);
    onPress(el, function () { firePad(el); });
    return el;
  }

  function updatePad(el, clip) {
    el.querySelector('.name').textContent = clip.name; // textContent: il nome viene da un file audio, mai innerHTML
    if (!el.classList.contains('failed')) el.querySelector('.state').textContent = padStateText(clip);
    var color = isHex(clip.color) ? clip.color : null;
    if (color) {
      el.style.setProperty('--pad-color', color);
      el.style.setProperty('--pad-ink', inkFor(color));
    } else {
      el.style.removeProperty('--pad-color');
      el.style.removeProperty('--pad-ink');
    }
    el.classList.toggle('live', !!clip.isPlaying && !clip.missing);
    el.classList.toggle('missing', !!clip.missing);
    el.setAttribute('aria-pressed', clip.isPlaying ? 'true' : 'false');
    el.setAttribute('aria-disabled', clip.missing ? 'true' : 'false');
    el.setAttribute('aria-label', clip.name + (clip.missing ? ', ' + T.missing.toLowerCase() : clip.isPlaying ? ', ' + T.onAirLabel : ''));
  }

  // Disposizione che riempie l'area senza scorrere: si prova ogni numero di
  // colonne e si sceglie quello con meno pagine e pad più grandi.
  function computeLayout(n, W, H) {
    var GAP = 8, MIN = 76;
    if (n < 1) return { cols: 1, rows: 1, per: 1, pages: 1 };
    // area non ancora misurabile (nascosta, in transizione): tutti i pad in una
    // pagina, mai pad persi; la prossima misura sistema la griglia
    if (W < 1 || H < 1) return { cols: Math.min(n, 4), rows: Math.ceil(n / 4), per: n, pages: 1 };
    var best = null;
    for (var cols = 1; cols <= 8; cols++) {
      var cw = (W - GAP * (cols - 1)) / cols;
      if (cw < MIN && cols > 1) break;
      var maxRows = Math.max(1, Math.floor((H + GAP) / (MIN + GAP)));
      var rows = Math.min(Math.ceil(n / cols), maxRows);
      var ch = (H - GAP * (rows - 1)) / rows;
      var per = cols * rows;
      var pages = Math.ceil(n / per);
      var score = -pages * 100000 + Math.min(cw, ch);
      if (!best || score > best.score) best = { cols: cols, rows: rows, per: per, pages: pages, score: score, side: Math.min(cw, ch) };
    }
    return best;
  }

  function relayout() {
    if (ctrlScreen.hidden || activeTab !== 'fx') return;
    var n = fxState.length;
    pager.hidden = true;
    var W = padArea.clientWidth, H = padArea.clientHeight;
    layout = computeLayout(n, W, H);
    if (layout.pages > 1) {
      pager.hidden = false;
      H = padArea.clientHeight; // il pager ha tolto spazio: si ricalcola
      layout = computeLayout(n, W, H);
      if (layout.pages <= 1) pager.hidden = true;
    }
    if (page > layout.pages - 1) page = Math.max(0, layout.pages - 1);
    padGrid.style.gridTemplateColumns = 'repeat(' + layout.cols + ', minmax(0, 1fr))';
    padGrid.style.gridTemplateRows = 'repeat(' + layout.rows + ', minmax(0, 1fr))';
    var fs = Math.max(15, Math.min(28, Math.round((layout.side || 90) * 0.17)));
    padGrid.style.setProperty('--pad-fs', fs + 'px');
    placePads();
  }

  function placePads() {
    var start = page * layout.per;
    var visible = fxState.slice(start, start + layout.per);
    while (padGrid.firstChild) padGrid.removeChild(padGrid.firstChild);
    for (var i = 0; i < visible.length; i++) padGrid.appendChild(padEls[visible[i].id]);
    pageLabel.textContent = T.page + ' ' + (page + 1) + ' / ' + layout.pages;
    prevPage.disabled = page === 0;
    nextPage.disabled = page >= layout.pages - 1;
  }

  function renderPads() {
    var seen = {};
    var changed = false;
    for (var i = 0; i < fxState.length; i++) {
      var clip = fxState[i];
      seen[clip.id] = true;
      if (!padEls[clip.id]) { padEls[clip.id] = makePad(clip); changed = true; }
      updatePad(padEls[clip.id], clip);
    }
    for (var id in padEls) {
      if (padEls.hasOwnProperty(id) && !seen[id]) { delete padEls[id]; changed = true; }
    }
    // l'ordine dei pad può cambiare senza aggiunte o rimozioni (riordino in regia)
    var order = fxState.map(function (c) { return c.id; }).join('|');
    if (order !== renderPads.lastOrder) { changed = true; renderPads.lastOrder = order; }
    fxEmpty.hidden = !stateReceived || fxState.length > 0;
    padArea.hidden = stateReceived && fxState.length === 0;
    if (changed) relayout();
  }
  renderPads.lastOrder = '';

  prevPage.addEventListener('click', function () { if (page > 0) { page--; placePads(); } });
  nextPage.addEventListener('click', function () { if (page < layout.pages - 1) { page++; placePads(); } });

  var resizeTimer = null;
  function onResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(relayout, 60); }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

  // ---------- colonna Music ----------
  function renderMusic() {
    while (musicList.firstChild) musicList.removeChild(musicList.firstChild);
    musicEmpty.hidden = !stateReceived || musicState.length > 0;
    // v1.15.37: con il MIX acceso e un brano in onda, PLAY diventa «MIX ▶»
    // (la regia passa al brano con il mix invece di tagliare)
    var somethingOnAir = musicState.some(function (c) { return c.isPlaying; });
    var playLabel = mixState.on && somethingOnAir ? T.mixRow : T.play;
    musicState.forEach(function (clip) {
      var active = clip.isPlaying || clip.fading;
      var row = document.createElement('div');
      row.className = 'row' + (clip.isPlaying ? ' live' : '') + (clip.fading ? ' fading' : '');
      var label = document.createElement('div');
      label.className = 'name';
      label.textContent = clip.name; // textContent: mai innerHTML
      if (clip.isPlaying || clip.fading) {
        var tag = document.createElement('span');
        tag.className = clip.fading ? 'out-tag' : 'live-tag';
        tag.textContent = clip.fading ? T.fadingTag : '▶ ' + T.live;
        label.appendChild(tag);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'act';
      btn.textContent = active ? T.stop : playLabel;
      btn.setAttribute('aria-label', (active ? T.stop : playLabel).replace(/^[^A-Z]+/, '').replace(/[^A-Z]+$/, '') + ' ' + clip.name);
      btn.addEventListener('click', function () {
        vibrate(12);
        sendCommand(active ? 'stopClip' : 'playClip', clip.id, null, function () {
          vibrate([40, 60, 40]);
          row.classList.add('failed');
          setTimeout(function () { row.classList.remove('failed'); }, 1600);
        });
      });
      row.appendChild(label);
      row.appendChild(btn);
      musicList.appendChild(row);
    });
  }

  // ---------- modalità MIX (v1.15.37) ----------
  function renderMix() {
    var on = !!mixState.on;
    mixToggle.textContent = on ? T.mixOnLbl : T.mixOffLbl;
    mixToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    mixHint.textContent = on ? T.mixHintOn : T.mixHintOff;
    tabMusic.textContent = on ? T.musicTabMix : T.music;
    var hasNext = !!mixState.nextId;
    var starting = mixState.nextMode === 'start';
    mixNextBtn.disabled = !hasNext;
    mixNextTop.textContent = !hasNext ? T.endOfList : starting ? T.start : T.next;
    mixNextName.textContent = hasNext ? mixState.nextName : '';
    mixNextMode.textContent = !hasNext ? '' : starting ? T.modeStart : mixState.nextMode === 'tempo' ? T.modeTempo : T.modeClassic;
    mixNextBtn.setAttribute('aria-label', hasNext
      ? (starting ? T.start : T.next).replace(/^[^A-Z]+/, '') + ': ' + mixState.nextName + ', ' + mixNextMode.textContent
      : T.endOfList);
    if (mixState.last === 'beatmatched') { mixLast.textContent = T.lastBeat; mixLast.className = 'mixlast ok'; }
    else if (mixState.last === 'classic') { mixLast.textContent = T.lastClassic; mixLast.className = 'mixlast warn'; }
    else if (mixState.last === 'skipped') { mixLast.textContent = T.lastSkipped; mixLast.className = 'mixlast warn'; }
    else { mixLast.textContent = ''; mixLast.className = 'mixlast'; }
  }

  mixToggle.addEventListener('click', function () {
    vibrate(12);
    sendCommand(mixState.on ? 'mixOff' : 'mixOn', null, null, function () {
      vibrate([40, 60, 40]);
    });
  });

  // PROSSIMO al rilascio (click): non è un effetto da sparare al millesimo — il
  // mix si aggancia comunque al beat successivo — e un tocco accidentale cambierebbe brano.
  mixNextBtn.addEventListener('click', function () {
    if (mixNextBtn.disabled) return;
    pressFeedback(mixNextBtn);
    vibrate(15);
    sendCommand('mixNext', null, null, function (err) {
      vibrate([40, 60, 40]);
      mixNextBtn.classList.add('failed');
      if (err === 'end-of-list') mixNextTop.textContent = T.endOfList;
      setTimeout(function () { mixNextBtn.classList.remove('failed'); renderMix(); }, 1600);
    });
  });

  // ---------- schede ----------
  function applyTab() {
    var fx = activeTab === 'fx';
    tabFx.setAttribute('aria-selected', fx ? 'true' : 'false');
    tabMusic.setAttribute('aria-selected', fx ? 'false' : 'true');
    fxView.hidden = !fx;
    musicView.hidden = fx;
    stopFxBtn.hidden = !fx;
    if (fx) relayout();
  }
  tabFx.addEventListener('click', function () { activeTab = 'fx'; store(TAB_KEY, 'fx'); applyTab(); });
  tabMusic.addEventListener('click', function () { activeTab = 'music'; store(TAB_KEY, 'music'); applyTab(); });

  // ---------- STOP ----------
  // Al RILASCIO (click), non alla pressione: i due tasti stanno dove poggia il
  // pollice, e uno STOP ALL partito per sbaglio lascia la diretta muta. Qui
  // 100 ms in più non contano; un falso tocco sì.
  function wireStop(btn, name) {
    btn.addEventListener('click', function () {
      pressFeedback(btn);
      vibrate(20);
      sendCommand(name, null, null, function () {
        btn.classList.add('failed');
        vibrate([40, 60, 40]);
        setTimeout(function () { btn.classList.remove('failed'); }, 1600);
      });
    });
  }
  wireStop(stopFxBtn, 'stopAllFx');
  wireStop(stopAllBtn, 'stopAll');

  // Niente menu contestuale né selezione al tocco prolungato sulla superficie.
  ctrlScreen.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // ---------- schermo intero ----------
  var docEl = document.documentElement;
  if (docEl.requestFullscreen || docEl.webkitRequestFullscreen) {
    fsBtn.hidden = false;
    var isFullscreen = function () { return !!(document.fullscreenElement || document.webkitFullscreenElement); };
    var updateFs = function () {
      var label = isFullscreen() ? T.fsExit : T.fsEnter;
      fsBtn.setAttribute('aria-label', label);
      fsBtn.title = label;
      setTimeout(relayout, 120);
    };
    updateFs();
    fsBtn.addEventListener('click', function () {
      try {
        if (isFullscreen()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        else (docEl.requestFullscreen || docEl.webkitRequestFullscreen).call(docEl);
      } catch (e) { /* rifiutato dal browser */ }
    });
    document.addEventListener('fullscreenchange', updateFs);
    document.addEventListener('webkitfullscreenchange', updateFs);
  }

  // ---------- PIN ----------
  function submitPin() {
    if (connectBtn.disabled) return; // già inviato (6ª cifra + Invio): niente doppio tentativo
    var pin = pinInput.value.replace(/[^0-9]/g, '');
    if (!isPin(pin)) { setPinMsg(T.pin6, 'err'); return; }
    connectBtn.disabled = true;
    setPinMsg(T.connecting);
    store(PIN_KEY, pin);
    everConnected = false;
    retryCount = 0;
    dropSocket(connecting); connecting = null;
    connect();
    setTimeout(function () { connectBtn.disabled = false; }, 1500);
  }
  connectBtn.addEventListener('click', submitPin);
  pinInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitPin(); });
  pinInput.addEventListener('input', function () { if (/^[0-9]{6}$/.test(pinInput.value)) submitPin(); });

  logoutBtn.addEventListener('click', function () {
    clearRetry();
    dropSocket(socket); socket = null;
    dropSocket(connecting); connecting = null;
    stopPing(); failAllPending();
    store(PIN_KEY, null);
    showPinScreen('');
    pinInput.focus();
  });

  // QR inquadrato con la pagina già aperta (es. dopo «Nuovo PIN»): il browser
  // cambia solo il frammento e NON ricarica. Si legge il PIN nuovo e ci si ricollega.
  window.addEventListener('hashchange', function () {
    if (!takePinFromHash()) return;
    clearRetry();
    dropSocket(socket); socket = null;
    dropSocket(connecting); connecting = null;
    stopPing(); failAllPending();
    everConnected = false;
    retryCount = 0;
    pinScreen.hidden = true;
    ctrlScreen.hidden = false;
    ctrlScreen.classList.add('offline');
    setConn('wait', T.connecting);
    applyTab();
    connect();
  });

  // ---------- avvio ----------
  if (isPin(recall(PIN_KEY))) {
    pinScreen.hidden = true;
    ctrlScreen.hidden = false;
    ctrlScreen.classList.add('offline');
    setConn('wait', T.connecting);
    applyTab();
    connect();
  } else {
    showPinScreen('');
  }
})();
</script>
</body>
</html>
`;
