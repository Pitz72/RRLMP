# Chapitre 4 — Le workflow de base : charger et diffuser

---

Le cycle opérationnel fondamental de Runtime Live Machine Pro se déroule en trois phases : importer les fichiers audio, les organiser dans la grille, les diffuser pendant le direct. Ce chapitre décrit chaque phase avec la précision nécessaire pour travailler en toute sûreté, même sous pression.

---

## 4.1 Importer les fichiers audio

RLMP ne dispose ni d'un navigateur interne ni d'une bibliothèque centralisée. L'importation se fait par **glisser-déposer** direct depuis le gestionnaire de fichiers du système d'exploitation (l'Explorateur sous Windows, le Finder sous macOS, Nautilus ou équivalents sous Linux). Sinon, depuis le menu FILE, vous pouvez importer une playlist **M3U** et la transformer en séquence de clips.

### Le geste de base

1. Ouvrez le dossier de votre ordinateur où se trouvent les fichiers audio.
2. Sélectionnez un ou plusieurs fichiers. Pour en sélectionner plusieurs : `Ctrl+clic` pour une sélection discontinue, `Shift+clic` pour une sélection continue.
3. Faites glisser les fichiers sélectionnés au-dessus de l'une des colonnes de la grille et relâchez. Pour les effets sonores, glissez-les directement sur le pad FX (Chapitre 7).

Chaque fichier génère une carte dans la colonne de destination. Si vous faites glisser plusieurs fichiers en même temps, les cartes sont créées dans l'ordre où les fichiers apparaissent dans le gestionnaire de fichiers, de haut en bas.

**Indicateur d'insertion.** Pendant le glissement, une ligne bleue lumineuse court le long de la colonne, indiquant la position exacte où les cartes seront insérées. Vous pouvez insérer de nouveaux clips en haut, en bas ou à une position intermédiaire avec précision.

### Formats pris en charge

Le moteur FFmpeg intégré garantit la compatibilité avec un large éventail de formats audio :

| Format | Extension | Notes |
|---|---|---|
| MP3 | `.mp3` | Tous les bitrates |
| WAV | `.wav` | PCM non compressé, toute profondeur de bits |
| FLAC | `.flac` | Lossless, tout sample rate |
| AAC / M4A | `.aac`, `.m4a` | Inclut les fichiers d'iTunes/Apple Music |
| OGG Vorbis | `.ogg` | |
| Opus | `.opus` | |
| WMA | `.wma` | Windows Media Audio |
| WebM / MP4 | `.webm`, `.mp4` | Pistes audio contenues dans ces conteneurs |

**Une note sur les performances.** Le protocole de streaming `media://` garantit que les fichiers audio ne sont pas chargés en mémoire vive au moment de l'importation. Un fichier WAV non compressé de 2 GB se comporte exactement comme un MP3 de 5 MB : le chargement est instantané et l'impact sur la mémoire système est négligeable. Les ressources du CPU ne sont sollicitées que pendant le décodage actif, c'est-à-dire pendant la lecture.

### Le chemin des fichiers

RLMP mémorise le **chemin absolu** du fichier sur le disque, non une copie du fichier lui-même. Si vous déplacez, renommez ou supprimez le fichier original, la carte correspondante devient rouge et n'est plus lisible. Pour travailler sur plusieurs ordinateurs ou créer des archives portables, utilisez la fonction **Export Package** décrite au Chapitre 10.

---

## 4.2 Lecture : lancer et arrêter les clips

### Lancer un clip

Un **clic gauche** sur la carte suffit à démarrer la lecture. Le retour est immédiat : la carte s'allume dans le vert d'état actif, le minuteur passe en compte à rebours et les VU meter de l'en-tête reflètent le signal de sortie.

Si une touche du clavier a été attribuée au clip (voir Chapitre 8), cette touche fonctionne comme alternative au clic — utile quand vous opérez sur une autre partie de l'interface et ne voulez pas déplacer la souris.

### Arrêter un clip

**Clic sur le clip actif** — le clip entre en phase de **fondu de sortie** et s'arrête dans le temps configuré dans ses propriétés (voir Chapitre 5).

**Touche `Échap`** — arrête tous les clips actifs instantanément. C'est la commande d'urgence. Elle fonctionne quand RLMP est la fenêtre active, même pendant que vous saisissez du texte dans un champ.

**Bouton STOP ALL** dans l'en-tête — identique à `Échap`, accessible à la souris.

### La logique d'exclusion par colonne

Dans la plupart des colonnes, RLMP applique la règle **« un clip à la fois »** : si vous diffusez le *Morceau A* dans la colonne Musiques et cliquez sur le *Morceau B* de la même colonne, le *Morceau A* s'arrête (avec fondu de sortie) et le *Morceau B* démarre. Il n'est pas nécessaire d'arrêter manuellement le clip en cours avant d'en lancer un autre.

Les **effets du pad FX** sont l'exception principale : ils se superposent à tout, y compris à d'autres effets, et n'interrompent pas ce qui joue. Un applaudissement peut partir pendant qu'un morceau est en cours, sans en interrompre la lecture.

Les clips au comportement **Stacco** (configurable dans les propriétés, voir Chapitre 5) se superposent eux aussi sans arrêter les autres clips de la colonne, où qu'ils se trouvent.

---

## 4.3 Organiser la conduite

### Réorganiser les clips

Pendant la préparation de l'émission, ou même en cours d'émission, vous pouvez réorganiser l'ordre des clips à tout moment.

**Glissement interne.** Cliquez sur une carte, maintenez et faites-la glisser vers le haut ou vers le bas dans la même colonne. La ligne guide bleue indique la position d'insertion. Le clip s'insère à la nouvelle position sans interrompre les lectures en cours.

**Déplacement entre colonnes.** Vous pouvez faire glisser un clip d'une colonne à l'autre. Dans ce cas, le clip **hérite des règles de la colonne de destination** : une voix préenregistrée déplacée dans la colonne Musiques commencera à subir le ducking exactement comme un morceau musical.

Déplacer des clips entre colonnes est une opération puissante et volontaire. Utilisez cette fonction en connaissance de cause, surtout pendant le direct.

### Sélection multiple et suppression

Pour retirer plusieurs clips de la grille en une seule opération :

1. `Ctrl+clic` (Windows/Linux) ou `Cmd+clic` (macOS) sur chaque clip à sélectionner. La bordure devient bleue.
2. Appuyez sur `Suppr` ou `Delete`. Le logiciel demande confirmation si le nombre de clips sélectionnés dépasse un.

La suppression depuis la grille retire les clips du projet courant, non les fichiers audio du disque. En cas d'erreur, `Ctrl+Z` annule l'opération.

> **Conseil pratique.** Une fois le direct commencé, vider la colonne Pré-émission avec une sélection multiple et `Suppr` est le moyen le plus rapide de libérer de l'espace visuel dans l'interface et de passer en mode opérationnel.

---

## 4.4 Repères de structure : INTRO et OUTRO

Chaque clip peut avoir deux **marqueurs structurels** configurés dans l'éditeur de forme d'onde (Chapitre 5) :

- **Intro Marker** — le point où la mélodie principale du morceau entre effectivement, après l'introduction instrumentale. Utile pour savoir exactement quand commencer à parler par-dessus l'intro.
- **Outro Marker** — le point où commence la coda finale du morceau. Il signale le bon moment pour préparer la transition vers la piste suivante.

Quand la lecture d'un clip approche de ces points, un avis visuel apparaît sur la carte :

- **INTRO: −MM:SS** — compte à rebours jusqu'à l'Intro Marker.
- **OUTRO IN: −MM:SS** — compte à rebours jusqu'à l'Outro Marker, suivi de **🚨 OUTRO** quand la coda a commencé.

Ces avis ne s'affichent que si les marqueurs ont été configurés. Sur les clips sans marqueur, la carte n'affiche que le compte à rebours standard vers la fin du morceau.
