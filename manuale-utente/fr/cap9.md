# Chapitre 9 — Enregistrement de la session

---

L'enregistrement de la session fait passer Runtime Live Machine Pro d'un simple outil de playout à un véritable outil de production. Plus besoin d'un logiciel d'enregistrement séparé ou d'une chaîne de routage virtuelle : RLMP capture directement le **master mix post-traité**, c'est-à-dire tout ce qui sort de l'application, effets de la Master Chain compris, dans un fichier audio sur le disque.

---

## 9.1 Démarrer l'enregistrement

La commande d'enregistrement se trouve dans l'en-tête, repérable à son icône.

**Démarrage.**
Cliquez sur le bouton d'enregistrement. Un indicateur rouge et un compteur signalent que la capture est en cours ; l'enregistrement démarre aussitôt, et tout ce qui sort de l'application à partir de cet instant est capturé.

Aucun clip en lecture n'est nécessaire pour démarrer l'enregistrement : vous pouvez lancer la capture avant même le début de l'émission, pour ne rien perdre des premières secondes en cas de départ anticipé.

**Ce qui est enregistré.**
Le signal capturé est le **master après le limiter** : il inclut le mix de tous les clips en lecture et le traitement complet de la Master Chain (HPF, glue multibande, limiter) — exactement le signal qui atteint le périphérique audio de sortie.

**Le format interne.**
Pendant la capture, RLMP écrit un flux compressé Opus (en conteneur WebM) à 320 kbps, très léger sur le disque et transparent à l'écoute. L'enregistrement continu est plafonné, par sécurité, à environ **quatre heures** : au-delà, la capture s'arrête automatiquement pour ne pas saturer la mémoire.

**Charge système.**
La capture a lieu en aval du moteur audio, sans peser sur le Renderer : vous pouvez enregistrer des sessions de plusieurs heures sans vous soucier de la consommation de ressources.

---

## 9.2 Arrêter l'enregistrement et choisir le format

Un second clic sur le bouton arrête l'enregistrement et ouvre la **fenêtre d'exportation** : c'est là que vous choisissez le format final du fichier, la conversion du flux interne étant confiée à FFmpeg.

### Formats disponibles

| Format | Extension | Caractéristiques |
|---|---|---|
| **WAV** | `.wav` | Lossless non compressé. Qualité maximale, fichiers volumineux. Idéal pour l'archivage et la post-production. |
| **FLAC** | `.flac` | Lossless compressé. Même qualité que le WAV, dimensions réduites. Idéal pour l'archivage. |
| **MP3** | `.mp3` | Lossy. Bitrate sélectionnable. Idéal pour la distribution et le podcast. |
| **OGG** | `.ogg` | Lossy open-source. Bon rapport qualité/taille. |
| **WEBM** | `.webm` | Lossy, optimisé pour le web. Correspond au format interne de capture. |

### Options de qualité

Pour les formats lossless (WAV et FLAC), la **profondeur de bits** se choisit entre 16 bit (standard CD), 24 bit (standard professionnel broadcast, valeur par défaut) et 32 bit float, pour une précision maximale si l'enregistrement doit être masterisé par la suite.

Pour les formats lossy (MP3, OGG, WEBM), le **bitrate** se règle entre 128, 192, 256 et 320 kbps. Pour un podcast destiné à la distribution en ligne, comptez 192 kbps stéréo au minimum ; 256 kbps est aujourd'hui le standard pour une qualité dite « transparente ».

### Choix du chemin d'enregistrement

Dans la fenêtre d'exportation, choisissez le dossier de destination et le nom du fichier. Sans nom précisé, RLMP en génère un à partir de la date et de l'heure de la session. Une fois la conversion terminée, un toast de confirmation affiche le chemin du fichier enregistré.

---

## 9.3 Considérations pratiques

### Synchronisation avec l'émission

L'enregistrement capture tout le temps écoulé entre Start et Stop, silences compris : démarrer la capture 30 secondes avant le début effectif de l'émission, c'est retrouver ces 30 secondes dans le fichier final. Pour un résultat prêt à la distribution sans post-édition, démarrez l'enregistrement exactement au moment où commence l'émission.

### Enregistrement et sauvegarde simultanés

Le système d'autosave du projet (voir Chapitre 10) et l'enregistrement de la session fonctionnent indépendamment l'un de l'autre : vous pouvez enregistrer une émission pendant que l'autosave sauvegarde discrètement l'état du projet, sans que les deux opérations interfèrent.

### Format conseillé selon le contexte

**Podcast** — MP3 256 kbps stéréo ou FLAC 16 bit : le premier pour une distribution directe du fichier, le second si vous comptez encore le retoucher.

**Archivage historique** — WAV 24 bit ou FLAC 24 bit : des fichiers volumineux, mais toute la souplesse voulue pour d'éventuels remasters futurs.

**Radio / Streaming** — vérifiez les exigences de votre plateforme : la plupart acceptent le MP3 128–192 kbps, certaines demandent du WAV non compressé. RLMP couvre les formats les plus répandus, quel que soit le scénario.
