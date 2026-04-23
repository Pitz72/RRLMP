# Capitolo 8 — Hardware, routing e controllo

---

Runtime Live Machine Pro è progettato per integrarsi con l'hardware esistente nello studio senza richiedere configurazioni elaborate. Questo capitolo descrive come configurare l'uscita audio, come sfruttare la tastiera del computer come controller e come collegare dispositivi MIDI fisici per un controllo tattile della regia.

---

## 8.1 Routing audio

### Selezionare la periferica di uscita

Per impostazione predefinita, RLMP esce sulla periferica audio predefinita del sistema operativo. In un contesto professionale o semiprofessionale — con mixer USB, schede audio esterne o sistemi multitraccia — è necessario selezionare esplicitamente la destinazione del segnale.

1. Clicca sull'icona **Ingranaggio** (Impostazioni) nell'header.
2. Nel menu a tendina *Audio Output Device*, trovi l'elenco completo delle periferiche audio disponibili sul sistema.
3. Seleziona la periferica desiderata.

Il cambio è **istantaneo e non interrompe la riproduzione**: se una clip è in corso mentre cambi l'uscita, l'audio si trasferisce sulla nuova periferica senza interruzioni.

### Mixer USB e setup multicanale

I mixer USB come il Rødecaster Pro, il Rode RODECaster Duo o il Focusrite Scarlett espongono tipicamente più canali USB al sistema operativo (Main Mix, Sounds/Chat, Monitor, ecc.). RLMP appare come una singola sorgente stereo; la scelta del canale USB su cui dirigerlo è interamente nelle tue mani.

**Setup consigliato con mixer USB.** Assegna RLMP a un canale secondario del mixer (es. «Sounds» sul Rødecaster Pro) invece che al canale principale. In questo modo puoi controllare il volume di RLMP con un fader fisico dedicato sul mixer, separarlo dal segnale del microfono fisico e applicare eventuale processing hardware solo a quel canale.

### Latenza e buffer

RLMP utilizza le API audio native del sistema operativo (WASAPI su Windows, Core Audio su macOS, ALSA/PipeWire su Linux). La latenza di uscita è determinata dal buffer della periferica audio, non dal software. Per schede audio professionali con driver ASIO su Windows o Core Audio su macOS, la latenza è nell'ordine di pochi millisecondi e non percepibile in un contesto di playout.

Se noti artefatti audio (crepitii, dropout), il valore di buffer della periferica è probabilmente troppo basso. Aumentalo tramite il pannello di controllo della scheda audio (non tramite RLMP, che non ne gestisce direttamente il driver): un buffer di 256 o 512 campioni è il punto di equilibrio ideale tra latenza e stabilità.

---

## 8.2 Controllo da tastiera

La tastiera del computer è il controller più rapido disponibile in diretta: non richiede coordinazione oculo-manuale, funziona al buio, è sempre disponibile. RLMP include un set di comandi predefiniti e la possibilità di assegnare tasti personalizzati alle singole clip.

### Comandi globali (tasti funzione)

I tasti F1–F5 sono mappati per colonna e applicano una logica di ricerca intelligente: avviano la prima clip disponibile nella colonna corrispondente che non sia in riproduzione.

| Tasto | Azione |
|---|---|
| **F1** | Lancia la prima clip disponibile — colonna Show Assets |
| **F2** | Lancia la prima clip disponibile — colonna Canzoni |
| **F3** | Lancia la prima clip disponibile — colonna Voci |
| **F4** | Lancia la prima clip disponibile — colonna SFX |
| **F5** | Lancia la prima clip disponibile — colonna Pre-Show |
| **Esc** | STOP ALL — ferma tutto istantaneamente |

Il tasto **`Esc`** è registrato come shortcut globale a livello di sistema operativo: funziona anche quando RLMP non è la finestra attiva.

### Tasti personalizzati per singola clip

Oltre ai comandi globali, ogni clip può avere un tasto dedicato. Il badge corrispondente apparirà sulla card nella griglia.

**Per assegnare un tasto:**
1. Fai click con il tasto destro sulla clip e seleziona *Edit*.
2. Clicca nel campo *Trigger Keybind*.
3. Premi il tasto desiderato.
4. Salva.

**Tasti disponibili.** Quasi qualsiasi tasto può essere assegnato: lettere (A–Z), numeri (0–9), tasto numpad (Num0–Num9), tasto spazio, tasti funzione (F6–F12, quelli non già occupati dai comandi globali). I tasti riservati al sistema operativo non sono disponibili.

**Sicurezza durante la digitazione.** I tasti personalizzati vengono disabilitati automaticamente quando sei in modalità di inserimento testo (es. stai rinominando una clip o stai scrivendo nelle note). Questo previene lanci accidentali mentre digiti.

---

## 8.3 Controller MIDI

Il MIDI è la scelta professionale per chi vuole un controllo fisico, tattile e affidabile della regia. RLMP supporta qualsiasi controller USB-MIDI: tastiere, pad (es. Novation Launchpad), controller a fader (es. Korg nanoKONTROL2), superfici di controllo ibride.

### Collegamento

Collega il controller USB al computer **prima** di avviare RLMP. Il software rileva i controller presenti all'avvio tramite le API MIDI native del sistema operativo. Se colleghi un controller a software già aperto, il rilevamento potrebbe non avvenire automaticamente: chiudi e riapri RLMP.

Non sono richiesti driver specifici per la maggior parte dei controller USB-MIDI class-compliant; per controller avanzati che richiedono driver proprietari (es. alcune superfici di controllo professionali), installa i driver prima di collegare il dispositivo.

### MIDI Learn

RLMP non richiede la conoscenza della numerazione delle note MIDI né la configurazione manuale dei messaggi. L'apprendimento avviene tramite la modalità **MIDI Learn**.

**Per attivare la modalità MIDI Learn:**
1. Clicca sull'icona **MIDI** (connettore DIN) nell'header.
2. L'icona diventa **ciana** e le card nella griglia assumono un aspetto tratteggiato, indicando che sono in attesa di una mappatura.

**Per mappare una clip a un tasto/pad:**
1. In modalità MIDI Learn, clicca con il mouse sulla clip desiderata.
2. Premi il tasto, il pad o la nota sul controller fisico.
3. Il badge **[M:XX]** apparirà sulla card con il numero della nota assegnata.

**Per mappare funzioni globali:**
1. Clicca sul pulsante **STOP ALL** sullo schermo, poi premi un tasto sul controller: da quel momento, quel tasto eseguirà uno Stop All globale.
2. Clicca sullo slider **Master Volume** nell'header, poi muovi un fader o una manopola rotativa sul controller: da quel momento, quel controllo gestirà il volume master in modo analogico e continuo.

**Per uscire dalla modalità MIDI Learn:**
Clicca di nuovo sull'icona MIDI (torna grigia). I tasti fisici tornano a eseguire le clip mappate invece di registrare nuove mappature.

### Tipi di messaggi MIDI supportati

**Note On/Off** — messaggi generati da pulsanti, pad e tasti di una tastiera. Ideali per il lancio e lo stop delle clip. RLMP risponde all'evento Note On (pressione del tasto).

**Control Change (CC)** — messaggi generati da fader motorizzati, potenziometri rotativi e pedali. Trasmettono un valore continuo da 0 a 127. Ideali per il Master Volume: un fader fisico mappato sul Master Volume offre il controllo più naturale e preciso del livello di uscita generale.

### Portabilità delle mappature

Le mappature MIDI sono salvate nel file di progetto `.lmp`, non nel software. Se porti il tuo progetto su un altro computer con lo stesso modello di controller collegato, le mappature funzioneranno immediatamente senza riconfigurazione.

