# Capitolo 11 — Controllo Remoto

---

Non sempre chi conduce sta seduto davanti al computer. A volte il conduttore è dall'altra parte dello studio, dietro un vetro, oppure si muove con un ospite. Il **Controllo Remoto** di Runtime Live Machine Pro consente di comandare i passaggi essenziali dello show da un secondo dispositivo (un tablet, un telefono, un portatile) collegato alla stessa rete locale, usando semplicemente il browser. Non serve installare nulla sul dispositivo remoto.

La funzione è al momento contrassegnata come **Beta**.

---

## 11.1 Come funziona

Quando lo attivi, RLMP avvia al proprio interno un piccolo **server web locale**. Il dispositivo remoto si connette a questo server aprendo un indirizzo nel browser: da lì compare una pagina di controllo che rispecchia lo stato della colonna Musica e permette di agire su di essa.

Tutto avviene **dentro la rete locale**: il server è raggiungibile dagli apparecchi connessi alla stessa rete Wi-Fi o LAN dello studio, e non passa da internet.

---

## 11.2 Attivazione

1. Apri le **Impostazioni** dal menu Strumenti e vai alla scheda *Generali*.
2. Attiva il toggle **Controllo Remoto (Beta)**.
3. Compaiono un **PIN a sei cifre**, la **porta** del server e gli **indirizzi di rete** a cui il dispositivo remoto può connettersi.
4. Il pulsante **Copia link** copia negli appunti l'indirizzo pronto all'uso (nella forma `http://<indirizzo-del-computer>:8787`).

Il server ascolta sulla porta **8787**. Il PIN viene **rigenerato a ogni avvio** dell'applicazione e non viene memorizzato: chiudere e riaprire RLMP produce un nuovo PIN. Anche il Controllo Remoto stesso riparte sempre spento a ogni avvio, da riattivare quando serve.

---

## 11.3 Connettersi dal dispositivo remoto

1. Sul tablet o sul telefono, apri il browser e digita l'indirizzo mostrato nelle Impostazioni (o incollalo dal link copiato).
2. Compare una pagina con un tastierino: inserisci il **PIN a sei cifre**.
3. A PIN corretto, la pagina mostra l'elenco delle clip della colonna **Musica**, con i comandi di riproduzione, e un pulsante **Stop All**. Un pulsante dedicato porta la pagina a tutto schermo, comodo su tablet.

Da qui puoi far partire e fermare i brani della colonna Musica e, se serve, fermare tutto. Lo stato si aggiorna in tempo reale: ciò che parte o si ferma sul computer principale si riflette sulla pagina remota, e viceversa.

---

## 11.4 Cosa si controlla da remoto

Il Controllo Remoto è deliberatamente essenziale. Da remoto puoi:

- **Avviare** una clip della colonna Musica.
- **Fermare** una clip della colonna Musica.
- Eseguire uno **Stop All**.

Sono le uniche azioni ammesse. Il resto della regia (le altre colonne, il pad FX, l'editor, le impostazioni) resta sul computer principale. È una scelta di sicurezza: il telecomando serve a gestire il flusso musicale a distanza, non a sostituire la postazione di regia.

---

## 11.5 Sicurezza e limiti

- **PIN obbligatorio.** Nessun dispositivo può inviare comandi senza aver superato la verifica del PIN a sei cifre.
- **Protezione dai tentativi.** I tentativi di inserimento del PIN sono limitati nel tempo: dopo alcuni tentativi falliti ravvicinati, l'accesso da quell'apparecchio viene temporaneamente bloccato.
- **Comandi su lista bianca.** Il server accetta soltanto i tre comandi previsti (avvia, ferma, Stop All): qualsiasi altra richiesta viene ignorata.
- **Solo rete locale.** Il server è pensato per la rete dello studio. Se la tua rete Wi-Fi è aperta o condivisa, valuta con attenzione chi può raggiungerla.
- **Nessuna persistenza.** PIN e stato di attivazione non vengono salvati: a ogni riavvio riparti da una configurazione pulita.

> **Nota.** Trattandosi di una funzione in Beta, l'insieme dei comandi disponibili potrà ampliarsi nelle versioni future. Per ora è tarata sul caso d'uso più frequente: gestire la musica a distanza durante la conduzione.
