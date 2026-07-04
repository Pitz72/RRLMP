# Chapitre 10 — Gestion des projets et sécurité des données

---

Préparer une émission prend du temps. Il faut sélectionner les fichiers, les ranger dans les colonnes, régler les volumes et les fondus, attribuer les touches. Tout ce travail doit pouvoir survivre à n'importe quel imprévu, qu'il s'agisse d'un plantage du système, d'un changement d'ordinateur ou du simple retour à un épisode archivé des mois auparavant.

RLMP protège vos données à plusieurs niveaux, chacun pensé pour couvrir un risque bien précis.

---

## 10.1 Le fichier de projet (.lmp)

Tout l'état d'une émission (la disposition des clips dans les colonnes, les noms personnalisés, les volumes et les fondus, les cue points de l'éditeur, les notes de la NoteBoard, les mappings MIDI et clavier, la couleur des colonnes) est enregistré dans un fichier portant l'extension **`.lmp`** (Live Machine Project).

Le format est du JSON, donc un simple fichier texte structuré, lisible avec n'importe quel éditeur et sans dépendance propriétaire. Si RLMP venait un jour à disparaître, les données du projet resteraient accessibles.

**Ce que contient le fichier `.lmp` :** tous les réglages énumérés ci-dessus, y compris les chemins absolus vers les fichiers audio référencés.

**Ce qu'il ne contient pas :** les fichiers audio eux-mêmes. Le `.lmp` mémorise où se trouvent les fichiers sur le disque, il ne copie pas leur contenu. Un fichier de projet pèse généralement de l'ordre du kilo-octet, quels que soient le nombre et la taille des fichiers audio qu'il référence.

À l'ouverture, RLMP valide le fichier : les identifiants dupliqués sont reconstruits, les valeurs hors échelle ramenées dans des limites saines. Si le projet a été créé avec une version antérieure, les colonnes introduites depuis (Jingle, Promo) sont ajoutées automatiquement, sans toucher aux données existantes.

---

## 10.2 Enregistrement

### Enregistrement rapide

L'entrée *Enregistrer le projet* du menu FILE enregistre immédiatement le fichier `.lmp` ouvert, sans boîte de dialogue. Elle passe au jaune dès qu'il y a des modifications non enregistrées : un simple coup d'œil suffit pour le savoir. Utilisez-la souvent pendant la préparation de l'émission.

L'enregistrement est **atomique** : le fichier est d'abord écrit dans une copie temporaire, puis renommé à la volée. Ainsi, même si l'ordinateur s'éteint en pleine écriture, le `.lmp` original ne se retrouve jamais à moitié écrit.

### Enregistrer sous

L'entrée *Enregistrer sous…* ouvre toujours la boîte de dialogue, même si le projet a déjà un nom. Utilisez-la pour :

- Créer des versions progressives de la même émission (`Ep47_brouillon.lmp`, `Ep47_v2.lmp`, `Ep47_final.lmp`).
- Enregistrer une variante avec des configurations différentes.
- Créer un nouveau fichier sans écraser le fichier courant.

### Protection à la fermeture

RLMP surveille en permanence l'état des modifications. Si vous tentez de fermer le logiciel, ou d'ouvrir un nouveau projet, alors que des modifications ne sont pas enregistrées, l'opération est suspendue et une demande de confirmation s'affiche : enregistrer, abandonner les modifications ou annuler. Impossible donc de perdre son travail sur un simple clic malheureux.

---

## 10.3 Sauvegarde automatique et autosave

Au-delà des enregistrements manuels, le logiciel maintient aussi un filet de protection automatique.

**Copie de sécurité du projet.** À chaque mise à jour en arrière-plan d'un projet déjà enregistré, RLMP conserve à côté du `.lmp` une copie `.bak` reflétant le dernier état valide.

**Autosave à rotation.** RLMP écrit en parallèle des instantanés de l'état courant dans un dossier dédié de l'application, `autosaves`, nommés d'après la date et l'heure. Seuls les **dix instantanés les plus récents** sont conservés, les plus anciens étant supprimés au fur et à mesure. Ce filet protège même le travail effectué sur un projet « sans titre » jamais enregistré sur le disque.

Le dossier `autosaves` se trouve dans le répertoire de données de l'application :

- **Windows :** `%APPDATA%\runtime-live-machine-pro\autosaves\`
- **macOS :** `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- **Linux :** `~/.config/runtime-live-machine-pro/autosaves/`

**Comment récupérer.** Si le fichier `.lmp` principal est corrompu, ou si l'ordinateur s'est éteint brutalement, ouvrez le dossier `autosaves`, repérez l'instantané dont l'horodatage est le plus proche du moment de l'interruption, puis chargez-le depuis RLMP comme un fichier de projet ordinaire. Vous pouvez aussi renommer le fichier `.bak` situé à côté du projet en `.lmp` et l'ouvrir directement.

---

## 10.4 Export Package : portabilité complète

Le fichier `.lmp` ne contient que les chemins vers les fichiers audio, jamais les fichiers eux-mêmes. Transporter un projet vers un autre ordinateur demande donc de la prudence : si la machine de destination n'a pas les fichiers aux mêmes chemins absolus, les clips passent au rouge. C'est exactement ce que résout la fonction **Exporter l'archive autonome** (Export Package), dans le menu FILE.

### Comment ça marche

RLMP analyse tous les chemins vers les fichiers audio du projet, crée un sous-dossier `audio/` et **copie physiquement** chaque fichier référencé à l'intérieur. Les fichiers déjà présents et identiques ne sont pas recopiés, les doublons de nom sont renommés pour éviter tout écrasement, et les fichiers orphelins, ceux qui ne sont plus référencés, sont retirés du dossier.

L'opération a deux modes :

- **À côté du projet** — si vous exportez vers le dossier où réside déjà le `.lmp`, RLMP synchronise le sous-dossier `audio/` à côté de lui.
- **Dossier libre** — si vous choisissez un nouveau dossier (une clé USB, un NAS), RLMP y écrit un `project.lmp` avec les chemins déjà mis à jour pour pointer vers le sous-dossier `audio/` local.

### Le résultat

Le dossier de destination devient ainsi autonome : il réunit tout ce qu'il faut pour diffuser l'émission sur n'importe quel ordinateur équipé de RLMP, quelle que soit la structure de dossiers de cette machine.

> **Bonne pratique.** Utilisez Exporter l'archive autonome à la fin de la préparation de chaque émission pour créer un « master » à emporter en studio ou à archiver. En cas de pépin technique de dernière minute, vous aurez toujours sous la main une copie complète et prête à l'emploi.

### Contrôle d'intégrité à l'ouverture

À chaque ouverture d'un fichier `.lmp`, RLMP lance un **contrôle d'intégrité** automatique et vérifie que chaque fichier audio référencé est accessible. Les fichiers manquants sont signalés par une bordure rouge et l'étiquette FICHIER MANQUANT sur la carte correspondante, tandis que le reste du projet, tous les clips dont les fichiers sont bien là, reste pleinement fonctionnel.
