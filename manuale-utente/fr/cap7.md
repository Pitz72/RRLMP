# CHAPITRE 7 : GESTION DE PROJETS ET SÉCURITÉ

Configurer une émission prend du temps : charger les clips, régler les volumes, définir les trims. Perdre ce travail serait désastreux.
Runtime Live Machine Pro utilise un système de sauvegarde à plusieurs niveaux pour garantir que vos données sont toujours en sécurité.

---

## 7.1 Le Fichier Projet (.lmp)

Tous les réglages de votre émission (positions des clips, couleurs, volumes, mappage MIDI, réglages de fondu) sont enregistrés dans un fichier unique avec l'extension **.lmp** (Live Machine Project).

> **Important** : Le fichier .lmp est un fichier texte (JSON) qui contient les "instructions" pour le logiciel. **Il ne contient PAS les fichiers audio physiques**. Il mémorise uniquement le *chemin* où se trouvent les fichiers sur votre ordinateur (ex. C:\Musique\Intro.mp3).

### Sauvegarder le travail
Dans la barre de commandes en haut, vous avez deux options distinctes :

1.  **?? Enregistrer (Sauvegarde Rapide)** :
    *   Cliquez sur l'icône Disquette.
    *   Écrase immédiatement le fichier .lmp actuellement ouvert.
    *   C'est l'action à faire régulièrement pendant que vous travaillez.
2.  **??? Enregistrer Sous** :
    *   Cliquez sur l'icône Disquette avec le Stylo.
    *   Ouvre toujours une boîte de dialogue pour créer un **nouveau fichier**.
    *   Utilisez-le pour créer différentes versions de l'émission (ex. "Podcast_Ep1.lmp", "Podcast_Ep2.lmp").

### Protection à la Fermeture (Modifications Non Enregistrées)
Le logiciel surveille constamment vos actions. Si vous avez fait des modifications non enregistrées (chargé un clip, changé un volume) et essayez de fermer le programme, RRLMP **bloquera la fermeture** et vous montrera un avertissement : *"Il y a des modifications non enregistrées"*.
Vous ne perdrez jamais votre travail à cause d'un clic accidentel sur le "X".

---

## 7.2 Auto-Backup (Le Filet de Sécurité)

On ne se souvient pas toujours de sauvegarder. Pour cette raison, RRLMP inclut un système d'**Auto-Backup** invisible qui travaille en arrière-plan.

*   **Fréquence** : Toutes les **5 minutes**, le logiciel sauvegarde automatiquement une copie de sécurité de l'état actuel.
*   **Où va la sauvegarde ?**
    *   Si vous travaillez sur un projet déjà sauvegardé (ex. MonShow.lmp), le logiciel crée un fichier "ombre" dans le même dossier appelé **MonShow.lmp.bak**.
*   **Comment la récupérer** :
    *   Si le PC s'éteint soudainement ou si le fichier principal est corrompu, allez dans le dossier du projet.
    *   Cherchez le fichier .bak.
    *   Renommez-le en enlevant le .bak (ou ouvrez-le directement avec RRLMP). Vous aurez récupéré le travail jusqu'aux 5 dernières minutes.

---

## 7.3 Collect & Save (Export Portable)

C'est la fonction fondamentale pour ceux qui travaillent sur plusieurs ordinateurs ou veulent archiver l'émission.
Puisque le fichier .lmp ne mémorise que les *liens* vers les fichiers audio, si vous copiez uniquement ce fichier sur un autre PC (ou une clé USB), le logiciel ne trouvera plus la musique (chemins rompus).

Pour déplacer l'émission, vous devez utiliser la fonction **Export Package**.

### Comment créer un Paquet Portable
1.  Cliquez sur l'icône **?? Export (Boîte)** dans la barre en haut.
2.  Le système vous demandera de sélectionner un dossier vide (ex. sur votre clé USB).
3.  **Le processus de Copie** :
    *   Le logiciel analyse tout le projet.
    *   Crée un sous-dossier appelé udio/ dans la destination.
    *   **Copie physiquement** tous les fichiers MP3/WAV originaux dans ce dossier.
    *   Crée un nouveau fichier project.lmp où tous les liens ont été réécrits pour pointer vers le dossier local udio/.

### Le Résultat
Vous obtiendrez un dossier contenant tout le nécessaire. Vous pouvez brancher la clé USB sur n'importe quel ordinateur avec Runtime Live Machine Pro installé, ouvrir le fichier project.lmp et tout fonctionnera parfaitement, indépendamment des lettres de lecteur ou des chemins originaux.

> **Utilisation Recommandée** : Utilisez cette fonction à la fin de la préparation de chaque émission pour créer un "Master" à emporter en studio ou à archiver comme sauvegarde historique complète.
