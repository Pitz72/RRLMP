# CHAPITRE 8 : DÉPANNAGE ET FAQ

Même dans le logiciel le plus stable, des imprévus dus au matériel ou au système d'exploitation peuvent survenir. Vous trouverez ici les solutions aux problèmes les plus courants.

---

## 8.1 Problèmes Audio

### Le Minuteur défile et les VU-mètres bougent, mais je n'entends rien.
Le logiciel lit l'audio correctement (vous le voyez aux barres colorées en haut), mais le signal n'arrive pas à vos enceintes/casque.
1.  **Vérifiez le Volume Principal (Master)** : Assurez-vous que le curseur de volume en haut n'est pas à zéro.
2.  **Vérifiez la Sortie (Routage)** :
    *   Cliquez sur l'icône **Engrenage** (Paramètres).
    *   Vérifiez quel périphérique est sélectionné dans "Audio Output Device".
    *   Parfois Windows change l'ID des périphériques USB s'ils sont débranchés et rebranchés. Essayez de resélectionner votre carte audio (ex. *Rødecaster Pro* ou *Casque*) dans la liste.
3.  **Mixer Externe** : Si vous sortez sur une table de mixage USB, vérifiez que le fader physique de ce canal n'est pas baissé ou en "Mute".

### L'audio "crépite" ou saute.
Cela arrive rarement grâce au moteur natif, mais cela peut arriver si le processeur de l'ordinateur est sous un stress extrême.
*   Fermez les autres applications lourdes (montage vidéo, jeux).
*   Si vous utilisez une carte audio professionnelle, vérifiez que la *Taille du Tampon (Buffer Size)* dans les pilotes de la carte n'est pas trop basse (recommandé : 256 ou 512 échantillons).

---

## 8.2 Gestion de Fichiers et Clips Rouges

### Un Clip est devenu Rouge et ne joue plus.
Une **Carte Rouge** indique que le logiciel ne parvient plus à trouver le fichier audio sur le disque.
*   **Cause** : Vous avez déplacé, renommé ou supprimé le fichier original MP3/WAV. Ou le fichier était sur une clé USB/Disque Externe qui est maintenant déconnecté.
*   **Solution** :
    1.  Reconnectez le disque externe.
    2.  Remettez le fichier à son emplacement d'origine.
    3.  Ou, glissez à nouveau le fichier dans la grille (créant une nouvelle carte) et supprimez l'ancienne rouge.

> **Prévention** : Pour éviter ce problème, utilisez la fonction **Export Package** (Chap. 7) qui copie tous les fichiers dans un dossier sûr avec le projet.

---

## 8.3 Problèmes MIDI

### Mon contrôleur MIDI ne fonctionne pas / n'est pas détecté.
1.  **Règle d'Or du MIDI** : Le contrôleur doit être connecté à l'ordinateur **AVANT** de démarrer Runtime Live Machine.
    *   Si vous le branchez alors que le logiciel est ouvert, le navigateur interne pourrait ne pas le voir. Fermez et rouvrez RLM.
2.  **Learn Mode** : Vérifiez que vous n'avez pas laissé le mode "MIDI Learn" actif (Icône Cyan). Dans ce mode, appuyer sur les touches ne sert qu'à mapper, pas à jouer.
3.  **Pilotes** : Certains contrôleurs avancés nécessitent des pilotes spécifiques. Vérifiez que Windows le reconnaît correctement.

---

## 8.4 Foire Aux Questions (FAQ)

**Q : Puis-je utiliser RLM pour automatiser la radio 24h/24 ?**
R : Non. RLM est conçu pour la régie *Live* (émissions assurées par une personne). Il n'a pas de fonctions de programmation horaire ou de rotation musicale automatique infinie.

**Q : Quels formats audio sont supportés ?**
R : Il supporte nativement **MP3, WAV, AAC, OGG, FLAC**. Nous recommandons l'utilisation de WAV pour une qualité maximale ou MP3 320kbps pour économiser de l'espace.

**Q : Le logiciel fonctionne-t-il sur iPad ou Android ?**
R : Non, Runtime Live Machine est un logiciel de Bureau professionnel pour **Windows** et **macOS**. Il nécessite la puissance de gestion de fichiers d'un véritable ordinateur.

**Q : Comment mettre à jour le logiciel ?**
R : Au démarrage, le Welcome Screen vous avertira s'il y a une nouvelle version disponible (indicateur Jaune/Orange). Visitez le site officiel pour télécharger l'installateur mis à jour. Vos projets .lmp sauvegardés seront compatibles avec les nouvelles versions.

**Q : Où trouver les fichiers de sauvegarde automatique ?**
R : Si vous travaillez sur un fichier sauvegardé, la sauvegarde .bak est dans le même dossier que le projet. Si vous travailliez sur un projet "Sans Titre" et que le PC s'est éteint, vérifiez dans le dossier des données d'application du système (sur Windows : %APPDATA%\runtime-live-machine\).
