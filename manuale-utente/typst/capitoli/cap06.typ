#import "../lib/manuale-template.typ": *

= Il motore di mixaggio

Il problema di fondo della regia radiofonica manuale è la
moltiplicazione delle azioni simultanee: avviare un brano, abbassare la
musica, parlare al microfono, preparare la clip successiva, tenere
d'occhio l'orologio. Ogni operazione in più è un'opportunità di errore,
in un contesto in cui l'errore è pubblico e immediato.

Il motore di mixaggio di Runtime Live Machine Pro elimina la maggior
parte di queste azioni intermedie delegandole al software. Non si tratta
di automazione nel senso di «il software fa le cose al posto tuo senza
che tu lo sappia», ma di automazione delle regole che tu stesso
definiresti se avessi abbastanza mani per eseguirle tutte.

== 6.1 La gerarchia audio
Il sistema di mixaggio automatico si basa su una #strong[gerarchia di
priorità] tra i tipi di clip. Il modo più immediato per capirla è
immaginarla come una scala di «diritto di parola».

#strong[Voci / Preregistrazioni --- priorità assoluta.] Quando una clip
voce è in riproduzione, resta al proprio volume nominale e tutto il
resto si abbassa. Nessun altro segnale può sovrascrivere questa regola.

#strong[Canzoni dell'episodio.] Cedono spazio alle Voci, ma comandano
sulle basi degli Assets. Quando entra una canzone, le basi musicali
degli Assets si azzerano (non si fermano: continuano a girare in
silenzio, pronte per il ritorno). È la Music Dominance, descritta più
avanti.

#strong[Show Assets, Jingle e Promo --- le basi di servizio.] Vengono
abbassati dalle Voci e silenziati dalle Canzoni.

#strong[Effetti del pad FX.] Gli effetti sonori restano fuori dalla
gerarchia: suonano al proprio volume, si sovrappongono a ciò che è in
onda e non vengono silenziati. C'è una sola cortesia verso il parlato:
quando una voce è attiva, gli effetti scendono a metà volume (50%) per
non coprirla, poi risalgono da soli.

== 6.2 Ducking automatico
Il #strong[ducking] è il meccanismo con cui un segnale viene abbassato
quando un segnale di priorità superiore entra in riproduzione.

Il caso più comune: una canzone sta suonando in piena dinamica; lanci
un'intervista preregistrata dalla colonna Voci. In quel momento RLMP
porta la canzone a circa il #strong[20% del volume] (una riduzione di
circa 14 dB) con una dissolvenza morbida di mezzo secondo, così che la
voce occupi lo spazio sonoro in modo intellegibile. Appena l'intervista
termina, la canzone risale al volume originale con un fade in
altrettanto fluido.

L'operatore non tocca nulla. Il gesto eseguito è stato un solo click:
avviare l'intervista. L'entità della riduzione e la sua rapidità sono
regolabili nelle Impostazioni (Capitolo 13).

== 6.3 Music Dominance: gestione intelligente delle basi
Un errore sonoro classico è il momento in cui una canzone e una base
musicale (#emph[bed]) si sovrappongono: due elementi ritmici che si
scontrano, due kick drum che non coincidono, il risultato è confuso.

RLMP gestisce questo scenario con la #strong[Music Dominance].

#strong[Lo scenario tipo.] Una base sta girando in loop nella colonna
Assets, sotto la voce del conduttore. Il conduttore lancia un brano
dalla colonna Canzoni.

#strong[Cosa fa RLMP.] Non ferma la base, perché fermarla richiederebbe
poi di riavviarla a mano. La porta invece silenziosamente a
#strong[volume zero], mantenendola in riproduzione «in fantasma»: il
file continua a scorrere, il loop continua, ma non si sente nulla.

#strong[Il risultato sonoro.] Si sente solo la canzone. La base è
scomparsa senza che l'operatore abbia fatto nulla.

#strong[Il ritorno.] Quando la canzone termina, la base riemerge con un
fade in automatico, riprendendo dal punto in cui si trovava nel loop. Il
flusso (base → canzone → base) avviene senza un singolo click
aggiuntivo.

== 6.4 Emergere sopra la gerarchia: effetti e voci
Se un elemento deve emergere sopra ciò che è in onda, le vie sono due, e
dipendono da dove metti la clip.

Il #strong[pad FX]: l'effetto suona a volume pieno sopra la musica e non
ferma nulla --- ideale per stinger e jingle brevi che devono «bucare» il
mix senza toccarlo.

La colonna #strong[Voci]: la clip resta al volume nominale e tutto il
resto si abbassa con il ducking --- ideale per lo #emph[station ID]
vocale («Stai ascoltando…») che deve sentirsi chiaramente mentre la base
sotto continua a girare. Per un ingresso più curato, abbina un fade in
breve (300--500 ms): l'attacco sarà morbido, non brusco.

Nelle versioni precedenti esisteva un comportamento per-clip chiamato
«Stacco» che rovesciava la gerarchia. È stato rimosso: la posizione
nella gerarchia dipende soltanto dalla colonna in cui la clip si trova,
senza eccezioni nascoste nelle proprietà.

== 6.5 Omologazione del volume (loudness)
Clip di provenienza diversa arrivano quasi sempre con livelli diversi:
una sigla masterizzata a dovere, un vocale telefonico registrato piano,
un brano scaricato a un volume tutto suo. Per evitare continui
aggiustamenti manuali del Gain, RLMP applica di default
un'#strong[omologazione del volume] basata sullo standard di loudness
EBU R128, con un obiettivo di #strong[−16 LUFS].

In pratica, il software valuta la sonorità percepita di ciascuna clip e
la avvicina a un riferimento comune, così che canzoni, voci e basi
partano già su un piano coerente. La funzione è attiva per impostazione
predefinita e il valore obiettivo è regolabile nelle Impostazioni →
Master Chain.

== 6.6 Master Chain: la catena di processori sul master bus
#figure(image("../screenshots/impostazioni-master-chain.png", alt: "Figura 6.1 — La Master Chain: omologazione del volume (−16 LUFS), HPF a 30 Hz, glue multibanda e limiter brickwall."),
  caption: [
    Figura 6.1 --- La Master Chain: omologazione del volume (−16 LUFS),
    HPF a 30 Hz, glue multibanda e limiter brickwall.
  ]
)

Il segnale combinato di tutte le clip in riproduzione, dopo il Master
Volume, attraversa una #strong[catena di processori] sul bus master
prima di raggiungere la periferica di uscita. La catena è attiva per
impostazione predefinita e progettata per un suono broadcast-grade senza
richiedere configurazione avanzata.

Comprende tre stadi in serie.

#strong[High-Pass Filter (HPF) a 30 Hz.] Elimina le frequenze sub-bass
inutili che consumano headroom e possono sporcare i sistemi di
diffusione, con una pendenza morbida. La frequenza di taglio è
regolabile (20--200 Hz). Quando disattivato, lo stadio diventa
completamente trasparente.

#strong[Glue multibanda.] Non un singolo compressore, ma tre compressori
«gentili» che lavorano in parallelo su tre bande di frequenza (bassi,
medi, alti), separate da un crossover. Ogni banda ha soglie e rapporti
calibrati per «incollare» il mix senza schiacciarlo, e contenere la
varianza dinamica tra clip di livello diverso. Lo stile è selezionabile
tra alcuni preset (Neutro, Rock, Jazz, Elettronico); il preset
predefinito è Neutro.

#strong[Limiter a brickwall.] Soglia a −1 dBFS, con rapporto di
limitazione elevato e reazione rapidissima. Garantisce che il segnale
non superi mai il livello massimo consentito, prevenendo la distorsione
digitale (clipping) qualunque cosa accada a monte.

L'intera catena, e ogni singolo stadio, è configurabile e disattivabile
dalle Impostazioni → Master Chain, dove trovi anche un pulsante per
ripristinare i valori predefiniti. In un contesto dove il segnale viene
già processato da un mixer hardware o da una catena esterna, puoi
disattivarla per evitare processazioni doppie.
