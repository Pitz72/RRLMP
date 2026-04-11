# CAPITOLO 6: CONTROLLO HARDWARE E ROUTING

Un software di regia professionale non vive isolato nel computer. Deve comunicare con il mixer dello studio, con le cuffie e con le dita del regista.
In questo capitolo vedremo come configurare l'uscita audio e come comandare il software senza toccare il mouse.

---

## 6.1 Configurazione Audio (Routing)

Per default, RRLMP esce sulla periferica audio predefinita di Windows. Tuttavia, in uno studio (o con setup podcast avanzati come il *Rødecaster Pro*), hai bisogno di separare i flussi.

### Selezionare l'Uscita
1.  Clicca sull'icona **Ingranaggio (Impostazioni)** nella barra dei comandi in alto.
2.  Si aprirà il pannello **General Settings**.
3.  Nel menu a tendina "Audio Output Device", vedrai la lista di tutte le schede audio collegate al tuo PC.
4.  Seleziona la periferica desiderata (es. *Rødecaster Pro Stereo* o *Focusrite USB*).

### Live Switch
Il cambio è istantaneo. Se la musica sta suonando mentre cambi periferica, l'audio "salterà" sulla nuova uscita senza interrompersi.

> **Consiglio per Rødecaster/Mixer USB**: Se il tuo mixer ha più canali USB (es. Main e Sounds/Chat), imposta RRLMP su un canale secondario (es. "Sounds") in modo da poter controllare il suo volume con un fader dedicato sul mixer fisico, separandolo dai suoni di sistema di Windows.

---

## 6.2 La Tastiera (Hotkeys)

La tastiera del computer è il controller più veloce che hai. RRLMP include comandi globali preimpostati e tasti personalizzabili.

### Comandi Globali (F-Keys)
I tasti funzione (F1-F5) sono mappati per lanciare le colonne. Hanno una logica "intelligente": cercano la prima clip libera.
*   **F1**: Lancia la colonna 1 (Assets).
*   **F2**: Lancia la colonna 2 (Musica).
*   **F3**: Lancia la colonna 3 (Voci).
*   **F4**: Lancia la colonna 4 (SFX).
*   **F5**: Lancia la colonna 5 (Pre-Show).
*   **ESC**: **PANIC BUTTON**. Ferma tutto immediatamente (Stop All).

### Tasti Personalizzati (Custom Binds)
Vuoi lanciare la sigla premendo la barra spaziatrice o la lettera "Q"?
1.  Fai tasto destro sulla clip -> **Edit**.
2.  Clicca nel campo **Trigger Keybind**.
3.  Premi il tasto desiderato sulla tastiera.
4.  Salva.
5.  Sulla card apparirà un badge (es. **[Q]**) per ricordarti l'assegnazione.

> **Sicurezza**: I comandi da tastiera vengono automaticamente disabilitati se stai scrivendo del testo (es. rinominando una clip), per evitare di far partire l'audio mentre digiti.

---

## 6.3 MIDI Controller (Il Potere Fisico)

Questa è la funzione "Pro" per eccellenza. Puoi collegare tastiere musicali, pad (come *Novation Launchpad*) o controller a fader (come *Korg nanoKONTROL*) e usarli per guidare il software.

### Collegamento
1.  Collega il tuo controller USB-MIDI al computer **prima** di avviare Runtime Live Machine Pro.
2.  Avvia il software. Il motore MIDI riconoscerà automaticamente la periferica.

### MIDI Learn Mode (Mappatura Facile)
Non devi conoscere codici complicati. RRLMP impara guardando cosa fai.

1.  Clicca sull'icona **MIDI** (Connettore DIN) nella barra in alto.
    *   L'icona diventa **Ciano (Accesa)**.
    *   Le clip assumono un aspetto tratteggiato ("In attesa").
2.  **Per mappare una Clip**:
    *   Clicca con il mouse sulla Clip desiderata.
    *   Premi il pulsante/pad fisico sul tuo controller.
    *   Apparirà un badge (es. **[M:60]**) sulla clip. Fatto.
3.  **Per mappare funzioni Globali**:
    *   Clicca sul pulsante rosso **STOP ALL** sullo schermo -> Premi un tastone sul controller.
    *   Clicca sullo slider **MASTER VOL** sullo schermo -> Muovi un fader o una manopola sul controller.
4.  Clicca di nuovo l'icona **MIDI** per uscire dalla modalità Learn.

### Tipi di Comandi Supportati
*   **Note On/Off**: Perfetto per pulsanti e pad (Lancio Clip, Stop All).
*   **Control Change (CC)**: Perfetto per fader e manopole rotative. Usalo per controllare il Master Volume in modo analogico e fluido.

> **Portabilità**: Le mappature MIDI delle clip sono salvate dentro il progetto `.lmp`. Se porti il progetto su un altro PC con lo stesso controller, funzionerà tutto subito.
