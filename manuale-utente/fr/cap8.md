# Chapitre 8 — Matériel, clavier et MIDI

---

Runtime Live Machine Pro s'intègre au matériel déjà présent dans le studio sans exiger de configuration compliquée. Ce chapitre explique comment router la sortie audio, comment se servir du clavier de l'ordinateur comme contrôleur, et comment brancher des périphériques MIDI physiques pour un contrôle tactile de la régie.

---

## 8.1 Routage audio

### Choisir le périphérique de sortie

Par défaut, RLMP sort sur le périphérique audio par défaut du système d'exploitation. Dans un contexte professionnel ou semi-professionnel, avec mixeurs USB, cartes son externes ou systèmes multipistes, mieux vaut choisir explicitement la destination du signal.

1. Ouvrez les **Paramètres** depuis le menu Outils.
2. Dans l'onglet *Audio & Mix*, ouvrez le menu du périphérique de sortie : vous y trouvez la liste des périphériques audio disponibles sur le système.
3. Sélectionnez le périphérique voulu.

Si le périphérique choisi est déconnecté, RLMP se rabat automatiquement sur celui du système : l'application surveille les connexions et réagit à chaque insertion ou retrait de périphérique USB.

### Mixeurs USB et setup multicanal

Les mixeurs USB comme le Rødecaster Pro, le RØDECaster Duo ou le Focusrite Scarlett exposent en général plusieurs canaux USB au système d'exploitation (Main Mix, Sounds/Chat, Monitor, etc.). RLMP apparaît comme une source stéréo unique ; à vous de choisir vers quel canal USB le diriger.

**Setup conseillé avec mixeur USB.** Affectez RLMP à un canal secondaire du mixeur (par exemple « Sounds » sur le Rødecaster Pro), plutôt qu'au canal principal. Vous gagnez ainsi un fader physique dédié pour le volume de RLMP, une séparation nette d'avec le signal du micro, et la possibilité d'appliquer un traitement matériel à ce seul canal.

### Latence et buffer

RLMP utilise les API audio natives du système d'exploitation. La latence de sortie dépend du buffer du périphérique audio, pas du logiciel. Avec des cartes son professionnelles, elle se situe autour de quelques millisecondes, imperceptible en playout.

Si vous constatez des artefacts audio (crépitements, dropouts), la valeur de buffer du périphérique est sans doute trop basse. Augmentez-la depuis le panneau de contrôle de la carte son, pas depuis RLMP qui ne gère pas directement le driver : un buffer de 256 ou 512 échantillons offre un bon équilibre entre latence et stabilité.

---

## 8.2 Contrôle au clavier

En direct, le clavier de l'ordinateur reste le contrôleur le plus rapide : pas de coordination œil-main à gérer, fonctionne dans l'obscurité, toujours à portée de main. RLMP propose un jeu de raccourcis globaux et la possibilité d'attribuer une touche à chaque clip.

### Raccourcis globaux

| Touche | Action |
|---|---|
| **Échap** | STOP ALL — arrête tous les clips actifs |
| **Suppr / Backspace** | Supprime les clips sélectionnés |
| **Ctrl+Z** | Annule la dernière modification de la conduite |
| **Ctrl+Y** (ou **Ctrl+Shift+Z**) | Répète la modification annulée |
| **Ctrl+Shift+D** | Affiche/masque le Debug Overlay |
| **Ctrl+Shift+M** | Ouvre le simulateur MIDI (pour tester sans contrôleur) |

`Échap` agit comme STOP ALL dès lors que RLMP est la fenêtre active, même si le curseur se trouve dans un champ de texte. Ce raccourci n'est pas enregistré au niveau du système d'exploitation : si l'application tourne en arrière-plan, ramenez d'abord la fenêtre au premier plan.

> **Note.** Il n'existe pas de touches de fonction (F1–F5) préaffectées au lancement des colonnes. Pour lancer rapidement un clip précis, attribuez-lui une touche dédiée, comme décrit ci-dessous.

### Touches personnalisées par clip

Chaque clip peut aussi recevoir une touche dédiée, en plus des raccourcis globaux. Le badge correspondant apparaît alors sur la carte.

**Pour attribuer une touche :**
1. Ouvrez les paramètres du clip (clic droit sur la carte) ou la fenêtre **Raccourcis & tableau MIDI** depuis le menu Outils.
2. Cliquez dans le champ de la touche.
3. Appuyez sur la touche voulue.

**Touches disponibles.** Pratiquement n'importe laquelle : lettres (A–Z), chiffres (0–9), pavé numérique, barre d'espace, touches de fonction libres. Si la touche est déjà attribuée à un autre clip, le logiciel signale le conflit avant d'écraser quoi que ce soit, pour éviter les doublons invisibles.

**Sécurité pendant la saisie.** Les touches personnalisées se désactivent automatiquement dès que vous êtes en train de saisir du texte, par exemple pour renommer un clip ou écrire une note, ce qui évite les lancements accidentels pendant que vous tapez.

---

## 8.3 Contrôleurs MIDI

Le MIDI reste le choix professionnel pour un contrôle physique, tactile et fiable. RLMP prend en charge les contrôleurs USB-MIDI : claviers, pads (par exemple Novation Launchpad), contrôleurs à faders (par exemple Korg nanoKONTROL2), surfaces de contrôle hybrides.

### Connexion

Branchez le contrôleur USB à l'ordinateur, puis lancez RLMP. Le logiciel détecte les périphériques via la Web MIDI API du système et reconnaît en temps réel la connexion ou la déconnexion d'un contrôleur. La plupart des contrôleurs USB-MIDI sont *class-compliant* et se passent de driver ; pour les surfaces professionnelles à driver propriétaire, installez ce dernier avant de brancher l'appareil.

### MIDI Learn

Nul besoin de connaître la numérotation des notes MIDI ni de configurer les messages à la main : l'apprentissage se fait via le mode **MIDI Learn**, accessible depuis le menu Outils (ou depuis la fenêtre Raccourcis).

**Pour mapper un clip à une touche/pad :**
1. Activez MIDI Learn. Les cartes entrent en état d'attente.
2. Sélectionnez le clip (ou la cellule du pad FX) à mapper.
3. Jouez la note, appuyez sur le pad ou sur la touche du contrôleur. Le badge `M` avec le numéro de note apparaît sur la carte.

**Pour mapper les fonctions globales :**
- Sélectionnez **STOP ALL** et appuyez sur une touche du contrôleur : cette touche exécutera le Stop All.
- Sélectionnez le **Master Volume** et bougez un fader ou un potentiomètre : cette commande gérera le volume master de façon continue.

Une fois le mapping terminé, désactivez MIDI Learn pour revenir au mode opérationnel.

### Types de messages pris en charge

**Note On** — messages générés par des boutons, des pads et des touches. Parfaits pour le lancement des clips et des actions globales : RLMP répond dès l'appui de la touche et reconnaît tous les canaux MIDI. Les messages Note Off, eux, sont ignorés.

**Control Change (CC)** — messages générés par des faders et des potentiomètres, avec une valeur continue de 0 à 127. Parfaits pour le Master Volume : un fader physique mappé sur le master reste la façon la plus naturelle de contrôler le niveau de sortie.

### Portabilité des mappings

Les mappings MIDI des **clips** sont enregistrés dans le fichier de projet `.lmp` : transportez le projet sur un autre ordinateur équipé du même contrôleur, et ils fonctionnent sans reconfiguration. Les mappings des **fonctions globales** (Stop All, Master Volume), en revanche, sont liés à l'ordinateur : enregistrés dans les préférences locales de l'application, ils restent valables pour tous les projets de cette machine.
