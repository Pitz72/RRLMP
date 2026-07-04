# Chapitre 14 — Résolution des problèmes et FAQ

---

Ce chapitre rassemble les problèmes les plus courants dans l'usage quotidien de Runtime Live Machine Pro, avec leurs solutions. Chaque section décrit le symptôme, la cause la plus probable et la procédure de résolution.

---

## 14.1 Problèmes audio

### Le minuteur défile et les VU meter bougent, mais on n'entend rien

Le logiciel diffuse correctement (le signal est présent dans le bus interne), mais il n'atteint pas le périphérique d'écoute.

**Vérifiez dans l'ordre :**

1. **Master Volume.** Le curseur de l'en-tête est-il à zéro ? Portez-le à 100 %.
2. **Périphérique de sortie.** Ouvrez Paramètres → *Audio & Mix* et contrôlez quel périphérique est sélectionné. Windows et macOS peuvent changer l'identifiant des périphériques USB lorsqu'ils sont débranchés et rebranchés. Si le nom ne correspond pas à celui physiquement connecté, sélectionnez-le de nouveau.
3. **Mixeur externe.** Si le signal arrive à un mixeur matériel, contrôlez que le fader du canal n'est pas baissé ou en mute, et que la sortie du mixeur est reliée aux moniteurs ou à la chaîne de diffusion.

### L'audio saute, grésille ou a des interruptions

En conditions normales, le moteur audio est robuste face à ces artefacts. S'ils se produisent, la cause est presque toujours externe au logiciel.

- **CPU sous charge extrême.** Fermez les applications lourdes en parallèle (montage vidéo, rendu, sauvegardes intensives).
- **Buffer audio trop bas.** Avec une carte son professionnelle, contrôlez la valeur de buffer dans le panneau de contrôle du driver. Une valeur de 256 ou 512 échantillons est le bon équilibre ; sous 128 échantillons, des dropouts peuvent apparaître.
- **Disque lent ou sous stress.** RLMP diffuse l'audio en streaming depuis le disque. Un disque mécanique lent, ou un SSD presque plein, peut causer des interruptions sur les fichiers volumineux.

### Le niveau audio est trop bas ou trop haut

- **Gain par clip.** Réglez le Gain dans les propriétés du clip (clic droit → section Volume).
- **Master Volume.** Si le niveau global est incorrect, agissez sur le curseur de l'en-tête.
- **Homologation et Master Chain.** L'homologation du volume rapproche les niveaux des clips d'une référence commune ; le glue de la Master Chain peut rendre le son plus compact. Si un résultat ne vous convainc pas, vous pouvez régler ou désactiver ces étages dans Paramètres → Master Chain.

---

## 14.2 Clips rouges et fichiers manquants

### Une carte est devenue rouge (« FICHIER MANQUANT ») et ne répond pas au clic

La bordure rouge indique que le fichier audio n'est pas accessible au chemin mémorisé dans le projet.

**Causes possibles :**

- Le fichier a été déplacé ou renommé sur le disque.
- Le fichier était sur un disque externe ou une clé USB maintenant déconnectée.
- Le projet a été ouvert sur un ordinateur différent, où les chemins ne correspondent pas.

**Solutions :**

1. **Reconnectez le disque.** Si le fichier était sur une unité externe, rebranchez-la.
2. **Remettez le fichier à sa position d'origine.** S'il a été déplacé, replacez-le à son chemin initial.
3. **Remplacez le clip.** Faites glisser de nouveau le bon fichier dans la grille et supprimez la carte rouge.
4. **Utilisez Exporter l'archive autonome à l'avenir.** La prévention la plus efficace consiste à créer une archive avant de déplacer ou de transférer le projet (Chapitre 10).

---

## 14.3 Problèmes MIDI

### Le contrôleur n'est pas détecté

1. **Connexion.** Vérifiez que le contrôleur est branché et reconnu par le système d'exploitation. RLMP détecte la connexion et la déconnexion des périphériques en temps réel ; s'il n'apparaît pas, débranchez et rebranchez le câble USB.
2. **Driver.** La plupart des contrôleurs USB-MIDI sont *class-compliant* et ne demandent pas de driver. Pour les surfaces professionnelles à driver propriétaire, vérifiez que le driver est installé.
3. **Vérification en mode Learn.** Activez MIDI Learn et appuyez sur une touche du contrôleur : si la carte reçoit le mapping, le contrôleur est détecté.

### Les clips mappés ne répondent pas aux touches du contrôleur

- **Le mode MIDI Learn est encore actif.** En MIDI Learn, les touches du contrôleur enregistrent de nouveaux mappings au lieu d'exécuter les clips. Désactivez le mode depuis le menu Outils.
- **Le mapping a été perdu.** Les mappings des clips sont dans le fichier `.lmp` ; vérifiez que le projet a été enregistré après la session de MIDI Learn. Les mappings des fonctions globales sont, eux, liés à l'ordinateur individuel.

---

## 14.4 Problèmes de démarrage

### L'application ne démarre pas sous macOS (avertissement Gatekeeper)

Voir la section 2.3 : déblocage via *Réglages Système → Confidentialité et sécurité*.

### L'application ne démarre pas sous Windows (avertissement SmartScreen)

Voir la section 2.2. Cliquez sur *Informations complémentaires* puis sur *Exécuter quand même*.

### Comportements anormaux au démarrage

Si le logiciel se comporte de façon inattendue à l'ouverture, fermez et rouvrez RLMP. Si le problème persiste, vérifiez que le chemin d'installation ne contient pas de caractères spéciaux susceptibles d'interférer avec le chargement des composants FFmpeg.

---

## 14.5 Questions fréquentes

**RLMP peut-il automatiser une radio 24 heures sur 24 sans surveillance ?**
Non. RLMP est conçu pour la régie live : des émissions tenues par un opérateur. Il ne dispose ni de programmation horaire ni de rotation automatique de la playlist. La vue Automix offre une automatisation limitée et volontaire du seul flux musical, active tant que la vue est ouverte (Chapitre 7). Pour l'automatisation 24h/24, il existe des logiciels dédiés (Zara Radio, PlayIt Live, Rivendell) : ils répondent à d'autres besoins.

**Quelle est la différence entre Enregistrer et Enregistrer sous ?**
*Enregistrer le projet* écrase le fichier `.lmp` ouvert, en silence. *Enregistrer sous…* ouvre toujours la boîte de dialogue et crée un nouveau fichier, sans toucher au fichier courant.

**Puis-je utiliser RLMP sur iPad ou sur des appareils mobiles ?**
Pas comme application principale : RLMP est un logiciel de bureau pour Windows, macOS et Linux. Une tablette ou un téléphone peuvent en revanche faire office de **télécommande** via navigateur, grâce au Contrôle à distance (Chapitre 11).

**Les fichiers `.lmp` des versions précédentes sont-ils compatibles avec la 1.11.5 ?**
Oui. À l'ouverture d'un projet créé avec une version précédente, RLMP en met à jour automatiquement la structure, colonnes ajoutées entre-temps comprises, sans modifier le fichier tant que vous n'effectuez pas d'enregistrement.

**Comment mettre RLMP à jour vers une nouvelle version ?**
Le logiciel vérifie les mises à jour au démarrage et vous avertit. Sous Windows et Linux AppImage, l'installation est automatique depuis la fenêtre de mise à jour ; sous macOS et Linux `.deb`, le navigateur est ouvert sur la page de téléchargement. Tous les détails au Chapitre 12.

**Où sont enregistrées les sauvegardes automatiques ?**
Dans le dossier `autosaves` du répertoire de données de l'application (`%APPDATA%\runtime-live-machine-pro\autosaves\` sous Windows ; chemins équivalents sous macOS et Linux, Chapitre 10). Les dix instantanés les plus récents sont conservés.

**Le logiciel fonctionne-t-il hors ligne ?**
Oui, entièrement. RLMP ne demande pas de connexion internet pour fonctionner. Le réseau n'est utilisé que pour la vérification des mises à jour (optionnelle) et pour le Contrôle à distance en réseau local (optionnel).

**Le Contrôle à distance ne se connecte pas. Pourquoi ?**
Vérifiez que l'appareil distant est sur le **même réseau** que l'ordinateur, que vous avez saisi le **PIN correct** (il change à chaque démarrage) et que vous utilisez l'adresse affichée dans les Paramètres. Rappelez-vous que le Contrôle à distance repart éteint à chaque démarrage de l'application (Chapitre 11).
