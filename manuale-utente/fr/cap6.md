# CHAPITRE 6 : CONTRÔLE MATÉRIEL ET ROUTAGE

Un logiciel de régie professionnel ne vit pas isolé dans l'ordinateur. Il doit communiquer avec la table de mixage du studio, le casque et les doigts du réalisateur.
Dans ce chapitre, nous verrons comment configurer la sortie audio et comment commander le logiciel sans toucher à la souris.

---

## 6.1 Configuration Audio (Routage)

Par défaut, RLM sort sur le périphérique audio par défaut de Windows. Cependant, dans un studio (ou avec des configurations de podcast avancées comme le *Rødecaster Pro*), vous devez séparer les flux.

### Sélectionner la Sortie
1.  Cliquez sur l'icône **Engrenage (Paramètres)** dans la barre de commandes en haut.
2.  Le panneau **General Settings** s'ouvrira.
3.  Dans le menu déroulant "Audio Output Device", vous verrez la liste de toutes les cartes audio connectées à votre PC.
4.  Sélectionnez le périphérique désiré (ex. *Rødecaster Pro Stereo* ou *Focusrite USB*).

### Commutation en Direct (Live Switch)
Le changement est instantané. Si la musique joue pendant que vous changez de périphérique, l'audio "sautera" sur la nouvelle sortie sans s'interrompre.

> **Conseil pour Rødecaster/Mixer USB** : Si votre table de mixage a plusieurs canaux USB (ex. Main et Sounds/Chat), réglez RLM sur un canal secondaire (ex. "Sounds") afin de pouvoir contrôler son volume avec un fader dédié sur la table physique, en le séparant des sons système de Windows.

---

## 6.2 Le Clavier (Raccourcis)

Le clavier de l'ordinateur est le contrôleur le plus rapide que vous ayez. RLM inclut des commandes globales prédéfinies et des touches personnalisables.

### Commandes Globales (Touches F)
Les touches de fonction (F1-F5) sont mappées pour lancer les colonnes. Elles ont une logique "intelligente" : elles cherchent le premier clip libre.
*   **F1** : Lance la colonne 1 (Assets).
*   **F2** : Lance la colonne 2 (Musique).
*   **F3** : Lance la colonne 3 (Voix).
*   **F4** : Lance la colonne 4 (SFX).
*   **F5** : Lance la colonne 5 (Pré-Show).
*   **ESC** : **BOUTON PANIQUE**. Arrête tout immédiatement (Stop All).

### Touches Personnalisées (Custom Binds)
Vous voulez lancer le générique en appuyant sur la barre d'espace ou la lettre "Q" ?
1.  Faites un clic droit sur le clip -> **Edit**.
2.  Cliquez dans le champ **Trigger Keybind**.
3.  Appuyez sur la touche désirée sur le clavier.
4.  Enregistrez.
5.  Un badge (ex. **[Q]**) apparaîtra sur la carte pour vous rappeler l'assignation.

> **Sécurité** : Les commandes clavier sont automatiquement désactivées si vous écrivez du texte (ex. en renommant un clip), pour éviter de faire partir l'audio pendant que vous tapez.

---

## 6.3 Contrôleur MIDI (La Puissance Physique)

C'est la fonction "Pro" par excellence. Vous pouvez connecter des claviers musicaux, des pads (comme *Novation Launchpad*) ou des contrôleurs à fader (comme *Korg nanoKONTROL*) et les utiliser pour piloter le logiciel.

### Connexion
1.  Connectez votre contrôleur USB-MIDI à l'ordinateur **avant** de démarrer Runtime Live Machine.
2.  Démarrez le logiciel. Le moteur MIDI reconnaîtra automatiquement le périphérique.

### Mode MIDI Learn (Mappage Facile)
Vous n'avez pas besoin de connaître des codes compliqués. RLM apprend en regardant ce que vous faites.

1.  Cliquez sur l'icône **MIDI** (Connecteur DIN) dans la barre en haut.
    *   L'icône devient **Cyan (Allumée)**.
    *   Les clips prennent un aspect pointillé ("En attente").
2.  **Pour mapper un Clip** :
    *   Cliquez avec la souris sur le Clip désiré.
    *   Appuyez sur le bouton/pad physique sur votre contrôleur.
    *   Un badge (ex. **[M:60]**) apparaîtra sur le clip. Fait.
3.  **Pour mapper des fonctions Globales** :
    *   Cliquez sur le bouton rouge **STOP ALL** sur l'écran -> Appuyez sur un gros bouton sur le contrôleur.
    *   Cliquez sur le curseur **MASTER VOL** sur l'écran -> Bougez un fader ou un potentiomètre sur le contrôleur.
4.  Cliquez à nouveau sur l'icône **MIDI** pour quitter le mode Learn.

### Types de Commandes Supportés
*   **Note On/Off** : Parfait pour les boutons et les pads (Lancement Clip, Stop All).
*   **Control Change (CC)** : Parfait pour les faders et les potentiomètres rotatifs. Utilisez-le pour contrôler le Master Volume de manière analogique et fluide.

> **Portabilité** : Les mappages MIDI des clips sont enregistrés dans le projet .lmp. Si vous portez le projet sur un autre PC avec le même contrôleur, tout fonctionnera immédiatement.
