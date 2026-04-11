# CHAPITRE 4 : ÉDITION AVANCÉE DE CLIPS (PROPRIÉTÉS)

Chaque fichier audio est différent : certains ont de longs silences initiaux, d'autres ont un volume trop faible, d'autres encore doivent se répéter à l'infini.
Pour accéder au panneau de configuration avancée, faites un **Clic Droit** sur n'importe quel clip et sélectionnez **"Edit"** (Modifier).

Une fenêtre modale s'ouvrira, divisée en deux sections principales : **Visual & Basic** (Gauche) et **Behavior & Timing** (Droite).

---

## 4.1 Paramètres de Base (Visuel & Audio)

Dans cette section, vous contrôlez l'apparence et le volume brut du clip.

*   **Nom du Clip** : Vous pouvez renommer le clip comme vous le souhaitez (ex. de piste_01_final.mp3 à GÉNÉRIQUE D'OUVERTURE). Cela change uniquement l'étiquette dans le logiciel, pas le nom du fichier original sur le disque.
*   **Volume (Gain)** : Un curseur allant de 0% à 150%.
    *   Si vous avez un enregistrement faible (ex. un vocal WhatsApp), vous pouvez le pousser au-delà de 100% pour l'aligner avec le reste de l'émission.
*   **Couleur Personnalisée** : Par défaut, le clip hérite de la couleur de sa colonne (ex. Vert pour Assets). Ici, vous pouvez forcer une couleur différente pour le faire ressortir (ex. colorier en Rouge un jingle important dans la colonne Grise).

---

## 4.2 Précision Chirurgicale : Cue Points & Trim

Souvent, les fichiers audio ne sont pas "prêts pour la diffusion" : ils ont des secondes de silence au début ou des queues trop longues. Au lieu d'utiliser un éditeur audio externe, vous pouvez les arranger ici. Ces modifications sont **non destructives** (le fichier original reste intact).

### Contrôles Manuels
*   **Trim Start (Début)** : Définit combien de secondes sauter au début.
    *   *Exemple* : Si vous mettez 2.5, quand vous appuyez sur Play, le clip partira instantanément de la seconde 2.5, sautant le silence initial ("au temps").
*   **Trim End (Fin)** : Définit combien de secondes couper à la fin.
    *   *Exemple* : Si la chanson a 20 secondes d'applaudissements finaux inutiles, augmentez cette valeur jusqu'à ce que la "Nouvelle Durée" vous satisfasse.

### ?? La Baguette Magique (Smart Trim / Détection Auto)
Pour accélérer le travail, RRLMP inclut un algorithme d'intelligence artificielle de base.
1.  Cliquez sur le bouton avec l'icône **Baguette Magique** à côté des contrôles Trim.
2.  Le logiciel scanne le fichier en une fraction de seconde.
3.  Détecte automatiquement où commence et finit le son réel (au-dessus du seuil de -40dB).
4.  Remplit automatiquement les champs *Start* et *End* pour vous.

> **Conseil** : Utilisez toujours la Baguette Magique sur les enregistrements vocaux ou les interviews pour les nettoyer instantanément.

---

## 4.3 Comportements (Behaviors & Logic)

Ici, vous définissez l'intelligence du clip : ce qu'il doit faire quand il démarre et ce qu'il doit faire quand il finit.

### Behavior (Mode de Superposition)
*   **Normal (Défaut)** : Quand vous lancez ce clip, tout autre clip jouant **dans la même colonne** est arrêté. C'est le comportement standard pour les chansons (l'une exclut l'autre).
*   **Stacco** (Interruption) : Quand vous lancez ce clip, il **n'arrête PAS** les autres clips de la colonne, mais les "rend muets" temporairement (ou se superpose).
    *   *Utilisation typique* : Un effet sonore ou un jingle vocal que vous voulez jouer par-dessus un fond musical situé dans la même colonne, sans interrompre le fond.

### Next Action (Automatisation Finale)
Que se passe-t-il quand le clip finit ?
*   **Stop** : Le clip finit et s'arrête. (Comportement standard).
*   **Loop** : Le clip recommence du début à l'infini. Utile pour les bases et les fonds sonores. Un badge **[LOOP]** apparaîtra sur la carte.
*   **Play Next** : Dès que ce clip commence à s'estomper (Fade Out), le logiciel lance automatiquement le clip suivant dans la colonne.
    *   *Crossfade* : La transition est fluide, sans trous de silence. Un badge **[NEXT]** apparaîtra sur la carte.

---

## 4.4 Fades (Fondus)

Chaque colonne a des défauts (ex. la Musique fait un fondu en 2 secondes, les Jingles sont secs), mais ici vous pouvez les outrepasser.

*   **Fade In (ms)** : Combien de temps prend le volume pour arriver au maximum quand vous appuyez sur Play. (Ex. 2000ms = 2 secondes de montée progressive).
*   **Fade Out (ms)** : Combien de temps il prend pour s'estomper quand vous appuyez sur Stop ou quand le clip finit naturellement.
    *   *Note* : Un long Fade Out est utile pour les chansons. Un Fade Out à 0 est obligatoire pour les coupures sèches.

---

## 4.5 Assignation des Contrôles (Entrée)

En bas du panneau, vous trouvez les références pour le contrôle externe :
*   **Trigger Keybind** : Cliquez ici et appuyez sur une touche du clavier (ex. "Q") pour l'assigner à ce clip.
*   **MIDI Bind** : Montre la note MIDI assignée (ex. NOTE:60). Pour la modifier, utilisez le mode "MIDI Learn" depuis l'écran principal (voir Chap. 6).
