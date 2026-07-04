# Chapitre 9 — Enregistrement de la session

---

L'enregistrement de la session transforme Runtime Live Machine Pro d'outil de playout en outil de production complète. Au lieu d'exiger un logiciel d'enregistrement séparé ou une chaîne de routage virtuelle, RLMP capture directement le **master mix post-traité**, c'est-à-dire tout ce qui sort de l'application, effets de la Master Chain compris, dans un fichier audio sur le disque.

---

## 9.1 Démarrer l'enregistrement

La commande d'enregistrement se trouve dans l'en-tête, identifiée par l'icône d'enregistrement.

**Démarrage.**
Cliquez sur le bouton d'enregistrement. Un indicateur rouge et un compteur montrent que la capture est en cours. L'enregistrement démarre immédiatement : tout ce qui sort de l'application à partir de cet instant est capturé.

Il n'est pas nécessaire d'avoir des clips en lecture pour démarrer l'enregistrement : vous pouvez lancer la capture en avance sur le début de l'émission, pour ne pas perdre les premières secondes en cas de départ anticipé.

**Ce qui est enregistré.**
Le signal capturé est le **master après le limiter** : il inclut le mix de tous les clips en lecture et le traitement de toute la Master Chain (HPF, glue multibande, limiter). C'est exactement le signal qui atteint le périphérique audio de sortie.

**Le format interne.**
Pendant la capture, RLMP écrit un flux compressé Opus (en conteneur WebM) à 320 kbps : très léger sur le disque et transparent à l'écoute. L'enregistrement continu a une limite de sécurité d'environ **quatre heures** ; au-delà de cette durée, la capture s'arrête automatiquement pour ne pas saturer la mémoire.

**Charge système.**
La capture se fait en aval du moteur audio, sans peser sur le Renderer. Vous pouvez enregistrer des sessions de plusieurs heures sans vous soucier de la consommation de ressources.

---

## 9.2 Arrêter l'enregistrement et choisir le format

Quand vous cliquez de nouveau sur le bouton pour arrêter l'enregistrement, la **fenêtre d'exportation** s'ouvre. C'est le moment où vous choisissez dans quel format enregistrer le fichier : la conversion du flux interne vers le format final est confiée à FFmpeg.

### Formats disponibles

| Format | Extension | Caractéristiques |
|---|---|---|
| **WAV** | `.wav` | Lossless non compressé. Qualité maximale, fichiers volumineux. Idéal pour l'archivage et la post-production. |
| **FLAC** | `.flac` | Lossless compressé. Même qualité que le WAV, dimensions réduites. Idéal pour l'archivage. |
| **MP3** | `.mp3` | Lossy. Bitrate sélectionnable. Idéal pour la distribution et le podcast. |
| **OGG** | `.ogg` | Lossy open-source. Bon rapport qualité/taille. |
| **WEBM** | `.webm` | Lossy, optimisé pour le web. Correspond au format interne de capture. |

### Options de qualité

Pour les formats lossless (WAV et FLAC), vous pouvez sélectionner la **profondeur de bits** : 16 bit (standard CD), 24 bit (standard professionnel broadcast, valeur par défaut) ou 32 bit float (précision maximale, si l'enregistrement sera masterisé par la suite).

Pour les formats lossy (MP3, OGG, WEBM), vous pouvez sélectionner le **bitrate** entre 128, 192, 256 et 320 kbps. Pour un podcast destiné à la distribution en ligne, 192 kbps stéréo est le minimum conseillé ; 256 kbps est le standard actuel pour la qualité « transparente ».

### Choix du chemin d'enregistrement

Dans la fenêtre d'exportation, choisissez le dossier de destination et le nom du fichier. Si vous ne précisez pas de nom, RLMP en génère un basé sur la date et l'heure de la session. À la fin de la conversion, un toast de confirmation affiche le chemin du fichier enregistré.

---

## 9.3 Considérations pratiques

### Synchronisation avec l'émission

L'enregistrement capture tout le temps écoulé entre Start et Stop, silences compris. Si vous avez démarré la capture 30 secondes avant le début effectif de l'émission, le fichier résultant inclura ces 30 secondes initiales. Pour un résultat prêt à la distribution sans post-édition, démarrez l'enregistrement exactement au moment où commence l'émission.

### Enregistrement et sauvegarde simultanés

Le système d'autosave du projet (voir Chapitre 10) et l'enregistrement de la session fonctionnent de façon indépendante. Vous pouvez enregistrer une émission pendant que l'autosave enregistre en silence l'état du projet : les deux opérations n'interfèrent pas.

### Format conseillé selon le contexte

**Podcast** — MP3 256 kbps stéréo ou FLAC 16 bit. Le premier si vous distribuez directement le fichier, le second si vous passerez par un éditeur.

**Archivage historique** — WAV 24 bit ou FLAC 24 bit. Dimensions généreuses, souplesse maximale pour d'éventuels remasters futurs.

**Radio / Streaming** — vérifiez les exigences de votre plateforme. La plupart acceptent le MP3 128–192 kbps ; certaines demandent du WAV non compressé. RLMP exporte dans les formats les plus répandus pour couvrir chaque scénario.
