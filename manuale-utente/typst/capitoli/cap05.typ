#import "../lib/manuale-template.typ": *

= Proprietà della clip e Waveform Editor
<capitolo-5-proprietà-della-clip-e-waveform-editor>

Ogni file audio ha una sua storia prima di arrivare in griglia:
registrazioni con secondi di silenzio iniziale, brani con code
interminabili, interviste con il livello troppo basso rispetto al resto
dello show. Invece di ricorrere a un editor audio esterno ogni volta che
un file non è «pronto per la messa in onda», RLMP mette a disposizione
un pannello di configurazione per ciascuna clip e un editor visivo della
forma d'onda con funzionalità di taglio e marcatura.

Tutte le modifiche apportate tramite questi strumenti sono #strong[non
distruttive]: il file originale sul disco rimane invariato. RLMP
memorizza le impostazioni nel file di progetto `.lmp` e le applica al
volo durante la riproduzione.

Per aprire le impostazioni di una clip, fai #strong[click con il tasto
destro] sulla card.

== 5.1 Proprietà di base
<proprietà-di-base>
#figure(image("../screenshots/impostazioni-clip.png", alt: "Figura 5.1 — Le impostazioni della clip: nome, etichetta di colore, Volume Gain, comportamento, Next Action e assegnazione dei tasti."),
  caption: [
    Figura 5.1 --- Le impostazioni della clip: nome, etichetta di
    colore, Volume Gain, comportamento, Next Action e assegnazione dei
    tasti.
  ]
)

=== Nome e apparenza
#strong[Nome clip.] Puoi assegnare un nome personalizzato alla clip,
indipendente dal nome del file originale. Il nome viene visualizzato
sulla card nella griglia. Usa nomi descrittivi e operativamente utili
durante la diretta: «SIGLA DI APERTURA» è più leggibile di
`sigla_rev3_finale_def.mp3` quando hai tre secondi per trovare la clip
giusta.

#strong[Colore personalizzato.] Per impostazione predefinita, la clip
eredita il colore della colonna di appartenenza. Qui puoi assegnare un
colore specifico per farla risaltare visivamente. Utile per marcare clip
critiche (es. la sigla di chiusura) o per differenziare gruppi tematici
all'interno della stessa colonna.

=== Volume (Gain)
Lo slider di guadagno va da 0% a 150% e agisce come un pre-fader sulla
clip specifica, prima del Master Volume globale.

Il caso d'uso più comune è l'allineamento dei livelli: se hai un vocale
registrato a bassa intensità (es. un messaggio WhatsApp o una
registrazione telefonica), puoi portarlo oltre il 100% per avvicinarlo
al volume delle altre tracce. Viceversa, puoi abbassare una clip
particolarmente «calda» senza toccare il Master Volume.

== 5.2 L'editor della forma d'onda
#figure(image("../screenshots/waveform-editor.png", alt: "Figura 5.2 — L’editor della forma d’onda: maniglie di Trim, marker di Intro e Outro, Auto-Trim, Smart Cues e dissolvenze."),
  caption: [
    Figura 5.2 --- L'editor della forma d'onda: maniglie di Trim, marker
    di Intro e Outro, Auto-Trim, Smart Cues e dissolvenze.
  ]
)

L'editor visivo è la funzione più potente del pannello di
configurazione. Occupa la zona centrale del pannello e mostra la
rappresentazione grafica dell'audio dell'intera clip.

=== Navigazione nell'editor
#strong[Zoom orizzontale.] Puoi ingrandire la vista della forma d'onda
da 1× (vista completa) fino a 8×, con passi intermedi (1×, 2×, 3×, 4×,
6×, 8×), tramite lo slider di zoom o la rotella del mouse sopra
l'editor. A zoom elevato, la vista scorre seguendo la posizione
corrente.

#strong[Ruler adattivo.] L'asse temporale nella parte superiore
dell'editor si adatta automaticamente allo zoom: a vista completa mostra
riferimenti radi, a zoom massimo li infittisce fino ai secondi.

#strong[Playhead.] Durante la riproduzione di anteprima, un indicatore
verticale bianco scorre in tempo reale lungo la forma d'onda, mostrando
la posizione corrente. Un click sulla forma d'onda sposta la
riproduzione in quel punto.

=== Le quattro maniglie
Sull'editor sono presenti quattro #strong[handle] trascinabili, ciascuno
con una funzione e un colore precisi:

#strong[Trim Start (maniglia rossa, sinistra).] Definisce il punto di
inizio effettivo della clip. Tutto ciò che si trova a sinistra viene
saltato durante la riproduzione. Trascinala verso destra per eliminare i
silenzi o le parti indesiderate dall'inizio.

#strong[Trim End (maniglia rossa, destra).] Definisce il punto di fine
effettivo. Tutto ciò che si trova a destra viene ignorato. Trascinala
verso sinistra per accorciare la coda. Trim Start e Trim End non possono
sovrapporsi.

#strong[Intro Marker (maniglia ciano).] Segna il punto strutturale in
cui la melodia principale entra nel brano, dopo l'eventuale
introduzione. Una volta impostato, sulla card in riproduzione comparirà
il conto alla rovescia #strong[INTRO: −MM:SS].

#strong[Outro Marker (maniglia arancione).] Segna il punto in cui inizia
la coda del brano, tipicamente il momento in cui iniziare a parlare per
riempire la transizione. Sulla card comparirà il conto alla rovescia
#strong[OUTRO IN: −MM:SS]. Se il valore risulta incoerente con il trim o
con la durata, il software lo disattiva e ti avvisa.

Oltre al trascinamento, quattro pulsanti #emph[Set] impostano ciascuna
maniglia alla posizione corrente del playhead, per una marcatura al volo
durante l'ascolto. I valori restano modificabili con precisione nei
rispettivi campi.

=== Auto-Trim (Bacchetta magica)
Il pulsante con l'icona della #strong[bacchetta magica] avvia il
rilevamento automatico del silenzio tramite FFmpeg. La soglia non è
fissa: il software stima prima il livello medio del file e imposta la
soglia di silenzio circa 25 dB sotto quel livello (entro un intervallo
di sicurezza compreso tra −55 e −20 dB; in mancanza di stima, ripiega su
−40 dB). Il Trim Start e il Trim End vengono così impostati
automaticamente, eliminando silenzi iniziali e code mute senza
intervento manuale.

Questa funzione è particolarmente utile per le registrazioni vocali non
elaborate: telefonate, messaggi audio, interviste registrate su
dispositivi mobili. Applicare l'Auto-Trim all'intera colonna Voci prima
di uno show richiede meno di un minuto e migliora la pulizia delle
transizioni.

#nota[
L'analisi avviene nel Main Process tramite
FFmpeg, senza caricare il file in memoria nel Renderer. Su file di
grandi dimensioni, il tempo di analisi resta nell'ordine di pochi
secondi.
]

=== Smart Cues (rilevamento automatico dei marker)
Accanto all'Auto-Trim, la funzione di #strong[Smart Cues] propone
automaticamente i marker di Intro e Outro. Usando una soglia più
aggressiva, individua il punto in cui l'audio raggiunge la piena energia
(Intro) e quello in cui inizia la dissolvenza finale (Outro),
posizionando i due marker senza doverli cercare a orecchio.

=== Anteprima della transizione
Se esiste una clip #strong[successiva] nella stessa colonna, il pulsante
#strong[«Test →»] riproduce gli ultimi secondi della clip corrente e
lascia scattare la transizione verso la successiva, direttamente
nell'editor. Durante l'anteprima un pulsante #emph[Stop] interrompe la
prova.

== 5.3 Comportamenti e automazione
=== Behavior (modalità di sovrapposizione)
<behavior-modalità-di-sovrapposizione>
#strong[Normal] --- comportamento predefinito. Quando questa clip viene
avviata, interrompe qualsiasi altra clip in riproduzione nella stessa
colonna (con fade out). È il comportamento corretto per canzoni e basi:
una canzone esclude le altre.

#strong[Stacco (Jingle)] --- la clip viene avviata senza interrompere le
altre. Ha priorità alta: silenzia gli altri asset della colonna e
abbassa la musica, ma non ferma nulla. Il caso d'uso tipico è uno
#emph[station ID] («Stai ascoltando…») che deve «cavalcare» l'intro di
un brano, o un jingle breve sopra una base in loop.

=== Next Action (automazione alla fine)
Definisce cosa accade quando la clip raggiunge il punto di Trim End.

#strong[Stop] --- comportamento predefinito per Canzoni, Voci e Assets.
La clip termina e si ferma.

#strong[Play Next] --- quando la clip si avvicina alla fine, avvia
automaticamente la clip successiva nella colonna con la transizione
configurata. Il badge #strong[NEXT] appare sulla card. È il
comportamento predefinito della colonna Pre-Show e crea di fatto una
playlist automatica: puoi configurarlo su più clip consecutive per
costruire blocchi che scorrono senza interruzioni.

La riproduzione in #strong[loop] è un'opzione a sé: quando è attiva, la
clip ricomincia dall'inizio (dal Trim Start) senza soluzione di
continuità, e sulla card compare il badge #strong[LOOP]. Usala per basi
musicali, ambienti sonori o sigle di sottofondo che devono girare finché
non vengono fermate esplicitamente. Le modalità di transizione ---
Crossfade, Segue, Gapless --- sono descritte nel Capitolo 13.

== 5.4 Dissolvenze (Fade In e Fade Out)
Il pannello consente di impostare, per la singola clip, la durata delle
dissolvenze in ingresso e in uscita. I valori vanno da 0 a 60.000
millisecondi (60 secondi) e la curva applicata è lineare.

#strong[Fade In.] Il tempo che il volume impiega ad arrivare al livello
massimo dall'avvio. Un valore di 2000 ms produce una salita graduale di
due secondi. Usalo sulle basi musicali che devono emergere dolcemente;
mantienilo a 0 per le voci e gli effetti che devono essere uditi
immediatamente.

#strong[Fade Out.] Il tempo di dissolvenza alla chiusura --- sia quando
si clicca su una clip attiva, sia nelle transizioni. Valori tipici:
2000--3000 ms per le canzoni, 500--1000 ms per le basi, 0 ms per gli
stacchi secchi.

Un fade out a 0 ms produce una chiusura immediata («hard cut»). Su un
brano musicale in diretta può essere percepito come un errore tecnico:
valuta con attenzione quando è appropriato.

== 5.5 Assegnazione controlli
Ogni clip può essere lanciata anche da un tasto della tastiera o da un
controller MIDI.

#strong[Trigger Keybind.] Il tasto della tastiera assegnato alla clip.
Puoi impostarlo dal campo dedicato nelle impostazioni della clip (clicca
e premi il tasto desiderato) oppure dalla finestra #strong[Keybinds]
raggiungibile dal menu Strumenti. Il badge corrispondente compare sulla
card. Se il tasto è già assegnato a un'altra clip, il software segnala
il conflitto prima di sovrascrivere.

#strong[MIDI Bind.] La nota MIDI assegnata (es. `NOTE:60`).
L'assegnazione avviene tramite la modalità #strong[MIDI Learn] (vedi
Capitolo 8), non digitando il numero a mano.

I binding delle clip sono salvati nel file di progetto: portando il
progetto su un altro computer con lo stesso controller MIDI, le
mappature funzioneranno senza riconfigurazione.
