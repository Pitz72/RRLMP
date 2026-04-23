# Capitolo 6 — Il motore di mixaggio

---

Il problema di fondo della regia radiofonica manuale è la moltiplicazione delle azioni simultanee: avviare un brano, abbassare la musica, parlare al microfono, preparare la clip successiva, tenere d'occhio l'orologio. Ogni operazione in più è un'opportunità di errore in un contesto in cui l'errore è pubblico e immediato.

Il motore di mixaggio di Runtime Live Machine Pro elimina la maggior parte di queste azioni intermedie delegandole al software. Non è automazione nel senso di «il software fa le cose al posto tuo senza che tu lo sappia»: è automazione delle regole che tu stesso definiresti se avessi abbastanza mani per eseguirle tutte.

---

## 6.1 La gerarchia audio

Il sistema di mixaggio automatico si basa su una **gerarchia di priorità** tra le colonne. Ogni colonna occupa un livello preciso nella scala di importanza, e il software applica questa scala in modo coerente durante l'intera sessione.

Il modo più immediato per capire questa gerarchia è immaginarla come una scala discendente di «diritto di parola»:

**Livello 1 — Voci / Preregistrazioni (Arancione)**
La priorità assoluta. Quando una clip voce è in riproduzione, tutto il resto si abbassa automaticamente a un livello di sottofondo. Nessun altro segnale nel sistema può sovrascrivere questa regola.

**Livello 2 — Canzoni dell'episodio (Rosso)**
Cedono spazio alle Voci, ma comandano sulle basi degli Assets. Quando entra una canzone, le basi musicali degli Assets si azzerano (non si fermano: continuano a girare in silenzio, pronte per il ritorno).

**Livello 3 — Show Assets (Verde)**
Le basi di sottofondo. Vengono abbassate sia dalle Voci che dalle Canzoni.

**Fuori dalla gerarchia — SFX / Cartwall (Grigio)**
Gli effetti sonori non partecipano al sistema di ducking. Suonano sempre al volume pieno, si sovrappongono a qualsiasi cosa stia succedendo nella griglia senza abbassare né essere abbassati. Questa è una scelta progettuale deliberata: un effetto sonoro che viene ducked da una voce perde metà del suo valore espressivo.

---

## 6.2 Ducking automatico

Il **ducking** è il meccanismo con cui un segnale audio viene automaticamente abbassato quando un segnale di priorità superiore entra in riproduzione.

Nella pratica radio, il caso più comune è il seguente: una canzone sta suonando in piena dinamica; il conduttore lancia un'intervista preregistrata dalla colonna Voci. In quel momento, RLMP abbassa la canzone a circa il 20% del volume originale (−14 dB) con una transizione in dissolvenza morbida, lasciando che la voce occupi lo spazio sonoro in modo intellegibile. Appena l'intervista termina, la canzone risale al volume originale con un fade in altrettanto fluido.

L'operatore non tocca nulla. Il gesto eseguito è stato un solo click: avviare l'intervista.

### Ducking microfono (Smart Mic)

Il sistema di ducking si estende anche al microfono fisico collegato al computer. Quando la funzione Smart Mic è attiva (vedi Capitolo 7), RLMP monitora in continuo il segnale in ingresso dal microfono: se rileva audio sopra la soglia del noise gate configurabile, applica il ducking esattamente come farebbe una clip della colonna Voci. Il conduttore non deve premere nessun pulsante: parla al microfono e la musica si abbassa da sola.

---

## 6.3 Music Dominance: gestione intelligente delle basi

Un errore sonoro classico nella produzione radio è il momento in cui una canzone e una base musicale (*bed*) si sovrappongono: due elementi ritmici che si scontrano, due kick drum che non coincidono, il risultato è confuso e non professionale.

RLMP gestisce questo scenario con la **Music Dominance**.

**Lo scenario tipo.** Una base musicale sta girando in loop nella colonna Assets, sotto la voce del conduttore. Il conduttore lancia un brano musicale dalla colonna Canzoni.

**Cosa fa RLMP.** Non ferma la base — fermarla richiederebbe poi di avviarla manualmente al termine della canzone. Invece, la porta silenziosamente a **volume zero**, mantenendola in riproduzione «in fantasma»: il file continua a scorrere, il loop continua, ma non si sente nulla.

**Il risultato sonoro.** Si sente solo la canzone. La base è scomparsa senza che l'operatore abbia fatto nulla.

**Il ritorno.** Quando la canzone termina (o viene fermata), la base riemerge con un fade in automatico, riprendendo dal punto in cui si trovava nel loop. Il flusso risultante — base → canzone → base — avviene senza un singolo click aggiuntivo da parte dell'operatore.

---

## 6.4 Stacchi: l'eccezione alla regola

Il comportamento **Stacco** (configurabile nelle proprietà di ogni clip, vedi Capitolo 5) consente a una clip di sovrapporsi alle altre senza triggering il sistema di ducking o Music Dominance.

Una clip con comportamento Stacco, avviata nella colonna Assets, non zittisce le altre basi in riproduzione: si affianca a esse, eventualmente abbassandole di qualche dB per fare spazio, ma senza interromperle.

L'uso tipico è lo *station ID* vocale («Stai ascoltando…»): deve sentirsi chiaramente, ma la base sotto deve continuare a girare. Configurando la clip come Stacco, ottieni esattamente questo effetto.

**Combinazione con Fade In.** Per un risultato più curato, abbina il comportamento Stacco a un fade in breve (300–500 ms) sulla clip dello station ID: l'ingresso sarà morbido, non brusco.

---

## 6.5 Master Chain: la catena di processori sul master bus

Il segnale combinato di tutte le clip in riproduzione, dopo il Master Volume, attraversa una **catena di processori audio** sul bus master prima di raggiungere la periferica di uscita. Questa catena è attiva per impostazione predefinita e progettata per garantire un suono broadcast-grade senza richiedere configurazione avanzata.

La catena comprende tre stadi in serie:

**High-Pass Filter (HPF) a 80 Hz.**
Elimina le frequenze sub-bass inutili che consumano headroom e possono causare distorsioni sui sistemi di diffusione. Le voci e gli strumenti non contengono informazioni udibili sotto gli 80 Hz in un contesto broadcast.

**Compressore dinamico.**
Soglia: −18 dBFS. Rapporto di compressione: 4:1. Attenuazione dei picchi eccessivi e contenimento della varianza dinamica tra clip di livello diverso. Un'intervista telefonica registrata a basso volume e una sigla professionale producono, dopo il compressore, un livello di uscita più omogeneo.

**Limiter a brickwall.**
Soglia: −1 dBFS. Garantisce che il segnale non superi mai il livello massimo consentito, prevenendo la distorsione digitale (clipping) indipendentemente dai picchi nei segnali sorgente.

La catena è configurabile e disattivabile dalle impostazioni generali (icona Ingranaggio → *Master Chain*). In un contesto dove il segnale viene già processato da un mixer hardware o da un chain esterno, puoi disattivarla per evitare processazioni doppie.

