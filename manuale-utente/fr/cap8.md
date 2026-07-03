# Chapitre 8 — Matériel, clavier et MIDI

---

Runtime Live Machine Pro est conçu pour s'intégrer au matériel déjà présent dans le studio sans exiger de configurations élaborées. Ce chapitre décrit comment diriger la sortie audio, comment utiliser le clavier de l'ordinateur comme contrôleur et comment connecter des périphériques MIDI physiques pour un contrôle tactile de la régie.

---

## 8.1 Routage audio

### Choisir le périphérique de sortie

Par défaut, RLMP sort sur le périphérique audio par défaut du système d'exploitation. Dans un contexte professionnel ou semi-professionnel, avec mixeurs USB, cartes son externes ou systèmes multipistes, il est utile de choisir explicitement la destination du signal.

1. Ouvrez les **Paramètres** depuis le menu Outils.
2. Dans l'onglet *Audio & Mix*, ouvrez le menu du périphérique de sortie : vous y trouvez la liste des périphériques audio disponibles sur le système.
3. Sélectionnez le périphérique voulu.

Si le périphérique choisi est déconnecté, RLMP se rabat automatiquement sur celui du système ; l'application surveille les connexions et réagit à l'insertion ou au retrait de périphériques USB.

### Mixeurs USB et setup multicanal

Les mixeurs USB comme le Rødecaster Pro, le RØDECaster Duo ou le Focusrite Scarlett exposent généralement plusieurs canaux USB au système d'exploitation (Main Mix, Sounds/Chat, Monitor, etc.). RLMP apparaît comme une source stéréo unique ; le choix du canal USB vers lequel le diriger vous appartient.

**Setup conseillé avec mixeur USB.** Affectez RLMP à un canal secondaire du mixeur (ex. « Sounds » sur le Rødecaster Pro) plutôt qu'au canal principal. Ainsi, vous contrôlez le volume de RLMP avec un fader physique dédié, vous le séparez du signal du micro physique et vous appliquez un éventuel traitement matériel à ce seul canal.

### Latence et buffer

RLMP utilise les API audio natives du système d'exploitation. La latence de sortie est déterminée par le buffer du périphérique audio, non par le logiciel. Avec des cartes son professionnelles, la latence est de l'ordre de quelques millisecondes, imperceptible dans un contexte de playout.

Si vous notez des artefacts audio (crépitements, dropouts), la valeur de buffer du périphérique est probablement trop basse. Augmentez-la depuis le panneau de contrôle de la carte son (non depuis RLMP, qui ne gère pas directement le driver) : un buffer de 256 ou 512 échantillons est le point d'équilibre idéal entre latence et stabilité.

---

## 8.2 Contrôle au clavier

Le clavier de l'ordinateur est le contrôleur le plus rapide disponible en direct : il ne demande pas de coordination œil-main, fonctionne dans l'obscurité et reste toujours à portée de main. RLMP prévoit un ensemble de raccourcis globaux et la possibilité d'attribuer des touches aux clips individuels.

### Raccourcis globaux

| Touche | Action |
|---|---|
| **Échap** | STOP ALL — arrête tous les clips actifs |
| **Suppr / Backspace** | Supprime les clips sélectionnés |
| **Ctrl+Z** | Annule la dernière modification de la conduite |
| **Ctrl+Y** (ou **Ctrl+Shift+Z**) | Répète la modification annulée |
| **Ctrl+Shift+D** | Affiche/masque le Debug Overlay |
| **Ctrl+Shift+M** | Ouvre le simulateur MIDI (pour tester sans contrôleur) |

`Échap` agit comme STOP ALL quand RLMP est la fenêtre active, même quand le curseur est dans un champ de texte. Ce n'est plus un raccourci enregistré au niveau du système d'exploitation : si l'application est en arrière-plan, ramenez d'abord la fenêtre au premier plan.

> **Note.** Il n'existe pas de touches de fonction (F1–F5) préaffectées au lancement des colonnes. Pour lancer rapidement un clip précis, attribuez-lui une touche dédiée, comme décrit ci-dessous.

### Touches personnalisées par clip

Outre les raccourcis globaux, chaque clip peut avoir une touche dédiée. Le badge correspondant apparaît sur la carte.

**Pour attribuer une touche :**
1. Ouvrez les paramètres du clip (clic droit sur la carte) ou la fenêtre **Raccourcis & tableau MIDI** depuis le menu Outils.
2. Cliquez dans le champ de la touche.
3. Appuyez sur la touche voulue.

**Touches disponibles.** Presque n'importe quelle touche : lettres (A–Z), chiffres (0–9), pavé numérique, barre d'espace, touches de fonction libres. Si la touche est déjà attribuée à un autre clip, le logiciel signale le conflit avant d'écraser, pour éviter les doublons invisibles.

**Sécurité pendant la saisie.** Les touches personnalisées sont automatiquement désactivées quand vous êtes en mode de saisie de texte (vous renommez un clip ou vous écrivez une note). Cela prévient les lancements accidentels pendant que vous tapez.

---

## 8.3 Contrôleurs MIDI

Le MIDI est le choix professionnel pour un contrôle physique, tactile et fiable. RLMP prend en charge les contrôleurs USB-MIDI : claviers, pads (ex. Novation Launchpad), contrôleurs à faders (ex. Korg nanoKONTROL2), surfaces de contrôle hybrides.

### Connexion

Branchez le contrôleur USB à l'ordinateur et lancez RLMP. Le logiciel détecte les périphériques via la Web MIDI API du système et reconnaît en temps réel la connexion et la déconnexion d'un contrôleur. La plupart des contrôleurs USB-MIDI sont *class-compliant* et ne demandent pas de driver ; pour les surfaces professionnelles à driver propriétaire, installez le driver avant de connecter le périphérique.

### MIDI Learn

RLMP ne demande pas de connaître la numérotation des notes MIDI ni de configurer les messages à la main. L'apprentissage se fait via le mode **MIDI Learn**, depuis le menu Outils (ou depuis la fenêtre Raccourcis).

**Pour mapper un clip à une touche/pad :**
1. Activez MIDI Learn. Les cartes entrent en état d'attente.
2. Sélectionnez le clip (ou la cellule du pad FX) à mapper.
3. Jouez la note, appuyez sur le pad ou sur la touche du contrôleur. Le badge `M` avec le numéro de note apparaît sur la carte.

**Pour mapper les fonctions globales :**
- Sélectionnez **STOP ALL** et appuyez sur une touche du contrôleur : cette touche exécutera le Stop All.
- Sélectionnez le **Master Volume** et bougez un fader ou un potentiomètre : cette commande gérera le volume master de façon continue.

À la fin, désactivez MIDI Learn pour revenir au mode opérationnel.

### Types de messages pris en charge

**Note On** — messages générés par des boutons, des pads et des touches. Idéaux pour le lancement des clips et des actions globales ; RLMP répond à l'appui de la touche et reconnaît tous les canaux MIDI. Les messages Note Off sont ignorés.

**Control Change (CC)** — messages générés par des faders et des potentiomètres, avec une valeur continue de 0 à 127. Idéaux pour le Master Volume : un fader physique mappé sur le master offre le contrôle le plus naturel du niveau de sortie.

### Portabilité des mappings

Les mappings MIDI des **clips** sont enregistrés dans le fichier de projet `.lmp` : en transportant le projet sur un autre ordinateur avec le même contrôleur, ils fonctionneront sans reconfiguration. Les mappings des **fonctions globales** (Stop All, Master Volume) sont en revanche liés à l'ordinateur, enregistrés dans les préférences locales de l'application, et restent valables pour tous les projets de cette machine.
