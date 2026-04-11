# CHAPITRE 1 : INTRODUCTION ET CONFIGURATION

Bienvenue dans **Runtime Live Machine Pro (RRLMP)**.
Ce chapitre vous guidera à travers les premières étapes : de la compréhension de la philosophie du logiciel jusqu'au premier lancement.

## 1.1 Qu'est-ce que Runtime Live Machine Pro (RRLMP)

**Runtime Live Machine Pro** est une architecture audio professionnelle de classe "Pro" conçue pour la régie de **spectacles vivants individuels**, podcasts, événements et web radios.

Contrairement aux logiciels complexes d'automatisation radio H24 (qui diffusent de la musique en rotation pendant des jours), RRLMP est un outil de **Performance**. Il est conçu pour être "joué" en temps réel par un réalisateur ou un animateur, offrant un contrôle chirurgical sur chaque transition.

### Pourquoi choisir RRLMP ?
*   **Philosophie "Single Show"** : Chaque projet est un conteneur isolé regroupant tout ce qui est nécessaire pour cet épisode ou événement spécifique.
*   **Architecture Main-Side-Heavy** : Utilise un proxy Node.js pour le décodage audio lourd (FFmpeg), garantissant que l'interface (Renderer) reste fluide et sans plantage, même avec des fichiers WAV de grande taille.
*   **Sécurité Totale** : Inclut des systèmes d'Auto-Backup, de vérification de l'intégrité des fichiers .lmp et des avertissements visuels pour les points de repère Intro/Outro.
*   **Contrôle Physique** : Prend en charge nativement les contrôleurs MIDI (avec MIDI Learn) et les claviers pour une régie tactile et réactive.

---

## 1.2 Installation

### Configuration Requise
*   **Windows** : Windows 10 ou Windows 11 (64-bit).
*   **macOS** : macOS 11 (Big Sur) ou ultérieur (Support natif Apple Silicon & Intel).
*   **Linux** : AppImage et paquets .deb supportés (Ubuntu/Debian/Mint).
*   **RAM** : Minimum 4 Go (8 Go recommandés).
*   **Espace Disque** : 200 Mo pour l'application + espace pour vos fichiers audio.

### Installation sur Windows
1.  Téléchargez le fichier `Runtime Live Machine Pro Setup 1.0.0.exe` depuis le site officiel ou le dépôt.
2.  Double-cliquez sur l'exécutable.
3.  Le programme d'installation automatique copiera les fichiers et créera un raccourci sur le Bureau.
4.  Une fois terminé, l'application se lancera automatiquement.

> **Note de Sécurité** : Comme le logiciel est mis à jour fréquemment, Windows SmartScreen pourrait afficher un avertissement "PC protégé par Windows". Cliquez sur **"Informations complémentaires"** puis sur **"Exécuter quand même"**. Le logiciel est sûr, signé et exempt de logiciels malveillants.

### Installation sur macOS
1.  Téléchargez le fichier `.dmg`.
2.  Ouvrez le fichier image et faites glisser l'icône de **Runtime Live Machine Pro** dans le dossier **Applications**.
3.  Au premier lancement, vous devrez peut-être autoriser l'application dans *Réglages Système > Sécurité et confidentialité*.

---

## 1.3 L'Écran de Bienvenue (Welcome Screen)

Au premier lancement, vous serez accueilli par le nouvel **Welcome Screen** en disposition horizontale. C'est votre tableau de bord de départ, conçu pour vous permettre de commencer à travailler en quelques secondes.

### Éléments de l'Écran
1.  **Nouveau Logo** : Le logo Pro (5 barres de VU-mètre avec un triangle de lecture) identifie la version stable du logiciel.
2.  **État de la Version** : Sous le logo, vous verrez le numéro de la version actuelle (ex. `v1.0.0`).
    *   ✅ **Vert** : Vous avez la dernière version disponible.
    *   ⬇️ **Jaune/Orange** : Une mise à jour est disponible.
3.  **Sélecteur de Langue** : En haut à droite, vous trouverez les drapeaux (8 langues supportées) pour changer instantaneamente l'interface.
    *   *Langues* : IT, EN, FR, DE, ES, PT, RU, ZH.
    *   Votre choix est mémorisé dans le profil utilisateur.

### Actions Disponibles
*   **Nouveau Projet (New Project)** : Crée une session vide. Les 5 colonnes (Assets, Music, Voice, SFX, PRE-SHOW) seront prêtes pour le chargement des fichiers.
*   **Charger un Projet (Load Project)** : Ouvre un fichier `.lmp` existant. RRLMP effectuera un contrôle d'intégrité : si des fichiers audio manquent, ils seront mis en évidence en rouge.
*   **Manuel en Ligne** : Ouvre la documentation mise à jour dans votre navigateur.

> **Premier Lancement** : RRLMP se lance de préférence en plein écran. Une fois un projet chargé, vous remarquerez le badge **PRO** cyan dans l'en-tête, confirmant la licence et la stabilité du moteur audio.
