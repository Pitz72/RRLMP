# Runtime Live Machine Pro — Guide de Démarrage Rapide

**Version 1.15.10 · Français**

Bienvenue dans Runtime Live Machine Pro (RLMP), le logiciel de playout audio pour la radio, les directs et les événements live. Ce guide vous accompagne de l'installation à votre première lecture en quelques minutes. Pour la documentation complète, consultez le Manuel Utilisateur (téléchargeable depuis le logiciel avec le bouton « Manuel »).

---

## Nouveautés de cette version

- **Exporter le projet avec l'audio** — l'entrée du menu FICHIER (sous *Enregistrer sous…*) regroupe tout l'audio dans un sous-dossier `audio/` et y redirige les clips : à partir de ce moment, l'archive devient la référence du projet et **vous pouvez supprimer les fichiers d'origine en toute sécurité**. Cette entrée s'appelait auparavant « Exporter l'archive ».
- **Vider la colonne** — l'icône de corbeille dans l'en-tête de chaque colonne supprime toutes ses clips d'un seul coup, avec demande de confirmation (annulable avec `Ctrl+Z`).
- **Badge Intro sur les cartes** — si une clip a un point d'Intro configuré, un badge cyan `I` avec les secondes reste toujours visible ; le badge BPM est désormais jaune fluorescent, à haute visibilité.
- **Mises à jour intégrées améliorées** — la fenêtre de mise à jour est plus grande et affiche les vraies notes de version (le changelog) ; lors de « Redémarrer et installer », l'application se ferme proprement et l'installation démarre sans accroc.

---

## 1. Configuration requise

| | Minimum | Recommandé |
|---|---|---|
| Windows | 10 64 bits | 11 64 bits |
| macOS | 11 Big Sur | 13 Ventura ou ultérieur |
| Linux | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| RAM | 4 Go | 8 Go ou plus |
| Disque | 300 Mo | 1 Go + espace pour les fichiers audio |

Aucune carte son dédiée n'est nécessaire : RLMP fonctionne avec n'importe quel périphérique reconnu par votre système, de la sortie intégrée aux mixeurs USB professionnels (Rødecaster Pro, Rødecaster Duo, etc.). Optimisé nativement pour Apple Silicon (M1/M2/M3).

---

## 2. Installation

**Windows**
1. Ouvrez le fichier `.exe` téléchargé.
2. Si le message *« Windows a protégé votre ordinateur »* apparaît, cliquez sur **Plus d'infos** → **Exécuter quand même**. C'est normal pour un logiciel mis à jour fréquemment : il n'y a aucun malware, et le code source est publiquement consultable.
3. Suivez l'assistant d'installation. Un raccourci est créé sur le Bureau et dans le menu Démarrer.

**macOS**
1. Ouvrez le fichier `.dmg` téléchargé.
2. Glissez l'icône de Runtime Live Machine Pro dans le dossier **Applications**.
3. Au premier lancement, si macOS affiche un avertissement Gatekeeper, allez dans **Réglages Système → Confidentialité et sécurité** et cliquez sur **Ouvrir quand même** à côté du nom de l'application.

**Linux**
- **AppImage** (portable, sans installation) : rendez le fichier exécutable avec `chmod +x` et lancez-le.
- **.deb** (Debian/Ubuntu/Mint) : installez avec `sudo dpkg -i nomdufichier.deb` ou via votre gestionnaire de paquets graphique.
- Si l'application ne démarre pas, vérifiez que le paquet `libasound2` est installé pour le support ALSA.

---

## 3. Premier lancement

Au démarrage, vous verrez la **Welcome Screen** : depuis cet écran, vous pouvez créer un nouveau projet, en charger un existant (`.lmp`), télécharger le Manuel Utilisateur ou ouvrir ce Guide de Démarrage Rapide. En haut à droite, vous pouvez choisir la langue de l'interface parmi les huit disponibles.

Une fois un projet ouvert, le badge **PRO** cyan dans l'en-tête confirme que le moteur audio est actif. Appuyez sur `F11` (Windows/Linux) ou `Ctrl+Cmd+F` (macOS) pour passer en plein écran — le mode de travail recommandé en régie.

---

## 4. Les six colonnes

RLMP organise tout autour de six colonnes fixes, chacune avec un comportement dédié :

| Colonne | Couleur | Comportement |
|---|---|---|
| **Show Assets** | Vert | Indicatifs, habillages musicaux, transitions institutionnelles |
| **Jingle** | Ambre | Jingles identitaires |
| **Promo** | Cyan | Promos et autopromotions |
| **Chansons** | Rouge | Playlist musicale, soumise au ducking, détection BPM |
| **Voix** | Orange | Priorité maximale : abaisse tout le reste |
| **Pre-Show** | Violet | Musique d'attente avant le direct, avec rotation optionnelle |

Chaque colonne possède un point coloré dans son en-tête : cliquez dessus pour choisir une couleur différente parmi 30 teintes disponibles.

---

## 5. Pad FX et Automix

En plus des six colonnes, l'en-tête propose deux outils rapides :

- **FX** — ouvre le pad d'effets sonores : lancement en superposition libre, idéal pour les stingers, applaudissements, transitions sonores.
- **MIX** — ouvre la vue Automix, le deck dédié à la colonne Chansons : compatibilité BPM, transitions synchronisées au tempo (beat-matching) et mode automatique.

---

## 6. Charger et lire votre premier fichier

1. Glissez un fichier audio (MP3, WAV, AAC/M4A, OGG, FLAC) depuis l'Explorateur de fichiers / Finder directement sur une colonne.
2. **Clic gauche** sur la carte pour démarrer la lecture.
3. **Cliquez à nouveau** sur la carte active pour l'arrêter avec un fondu de sortie, ou appuyez sur `Échap` pour un arrêt d'urgence immédiat de toutes les clips.

Dans la plupart des colonnes, la règle est « une clip à la fois » : en démarrer une nouvelle arrête automatiquement celle en cours dans la même colonne. Le pad FX fait exception : les effets se superposent librement.

---

## 7. Où trouver de l'aide

- **Manuel Utilisateur complet** — téléchargeable directement depuis le logiciel (bouton « Manuel » dans l'écran Infos), il couvre chaque fonction en détail (éditeur de forme d'onde, ducking, MIDI, enregistrement, gestion de projets, contrôle à distance).
- **Site officiel et mises à jour** — la couleur à côté du numéro de version sur la Welcome Screen indique si une mise à jour est disponible (vert = à jour, jaune/orange = nouvelle version disponible).

Bonne émission.

*Runtime Live Machine Pro est un projet Ecosystem.Runtime — © Simone Pizzi.*
