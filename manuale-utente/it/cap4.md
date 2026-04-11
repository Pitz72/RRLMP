# CAPITOLO 4: EDITING AVANZATO CLIP (PROPRIETÀ)

Ogni file audio è diverso: alcuni hanno lunghi silenzi iniziali, altri hanno un volume troppo basso, altri ancora devono ripetersi all'infinito.
Per accedere al pannello di configurazione avanzata, fai **Click con il Tasto Destro** su qualsiasi clip e seleziona **"Edit"** (Modifica).

Si aprirà una finestra modale divisa in due sezioni principali: **Visual & Basic** (Sinistra) e **Behavior & Timing** (Destra).

---

## 4.1 Impostazioni di Base (Visual & Audio)

In questa sezione controlli l'aspetto e il volume grezzo della clip.

*   **Nome Clip**: Puoi rinominare la clip come preferisci (es. da `track_01_final.mp3` a `SIGLA DI APERTURA`). Questo cambia solo l'etichetta nel software, non il nome del file originale sul disco.
*   **Volume (Gain)**: Uno slider che va da 0% a 150%.
    *   Se hai una registrazione bassa (es. un vocale WhatsApp), puoi spingerla oltre il 100% per allinearla al resto dello show.
*   **Colore Personalizzato**: Per default, la clip eredita il colore della sua colonna (es. Verde per Assets). Qui puoi forzare un colore diverso per farla risaltare (es. colorare di Rosso un jingle importante nella colonna Grigia).

---

## 4.2 Precisione Chirurgica: Cue Points & Trim

Spesso i file audio non sono "pronti per la messa in onda": hanno secondi di silenzio in testa o code troppo lunghe. Invece di usare un editor audio esterno, puoi sistemarli qui. Queste modifiche sono **non distruttive** (il file originale rimane intatto).

### Controlli Manuali
*   **Trim Start (Inizio)**: Imposta quanti secondi saltare all'inizio.
    *   *Esempio*: Se metti `2.5`, quando premi Play la clip partirà istantaneamente dal secondo 2.5, saltando il silenzio iniziale ("a battuta").
*   **Trim End (Fine)**: Imposta quanti secondi tagliare dalla fine.
    *   *Esempio*: Se la canzone ha 20 secondi di applausi finali inutili, aumenta questo valore finché il "New Duration" non ti soddisfa.

### 🪄 La Bacchetta Magica (Smart Trim / Auto-Detect)
Per velocizzare il lavoro, RRLMP include un algoritmo di intelligenza artificiale di base.
1.  Clicca sul pulsante con l'icona **Bacchetta Magica** accanto ai controlli Trim.
2.  Il software scansiona il file in una frazione di secondo.
3.  Rileva automaticamente dove inizia e finisce il suono reale (sopra la soglia di -40dB).
4.  Compila automaticamente i campi *Start* ed *End* per te.

> **Consiglio**: Usa sempre la Bacchetta Magica sulle registrazioni vocali o le interviste per pulirle istantaneamente.

---

## 4.3 Comportamenti (Behaviors & Logic)

Qui definisci l'intelligenza della clip: cosa deve fare quando parte e cosa deve fare quando finisce.

### Behavior (Modalità di Sovrapposizione)
*   **Normal (Default)**: Quando lanci questa clip, qualsiasi altra clip che sta suonando **nella stessa colonna** viene fermata. È il comportamento standard per le canzoni (una esclude l'altra).
*   **Stacco**: Quando lanci questa clip, essa **NON ferma** le altre clip della colonna, ma le "zittisce" temporaneamente (o si sovrappone).
    *   *Uso tipico*: Un effetto sonoro o un jingle vocale che vuoi suonare sopra una base musicale che si trova nella stessa colonna, senza interrompere la base.

### Next Action (Automazione Finale)
Cosa succede quando la clip finisce?
*   **Stop**: La clip finisce e si ferma. (Comportamento standard).
*   **Loop**: La clip ricomincia da capo all'infinito. Utile per basi e sottofondi (Bed). Apparirà un badge **[LOOP]** sulla card.
*   **Play Next**: Appena questa clip inizia a sfumare (Fade Out), il software lancia automaticamente la clip successiva nella colonna.
    *   *Crossfade*: Il passaggio è fluido, senza buchi di silenzio. Apparirà un badge **[NEXT]** sulla card.

---

## 4.4 Fades (Dissolvenze)

Ogni colonna ha dei default (es. la Musica sfuma in 2 secondi, i Jingle sono secchi), ma qui puoi sovrascriverli.

*   **Fade In (ms)**: Quanto tempo impiega il volume ad arrivare al massimo quando premi Play. (Es. 2000ms = 2 secondi di salita graduale).
*   **Fade Out (ms)**: Quanto tempo impiega a sfumare quando premi Stop o quando la clip finisce naturalmente.
    *   *Nota*: Un Fade Out lungo è utile per le canzoni. Un Fade Out a 0 è obbligatorio per gli stacchi secchi.

---

## 4.5 Assegnazione Controlli (Input)

In fondo al pannello trovi i riferimenti per il controllo esterno:
*   **Trigger Keybind**: Clicca qui e premi un tasto sulla tastiera (es. "Q") per assegnarlo a questa clip.
*   **MIDI Bind**: Mostra la nota MIDI assegnata (es. `NOTE:60`). Per modificarla, usa la modalità "MIDI Learn" dalla schermata principale (vedi Cap. 6).
