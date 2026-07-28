# Piano di test — v1.11.4 (2026-07-02)

Checklist per i test dei prossimi giorni (regia reale o dev). Software dichiarato **completo e pronto per la distribuzione** il 2026-07-02: questi test sono la validazione finale; eventuali problemi → patch 1.11.x.

## 1. Installer 1.11.4 (`builds/v1.11.4`, 116 MB)

- [ ] Installazione pulita sopra la 1.11.0 senza errori.
- [ ] Al primo avvio (nuovo progetto) il pad FX ha già i 10 suoni pre-caricati.
- [ ] La versione nel tooltip del logo e nella topbar dice 1.11.4.

## 2. Suoni FX di default (novità v1.11.2)

- [ ] Apri un **progetto salvato senza clip FX** → i 10 suoni di default appaiono da soli (senza reset).
- [ ] Apri un progetto che HA clip FX → resta tutto com'era, nessun default aggiunto.
- [ ] **Ascolto critico dei 10 suoni** (mai ascoltati da nessuno, curati solo via metadata): volume, qualità, attinenza al nome. Segnala quelli da sostituire.

## 3. Controllo Remoto via browser (novità v1.11.3)

- [ ] Impostazioni → Generali → attiva Controllo Remoto; "Copia link" ora dà `http://…` (prima era rotto).
- [ ] Dal tablet/PC in LAN: apri il link nel browser → PIN → comanda play/stop Music e STOP ALL.
- [ ] Pulsante **"⛶ Schermo intero"** in alto a destra della pagina: entra/esce dal fullscreen.

## 4. Automix in diretta (approvato in dev, mai provato live)

- [ ] Scaletta EDM di prova: `C:\Users\Utente\Music\_AutomixTest\TEST-AUTOMIX-EDM.lmp` (12 tracce verdi).
- [ ] Transizione manuale col pulsantone: passaggio "a tempo", nessuno stacco secco.
- [ ] "Auto a fine brano" (checkbox, default OFF): parte da sola vicino alla fine.
- [ ] Su coppie incompatibili (indicatore rosso/giallo): fallback al crossfade classico, annunciato.
- [ ] STOP ALL / ESC durante una transizione: tutto si ferma pulito.

## 5. Batch UI regia (accumulato, mai visto in diretta)

- [ ] Pad FX in diretta: play/stop, colori accesi in riproduzione, tasto destro = impostazioni rapide.
- [ ] Colonne nascoste (Impostazioni → Layout regia): la board si adatta; la **rotazione PRE-SHOW continua a suonare jingle/promo anche se le loro colonne sono nascoste**.
- [ ] Menu FILE e menu 🔧 strumenti in topbar: tutto raggiungibile, niente sforamenti.
- [ ] Modale Impostazioni (v1.11.4): tab Generali tutta visibile senza scroll sullo schermo di regia.

## 6. Code audio ancora senza ascolto reale

- [ ] Preset Glue Multibanda **Rock / Jazz / Elettronico** (Impostazioni → Master Chain): solo Neutro è tarato con misura oggettiva, gli altri vanno giudicati a orecchio.

---

**Da comunicare a Claude dopo i test**: esito punto per punto + la **risoluzione dello schermo del portatile di regia** (per chiudere il capitolo topbar).
