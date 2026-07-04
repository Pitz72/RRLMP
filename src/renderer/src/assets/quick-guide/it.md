# Runtime Live Machine Pro — Guida Rapida

**Versione 1.15.6 · Italiano**

Benvenuto in Runtime Live Machine Pro (RLMP), il software di playout audio per radio, dirette ed eventi live. Questa guida ti porta dall'installazione al primo play in pochi minuti. Per la documentazione completa, consulta il Manuale Utente (scaricabile dal software con il pulsante "Manuale").

---

## 1. Requisiti di sistema

| | Minimo | Consigliato |
|---|---|---|
| Windows | 10 64-bit | 11 64-bit |
| macOS | 11 Big Sur | 13 Ventura o successivi |
| Linux | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| RAM | 4 GB | 8 GB o più |
| Disco | 300 MB | 1 GB + spazio per gli audio |

Non serve una scheda audio dedicata: RLMP funziona con qualsiasi periferica riconosciuta dal sistema, dall'uscita integrata ai mixer USB professionali (Rødecaster Pro, Rødecaster Duo, ecc.). Ottimizzato nativamente per Apple Silicon (M1/M2/M3).

---

## 2. Installazione

**Windows**
1. Apri il file `.exe` scaricato.
2. Se compare l'avviso *"Il PC è stato protetto da Windows"*, clicca su **Ulteriori informazioni** → **Esegui comunque**. È normale per software aggiornato di frequente: non c'è alcun malware, il codice è verificabile pubblicamente.
3. Segui la procedura guidata. Al termine si crea un collegamento su Desktop e nel menu Start.

**macOS**
1. Apri il file `.dmg` scaricato.
2. Trascina l'icona di Runtime Live Machine Pro nella cartella **Applicazioni**.
3. Al primo avvio, se macOS mostra l'avviso Gatekeeper, vai in **Impostazioni di Sistema → Privacy e sicurezza** e clicca su **Apri comunque** accanto al nome dell'app.

**Linux**
- **AppImage** (portabile, nessuna installazione): rendi il file eseguibile con `chmod +x` e avvialo.
- **.deb** (Debian/Ubuntu/Mint): installa con `sudo dpkg -i nomefile.deb` o con il gestore pacchetti grafico.
- Se l'app non parte, verifica di avere il pacchetto `libasound2` per il supporto ALSA.

---

## 3. Primo avvio

All'apertura vedrai la **Welcome Screen**: da qui puoi creare un nuovo progetto, caricarne uno esistente (`.lmp`), scaricare il Manuale Utente o aprire questa Guida Rapida. In alto a destra puoi scegliere la lingua dell'interfaccia tra le otto disponibili.

Una volta aperto un progetto, il badge **PRO** ciano nell'header conferma che il motore audio è attivo. Premi `F11` (Windows/Linux) o `Ctrl+Cmd+F` (macOS) per passare a schermo intero — la modalità di lavoro consigliata in regia.

---

## 4. Le sei colonne

RLMP organizza tutto in sei colonne fisse, ciascuna con un comportamento dedicato:

| Colonna | Colore | Comportamento |
|---|---|---|
| **Show Assets** | Verde | Sigle, basi musicali, stacchi istituzionali |
| **Jingle** | Ambra | Jingle identificativi |
| **Promo** | Ciano | Promo e autopromozioni |
| **Canzoni** | Rosso | Playlist musicale, subisce ducking, rilevamento BPM |
| **Voci** | Arancione | Priorità massima: abbassa tutto il resto |
| **Pre-Show** | Viola | Musica di attesa prima della diretta, con rotazione opzionale |

Ogni colonna ha un pallino colorato nell'intestazione: cliccalo per scegliere un colore diverso tra 30 tinte disponibili.

---

## 5. Pad FX e Automix

Oltre alle sei colonne, l'header offre due strumenti rapidi:

- **FX** — apre il pad degli effetti sonori: lancio a sovrapposizione libera, ideale per stinger, applausi, transizioni sonore.
- **MIX** — apre la vista Automix, il deck dedicato alla colonna Canzoni: compatibilità BPM, transizioni beat-matched e modalità automatica.

---

## 6. Carica e riproduci il primo file

1. Trascina un file audio (MP3, WAV, AAC/M4A, OGG, FLAC) da Esplora risorse / Finder direttamente su una colonna.
2. **Click sinistro** sulla card per avviare la riproduzione.
3. **Click di nuovo** sulla card attiva per fermarla con fade out, oppure premi `Esc` per uno stop di emergenza immediato su tutte le clip.

Nella maggior parte delle colonne vale la regola "una clip alla volta": avviarne una nuova ferma automaticamente quella in corso nella stessa colonna. Il pad FX e le clip in modalità Stacco fanno eccezione e si sovrappongono liberamente.

---

## 7. Dove trovare aiuto

- **Manuale Utente completo** — scaricabile direttamente dal software (pulsante "Manuale" nella schermata Info), copre ogni funzione in dettaglio (waveform editor, ducking, MIDI, registrazione, gestione progetti, controllo remoto).
- **Sito ufficiale e aggiornamenti** — il colore accanto al numero di versione nella Welcome Screen indica se è disponibile un aggiornamento (verde = aggiornato, giallo/arancio = nuova versione disponibile).

Buona diretta.

*Runtime Live Machine Pro è un progetto Ecosystem.Runtime — © Simone Pizzi.*
