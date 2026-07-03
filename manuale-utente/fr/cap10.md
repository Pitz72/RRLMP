# Chapitre 10 — Gestion des projets et sécurité des données

---

Préparer une émission demande du temps : sélectionner les fichiers, les organiser dans les colonnes, configurer les volumes, régler les fondus, attribuer les touches. Ce travail est un patrimoine opérationnel qui doit survivre à tout imprévu : un plantage du système, un changement d'ordinateur, le retour à un épisode archivé des mois plus tôt.

RLMP aborde la sécurité des données à plusieurs niveaux, chacun conçu pour couvrir un risque précis.

---

## 10.1 Le fichier de projet (.lmp)

Tout l'état d'une émission (la disposition des clips dans les colonnes, les noms personnalisés, les volumes et les fondus, les cue points de l'éditeur, les notes de la NoteBoard, les mappings MIDI et clavier, la couleur des colonnes) est enregistré dans un fichier portant l'extension **`.lmp`** (Live Machine Project).

Le format est JSON : un fichier texte structuré, lisible par n'importe quel éditeur, non propriétaire. Si un jour RLMP n'était plus disponible, les données du projet resteraient accessibles.

**Ce que contient le fichier `.lmp` :** tous les réglages énumérés ci-dessus, y compris les chemins absolus vers les fichiers audio référencés.

**Ce qu'il ne contient pas :** les fichiers audio eux-mêmes. Le `.lmp` mémorise où se trouvent les fichiers sur le disque, il ne copie pas leur contenu. Un fichier de projet pèse généralement de l'ordre du kilo-octet, quels que soient le nombre et la taille des fichiers audio qu'il référence.

À l'ouverture, RLMP valide le fichier : il reconstruit les éventuels identifiants dupliqués, ramène les valeurs hors échelle dans des limites saines et, si vous ouvrez un projet créé avec une version précédente, ajoute automatiquement les colonnes introduites entre-temps (Jingle, Promo), sans toucher aux données existantes.

---

## 10.2 Enregistrement

### Enregistrement rapide

L'entrée *Enregistrer le projet* du menu FILE effectue un enregistrement immédiat sur le fichier `.lmp` ouvert. L'enregistrement est silencieux : aucune boîte de dialogue. L'entrée se met en jaune lorsqu'il y a des modifications non enregistrées, un rappel visuel en un coup d'œil. Utilisez-la fréquemment pendant la préparation de l'émission.

L'enregistrement est **atomique** : le fichier est d'abord écrit dans une copie temporaire, puis renommé à la volée. Si l'ordinateur s'éteint pendant l'écriture, le `.lmp` original n'est jamais laissé à moitié.

### Enregistrer sous

L'entrée *Enregistrer sous…* ouvre toujours la boîte de dialogue, même si le projet a déjà un nom. Utilisez-la pour :

- Créer des versions progressives de la même émission (`Ep47_brouillon.lmp`, `Ep47_v2.lmp`, `Ep47_final.lmp`).
- Enregistrer une variante avec des configurations différentes.
- Créer un nouveau fichier sans écraser le fichier courant.

### Protection à la fermeture

RLMP surveille en continu l'état des modifications. Si vous tentez de fermer le logiciel (ou d'ouvrir un nouveau projet) avec des modifications non enregistrées, l'opération est suspendue et une demande de confirmation apparaît, avec trois choix : enregistrer, abandonner les modifications ou annuler. Il n'est pas possible de perdre son travail par un clic accidentel sur la fermeture de la fenêtre.

---

## 10.3 Sauvegarde automatique et autosave

En plus des enregistrements que vous décidez, le logiciel maintient un filet de protection automatique.

**Copie de sécurité du projet.** Chaque fois qu'un projet déjà enregistré est mis à jour en arrière-plan, RLMP conserve à côté du `.lmp` une copie `.bak` avec le dernier état valide.

**Autosave à rotation.** En parallèle, RLMP écrit des instantanés de l'état courant dans un dossier dédié de l'application, `autosaves`, avec un nom basé sur la date et l'heure. Les **dix instantanés les plus récents** sont conservés : les plus anciens sont supprimés au fur et à mesure. Ce filet capture aussi le travail sur un projet « sans titre » jamais enregistré sur le disque.

Le dossier `autosaves` se trouve dans le répertoire de données de l'application :

- **Windows :** `%APPDATA%\runtime-live-machine-pro\autosaves\`
- **macOS :** `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- **Linux :** `~/.config/runtime-live-machine-pro/autosaves/`

**Comment récupérer.** Si le fichier `.lmp` principal s'est corrompu ou si l'ordinateur s'est éteint brutalement, ouvrez le dossier `autosaves`, repérez l'instantané dont la date et l'heure sont les plus proches du moment de l'interruption et chargez-le depuis RLMP comme un fichier de projet normal. Sinon, renommez le fichier `.bak` situé à côté du projet en `.lmp` et ouvrez-le.

---

## 10.4 Export Package : portabilité complète

Comme le fichier `.lmp` ne contient que les chemins vers les fichiers audio, non les fichiers eux-mêmes, transporter le projet sur un autre ordinateur demande de l'attention : si la machine de destination n'a pas les fichiers aux mêmes chemins absolus, les clips deviennent rouges. La fonction **Exporter l'archive autonome** (Export Package), dans le menu FILE, résout le problème à la racine.

### Comment ça marche

RLMP analyse tous les chemins vers les fichiers audio du projet, crée un sous-dossier `audio/` et **copie physiquement** chaque fichier référencé à l'intérieur. Les fichiers déjà présents et identiques ne sont pas recopiés ; les éventuels doublons de nom sont renommés pour ne pas s'écraser, et les fichiers orphelins (plus référencés) sont retirés du dossier.

L'opération a deux modes :

- **À côté du projet** — si vous exportez vers le dossier où réside déjà le `.lmp`, RLMP synchronise le sous-dossier `audio/` à côté de lui.
- **Dossier libre** — si vous choisissez un nouveau dossier (une clé USB, un NAS), RLMP y écrit un `project.lmp` avec les chemins déjà mis à jour pour pointer vers le sous-dossier `audio/` local.

### Le résultat

Le dossier de destination devient autonome : il contient tout le nécessaire pour diffuser l'émission sur n'importe quel ordinateur où RLMP est installé, indépendamment de la structure de dossiers de cette machine.

> **Bonne pratique.** Utilisez Exporter l'archive autonome à la fin de la préparation de chaque émission pour créer un « master » à emporter en studio ou à archiver. En cas de problème technique de dernière minute, vous aurez toujours une copie complète et portable prête à l'emploi.

### Contrôle d'intégrité à l'ouverture

Chaque fois que vous ouvrez un fichier `.lmp`, RLMP effectue un **contrôle d'intégrité** automatique : il vérifie que chaque fichier audio référencé est accessible. Les fichiers manquants sont signalés par la bordure rouge et l'étiquette FICHIER MANQUANT sur la carte correspondante. Le reste du projet, tous les clips dont les fichiers sont accessibles, reste pleinement fonctionnel.
