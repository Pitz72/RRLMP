# CAPITOLO 5: IL MOTORE DI MIXAGGIO (THE BRAIN)

Runtime Live Machine non è un semplice player che suona file audio a caso. Al suo interno c'è un **"Cervello" di Mixaggio** sempre attivo.
Il software agisce come un fonico virtuale invisibile: ascolta ciò che stai facendo e regola automaticamente i volumi delle altre tracce per garantire che il risultato finale sia sempre pulito e intellegibile.

Non devi preoccuparti di abbassare manualmente la musica quando parte un'intervista: ci pensa RLM.

---

## 5.1 La Gerarchia Audio (La Piramide)

Per capire come funziona, immagina le colonne come una piramide di importanza. Chi sta in cima "comanda" sul volume di chi sta sotto.

1.  **LIVELLO 1 (Capi Supremi): VOCI / PREREGISTRAZIONI** (Colonna Arancione)
    *   Hanno sempre la priorità assoluta. Nessuno può abbassare il loro volume. Quando parlano loro, tutti gli altri si zittiscono.
2.  **LIVELLO 2 (Classe Media): CANZONI DELL'EPISODIO** (Colonna Rossa)
    *   Vengono abbassate dalle Voci. Ma comandano sugli Assets.
3.  **LIVELLO 3 (Sottofondo): SHOW ASSETS** (Colonna Verde)
    *   Sono le basi e i tappeti sonori. Vengono zittiti da quasi tutto il resto.

> **Nota Bene**: La colonna **SFX / CARTWALL** (Grigia) è "fuori dal sistema". Gli effetti sonori suonano sempre al volume massimo e si sovrappongono a tutto senza influenzare o essere influenzati dagli altri. Un applauso deve sentirsi forte, anche sopra una voce.

---

## 5.2 Il Ducking Automatico (Effetto Radio)

Questa è la funzione più utilizzata in radio. Il "Ducking" è l'abbassamento automatico della musica quando qualcuno parla.

*   **Come funziona**:
    1.  Hai una Canzone o una Base in riproduzione (Volume 100%).
    2.  Lanci una clip dalla colonna **VOCI** (es. un'intervista o un vocale).
    3.  Il software abbassa immediatamente e dolcemente la Canzone/Base a un livello di sottofondo (circa il 20% del volume, o -14dB).
    4.  La Voce suona chiara sopra la musica.
    5.  Appena la clip Voce finisce, la musica risale automaticamente al 100%.

*   **Vantaggio**: Non devi usare il mouse per abbassare fader mentre cerchi di lanciare l'intervista. È tutto automatico.

---

## 5.3 Music Dominance (Gestione Intelligente Basi)

Un errore classico dei registi alle prime armi è far suonare una canzone *sopra* una base ritmica (Bed), creando un caos sonoro (batteria contro batteria). RLM risolve questo problema con la **Dominanza Musicale**.

*   **Lo Scenario**:
    Hai una Base (Show Asset) in loop sotto la voce dello speaker. A un certo punto lanci un disco (Canzone).
*   **Cosa fa RLM**:
    Invece di fermare la base (che ti servirebbe pronta dopo la canzone), il software la porta a **Volume 0 (Muto)** ma continua a farla girare "in fantasma".
*   **Il Risultato**:
    Si sente solo la Canzone. La base è sparita.
*   **Il Ritorno**:
    Quando la Canzone finisce (o premi Stop sulla canzone), la Base riemerge automaticamente in dissolvenza (Fade In).

Questo ti permette di avere un flusso continuo "Base -> Canzone -> Base" senza dover mai cliccare "Play" sulla base una seconda volta.

---

## 5.4 Eccezioni: Gli "Stacchi"

Cosa succede se vuoi suonare un Jingle della radio *sopra* la base, senza che la base sparisca del tutto?
Qui entra in gioco l'impostazione **Behavior: Stacco** (vedi Cap. 4).

*   Se una clip nella colonna Assets è impostata come "Normal", fermerà le altre basi.
*   Se è impostata come **"Stacco"**, si sovrapporrà alle altre basi abbassandole leggermente, ma senza fermarle. È ideale per gli Station ID ("State ascoltando Runtime Radio...") che devono "cavalcare" l'intro di un brano o una base.
