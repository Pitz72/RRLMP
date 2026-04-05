# CHAPITRE 3 : GESTION AUDIO (FLUX DE TRAVAIL DE BASE)

Maintenant que vous connaissez l'interface, il est temps de "charger la machine".
Dans ce chapitre, vous apprendrez comment importer des fichiers audio, contrôler la lecture et garder votre playlist organisée.

---

## 3.1 Importation (Glisser-Déposer)

Runtime Live Machine n'utilise pas de menus complexes "Fichier > Importer". Il est conçu pour travailler directement avec les dossiers de votre ordinateur.

### Comment charger les fichiers
1.  Ouvrez le dossier de votre ordinateur (Explorateur de fichiers sur Windows ou Finder sur Mac) où vous conservez vos fichiers audio.
2.  Cliquez sur le fichier désiré et, en maintenant le bouton enfoncé, **glissez-le** dans l'une des 5 colonnes du logiciel.
3.  Relâchez la souris.

Le clip apparaîtra instantanément comme une nouvelle Carte.

### Détails de l'Importation
*   **Chargement Multiple** : Vous pouvez sélectionner 10, 20 ou 50 fichiers simultanément depuis votre dossier et les glisser tous ensemble. Le logiciel créera une carte pour chacun d'eux en séquence.
*   **Formats Supportés** : Grâce au moteur natif, RLM supporte presque tous les formats audio standard : **MP3, WAV, AAC (m4a), OGG, FLAC**.
*   **Performance** : Peu importe si vous chargez un jingle de 2 secondes ou un DJ Set de 2 heures en format WAV non compressé. Le chargement est **instantané** et ne consomme pas la mémoire RAM de l'ordinateur, grâce à la technologie *Direct Disk Streaming*.

> **Note** : Le logiciel mémorise le "chemin" du fichier (ex. C:\Musique\Song.mp3). Si vous déplacez ou renommez le fichier original sur votre ordinateur, RLM ne pourra plus le trouver (la carte deviendra rouge/inactive). Pour éviter ce problème si vous changez de PC, utilisez la fonction "Export Package" (voir Chap. 7).

---

## 3.2 Lecture (Play & Stop)

Le système de lecture est optimisé pour éviter les erreurs en direct.

### Lancer un Clip (Play)
*   **Clic Gauche** : Cliquez une fois sur une carte pour la lancer.
*   **Feedback** : La bordure de la carte devient **Vert Lumineux**, l'icône "Play" pulse et le minuteur commence le compte à rebours.
*   **Barre d'Espace** : Si vous avez assigné une touche personnalisée au clip (voir Chap. 6), vous pouvez appuyer dessus pour le lancer sans utiliser la souris.

### Arrêter un Clip (Stop / Fade)
*   **Clic sur Clip Actif** : Si vous cliquez sur un clip qui joue déjà, celui-ci s'arrêtera.
    *   *Comportement Standard* : Le clip effectue un **Fade Out** (fondu) rapide au lieu de se couper brusquement, pour un effet plus professionnel. (Les temps de fondu sont personnalisables, voir Chap. 4).
*   **Stop All** : Pour tout arrêter immédiatement (sans fondu), appuyez sur la **Barre d'Espace** (si configurée), la touche **ESC** ou le bouton rouge **STOP ALL** en haut.

### La Règle de la Colonne (Exclusion)
Dans une régie radio, vous ne voulez généralement pas que deux chansons jouent simultanément l'une sur l'autre.
*   **Règle** : Si dans la colonne "CHANSONS" le *Morceau A* joue et que vous cliquez sur le *Morceau B* (dans la même colonne), le *Morceau A* s'arrête automatiquement (en fondu) et le *Morceau B* démarre.
*   **Exception** : Cette règle ne s'applique pas à la colonne "SFX" ou aux clips réglés comme "Interruption" (Stacco), qui peuvent jouer par-dessus les autres.

---

## 3.3 Organisation de la Playlist

Pendant une émission, les besoins changent. RLM vous permet de réorganiser la grille à la volée.

### Déplacer les Clips (Réorganisation)
Vous avez chargé la playlist mais décidez de changer l'ordre des morceaux ?
*   Cliquez sur un clip et, en maintenant le bouton enfoncé, **glissez-le** vers le haut ou le bas. Une ligne guide vous montrera où il atterrira.
*   **Déplacement entre Colonnes** : Vous pouvez glisser un clip d'une colonne à l'autre (ex. du "Pré-Show" à la colonne "Musique").
    *   *Attention* : Quand vous déplacez un clip, celui-ci **hérite des règles de la nouvelle colonne**. Si vous déplacez un jingle dans la colonne Musique, il commencera à se comporter comme une chanson (il subira le ducking des voix, etc.).

### Sélection Multiple et Suppression
Pour faire le ménage rapidement :
1.  **Sélection Unique** : Ctrl + Clic (Windows) ou Cmd + Clic (Mac) sur un clip le sélectionne (bordure Bleue) sans le faire jouer.
2.  **Sélection Multiple** : Maintenez Ctrl et cliquez sur différents clips pour tous les mettre en évidence.
3.  **Suppression** : Appuyez sur la touche SUPPR (ou Del / Backspace) du clavier.
    *   Le logiciel vous demandera confirmation si vous supprimez beaucoup de clips, pour éviter les erreurs accidentelles.

> **Conseil Pro** : Utilisez la sélection multiple pour vider rapidement la colonne "Pré-Show" une fois le direct proprement dit commencé, pour avoir une interface plus propre.
