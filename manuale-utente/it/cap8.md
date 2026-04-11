# CAPITOLO 8: RISOLUZIONE PROBLEMI E FAQ

Anche nel software più stabile, possono verificarsi imprevisti dovuti all'hardware o al sistema operativo. Qui trovi le soluzioni ai problemi più comuni.

---

## 8.1 Problemi Audio

### Il Timer scorre e i VU Meter si muovono, ma non sento nulla.
Il software sta riproducendo correttamente l'audio (lo vedi dalle barre colorate in alto), ma il segnale non arriva alle tue casse/cuffie.
1.  **Controlla il Master Volume**: Assicurati che lo slider del volume in alto non sia a zero.
2.  **Verifica l'Uscita (Routing)**:
    *   Clicca sull'icona **Ingranaggio** (Impostazioni).
    *   Verifica quale periferica è selezionata in "Audio Output Device".
    *   A volte Windows cambia l'ID delle periferiche USB se vengono scollegate e ricollegate. Prova a riselezionare la tua scheda audio (es. *Rødecaster Pro* o *Cuffie*) dalla lista.
3.  **Mixer Esterno**: Se esci su un mixer USB, controlla che il fader fisico di quel canale non sia abbassato o in "Mute".

### L'audio "gracchia" o salta.
Questo accade raramente grazie al motore nativo, ma può succedere se la CPU del computer è sotto stress estremo.
*   Chiudi altre applicazioni pesanti (montaggio video, giochi).
*   Se usi una scheda audio professionale, controlla che il *Buffer Size* nei driver della scheda non sia troppo basso (consigliato: 256 o 512 samples).

---

## 8.2 Gestione File e Clip Rosse

### Una Clip è diventata Rossa e non suona più.
Una **Card Rossa** indica che il software non riesce più a trovare il file audio sul disco.
*   **Causa**: Hai spostato, rinominato o cancellato il file originale MP3/WAV. Oppure il file era su una chiavetta USB/Disco Esterno che ora è scollegato.
*   **Soluzione**:
    1.  Ricollega il disco esterno.
    2.  Riporta il file nella posizione originale.
    3.  Oppure, trascina di nuovo il file nella griglia (creando una nuova card) e cancella quella vecchia rossa.

> **Prevenzione**: Per evitare questo problema, usa la funzione **Export Package** (Cap. 7) che copia tutti i file in una cartella sicura insieme al progetto.

---

## 8.3 Problemi MIDI

### Il mio controller MIDI non funziona / non viene rilevato.
1.  **Regola d'Oro del MIDI**: Il controller deve essere collegato al computer **PRIMA** di avviare Runtime Live Machine Pro.
    *   Se lo colleghi a software aperto, il browser interno potrebbe non vederlo. Chiudi e riapri RRLMP.
2.  **Learn Mode**: Verifica di non aver lasciato attiva la modalità "MIDI Learn" (Icona Ciano). In questa modalità, premere i tasti serve solo a mappare, non a suonare.
3.  **Driver**: Alcuni controller avanzati richiedono driver specifici. Verifica che Windows lo riconosca correttamente.

---

## 8.4 Domande Frequenti (FAQ)

**Q: Posso usare RRLMP per automatizzare la radio 24 ore su 24?**
A: No. RRLMP è progettato per la regia *Live* (show presidiati da una persona). Non ha funzioni di schedulazione oraria o rotazione automatica musicale infinita.

**Q: Quali formati audio sono supportati?**
A: Supporta nativamente **MP3, WAV, AAC, OGG, FLAC**. Consigliamo l'uso di WAV per la massima qualità o MP3 320kbps per risparmiare spazio.

**Q: Il software funziona su iPad o Android?**
A: No, Runtime Live Machine Pro è un software Desktop professionale per **Windows** e **macOS**. Richiede la potenza di gestione file di un computer vero.

**Q: Come aggiorno il software?**
A: All'avvio, la Welcome Screen ti avviserà se c'è una nuova versione disponibile (indicatore Giallo/Arancione). Visita il sito ufficiale per scaricare l'installer aggiornato. I tuoi progetti `.lmp` salvati saranno compatibili con le nuove versioni.

**Q: Dove trovo i file di salvataggio automatico?**
A: Se stai lavorando su un file salvato, il backup `.bak` è nella stessa cartella del progetto. Se stavi lavorando su un progetto "Senza Titolo" e il PC si è spento, controlla nella cartella dei dati applicazione del sistema (su Windows: `%APPDATA%\runtime-live-machine\`).

