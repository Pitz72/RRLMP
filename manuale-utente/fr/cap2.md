# Chapitre 2 — Installation et premier démarrage

---

L'installation de Runtime Live Machine Pro demande un minimum d'interaction : quelques clics suffisent, sans configuration manuelle ni prérequis à installer à part. Le moteur audio (FFmpeg) est intégré au paquet d'installation ; vous n'avez rien à faire de ce côté.

---

## 2.1 Configuration requise

Avant de commencer, vérifiez que votre ordinateur répond à la configuration minimale. Les spécifications recommandées offrent un meilleur confort sur les sessions longues ou avec de nombreux clips chargés en même temps.

| | Minimum | Recommandé |
|---|---|---|
| **Système d'exploitation (Windows)** | Windows 10 64-bit | Windows 11 64-bit |
| **Système d'exploitation (macOS)** | macOS 11 Big Sur | macOS 13 Ventura ou ultérieur |
| **Système d'exploitation (Linux)** | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04 LTS |
| **RAM** | 4 GB | 8 GB ou plus |
| **Espace disque** | 300 MB (application) | 1 GB + espace pour les fichiers audio |
| **CPU** | Tout dual-core moderne | Quad-core ou supérieur |

Le logiciel est optimisé pour Apple Silicon (M1, M2, M3) : il tourne nativement sur les deux architectures macOS, sans passer par l'émulation Rosetta.

Aucune carte son dédiée n'est nécessaire. RLMP fonctionne avec n'importe quel périphérique audio reconnu par le système, de la carte son intégrée aux mixeurs USB professionnels comme le Rødecaster Pro ou le RØDECaster Duo.

---

## 2.2 Installation sous Windows

1. Téléchargez le fichier `Runtime-Live-Machine-Pro-1.15.10.exe` depuis le canal de distribution officiel.
2. Double-cliquez sur l'exécutable. L'installateur NSIS se lance et copie les fichiers dans les répertoires appropriés.
3. À la fin, un raccourci est créé sur le Bureau et dans le menu Démarrer.
4. L'application démarre automatiquement une fois l'installation terminée.

**Note sur Windows SmartScreen.** Le logiciel étant mis à jour fréquemment, son certificat de signature numérique n'a pas toujours eu le temps d'accumuler la « réputation » requise pour la liste blanche automatique de SmartScreen. Si l'avertissement « Windows a protégé votre ordinateur » s'affiche, cliquez sur *Informations complémentaires* puis sur *Exécuter quand même*. Le logiciel ne contient aucun malware : les installateurs officiels ne transitent que par les canaux de distribution de l'auteur.

---

## 2.3 Installation sous macOS

1. Téléchargez le fichier `.dmg` depuis le canal officiel.
2. Ouvrez l'image disque et faites glisser l'icône de Runtime Live Machine Pro dans le dossier *Applications*.
3. Au premier démarrage, macOS peut afficher un avertissement Gatekeeper (« L'app ne peut pas être ouverte, car elle provient d'un développeur non identifié »). Ouvrez alors *Préférences Système* → *Sécurité et confidentialité* → *Général*, puis cliquez sur *Ouvrir quand même* à côté du nom de l'application.

À partir de macOS 15 (Sequoia), le chemin devient *Réglages Système* → *Confidentialité et sécurité* → faites défiler jusqu'à la section *Sécurité*.

> **Note.** L'application macOS n'est pas signée avec un certificat Apple Developer, ce qui a aussi une influence sur la gestion des mises à jour — voir le Chapitre 12.

---

## 2.4 Installation sous Linux

Deux formats de distribution sont disponibles :

- **AppImage** — exécutable portable, sans installation. Rendez le fichier exécutable (`chmod +x`) et lancez-le directement.
- **Paquet .deb** — pour les distributions Debian/Ubuntu/Mint. Installez avec `sudo dpkg -i nomfichier.deb` ou ouvrez-le avec le gestionnaire de paquets graphique.

Sur certaines distributions, le paquet `libasound2` peut être requis pour la prise en charge audio ALSA. Si l'application refuse de démarrer, consultez la documentation de votre distribution.

---

## 2.5 L'écran d'accueil

![L'écran d'accueil de Runtime Live Machine Pro, avec les actions principales et le sélecteur de langue.](../screenshots-fr/schermata-benvenuto.png)

*Figure 2.1 — L'écran d'accueil : identité du logiciel, état de la mise à jour, actions principales et sélecteur de langue.*

Au premier démarrage, et à chaque démarrage suivant tant qu'aucun projet n'est ouvert, RLMP affiche l'**écran d'accueil** : le point d'accès à toutes les opérations préliminaires. Le panneau se divise en deux zones.

**Zone de gauche — Identité et actions.**
Le logo du logiciel, les barres d'un VU meter surmontées du symbole de lecture, identifie la version Pro. Sous le titre et le slogan figurent le numéro de version installée et l'état du système de mise à jour :

- **« Version la plus récente »** (vert) — vous utilisez la dernière version disponible.
- **« Mise à jour disponible »** (ambre, clignotant) — c'est un bouton : cliquez dessus pour ouvrir la fenêtre de mise à jour (Chapitre 12).
- **« OFFLINE »** (rouge estompé) — impossible de contacter le service de mise à jour ; le logiciel fonctionne quand même.

Viennent ensuite les actions principales :

- *Nouveau Projet* — crée une session vide, colonnes prêtes au chargement.
- *Charger un Projet* — ouvre un fichier `.lmp` existant. Avant de le rendre opérationnel, RLMP procède à un **contrôle d'intégrité** : chaque fichier audio référencé doit encore exister au chemin mémorisé. Un fichier manquant est immédiatement signalé par une bordure rouge sur le clip correspondant.
- *Manuel en ligne* — l'entrée existe mais reste désactivée pour l'instant : la documentation consultable depuis le logiciel arrivera dans une prochaine version, via le web.

**Zone de droite — Sélecteur de langue.**
RLMP prend en charge huit langues d'interface : anglais, italien, français, allemand, espagnol, portugais, russe et chinois simplifié. Une bordure cyan et une coche signalent la langue active. Le changement de langue prend effet immédiatement et reste mémorisé d'une session à l'autre.

---

## 2.6 Le premier démarrage : à quoi s'attendre

À la première ouverture d'un projet, l'en-tête affiche le logo avec son badge **PRO** au dégradé iridescent. En coulisse, cette ouverture lance le moteur audio : FFmpeg s'initialise et le protocole de streaming `media://` se met à l'écoute, prêt à servir les fichiers depuis le disque sans jamais les charger en mémoire.

Le logiciel démarre de préférence en mode plein écran. Si la fenêtre s'ouvre redimensionnée, un appui sur `F11` (Windows/Linux) ou `Ctrl+Cmd+F` (macOS) la fait passer en plein écran, condition optimale pour le travail de régie.

Le **minuteur On Air**, dans l'en-tête, reste à `--:--:--` tant qu'aucun clip n'a été lancé. Dès le premier lancement, il se met à compter le temps écoulé en direct — un repère précieux pour qui travaille avec une conduite à durée fixe.
