#import "../lib/manuale-template.typ": *

= Gestion des projets et sécurité des données
<chapitre-10-gestion-des-projets-et-sécurité-des-données>

Préparer une émission prend du temps. Il faut sélectionner les fichiers,
les ranger dans les colonnes, régler les volumes et les fondus,
attribuer les touches. Tout ce travail doit pouvoir survivre à n'importe
quel imprévu, qu'il s'agisse d'un plantage du système, d'un changement
d'ordinateur ou du simple retour à un épisode archivé des mois
auparavant.

RLMP protège vos données à plusieurs niveaux, chacun pensé pour couvrir
un risque bien précis.

== 10.1 Le fichier de projet (.lmp)
<le-fichier-de-projet-.lmp>
Tout l'état d'une émission (la disposition des clips dans les colonnes,
les noms personnalisés, les volumes et les fondus, les cue points de
l'éditeur, les notes de la NoteBoard, les mappings MIDI et clavier, la
couleur des colonnes) est enregistré dans un fichier portant l'extension
#strong[`.lmp`] (Live Machine Project).

Le format est du JSON, donc un simple fichier texte structuré, lisible
avec n'importe quel éditeur et sans dépendance propriétaire. Si RLMP
venait un jour à disparaître, les données du projet resteraient
accessibles.

#strong[Ce que contient le fichier `.lmp` :] tous les réglages énumérés
ci-dessus, y compris les chemins absolus vers les fichiers audio
référencés.

#strong[Ce qu'il ne contient pas~:] les fichiers audio eux-mêmes. Le
`.lmp` mémorise où se trouvent les fichiers sur le disque, il ne copie
pas leur contenu. Un fichier de projet pèse généralement de l'ordre du
kilo-octet, quels que soient le nombre et la taille des fichiers audio
qu'il référence.

À l'ouverture, RLMP valide le fichier~: les identifiants dupliqués sont
reconstruits, les valeurs hors échelle ramenées dans des limites saines.
Si le projet a été créé avec une version antérieure, les colonnes
introduites depuis (Jingle, Promo) sont ajoutées automatiquement, sans
toucher aux données existantes.

== 10.2 Enregistrement
=== Enregistrement rapide
L'entrée #emph[Enregistrer le projet] du menu FILE enregistre
immédiatement le fichier `.lmp` ouvert, sans boîte de dialogue. Elle
passe au jaune dès qu'il y a des modifications non enregistrées~: un
simple coup d'œil suffit pour le savoir. Utilisez-la souvent pendant la
préparation de l'émission.

L'enregistrement est #strong[atomique]~: le fichier est d'abord écrit
dans une copie temporaire, puis renommé à la volée. Ainsi, même si
l'ordinateur s'éteint en pleine écriture, le `.lmp` original ne se
retrouve jamais à moitié écrit.

=== Enregistrer sous
L'entrée #emph[Enregistrer sous…] ouvre toujours la boîte de dialogue,
même si le projet a déjà un nom. Utilisez-la pour~:

- Créer des versions progressives de la même émission
  (`Ep47_brouillon.lmp`, `Ep47_v2.lmp`, `Ep47_final.lmp`).
- Enregistrer une variante avec des configurations différentes.
- Créer un nouveau fichier sans écraser le fichier courant.

=== Protection à la fermeture
<protection-à-la-fermeture>
RLMP surveille en permanence l'état des modifications. Si vous tentez de
fermer le logiciel, ou d'ouvrir un nouveau projet, alors que des
modifications ne sont pas enregistrées, l'opération est suspendue et une
demande de confirmation s'affiche~: enregistrer, abandonner les
modifications ou annuler. Impossible donc de perdre son travail sur un
simple clic malheureux.

== 10.3 Sauvegarde automatique et autosave
Au-delà des enregistrements manuels, le logiciel maintient aussi un
filet de protection automatique.

#strong[Copie de sécurité du projet.] À chaque mise à jour en
arrière-plan d'un projet déjà enregistré, RLMP conserve à côté du `.lmp`
une copie `.bak` reflétant le dernier état valide.

#strong[Autosave à rotation.] RLMP écrit en parallèle des instantanés de
l'état courant dans un dossier dédié de l'application, `autosaves`,
nommés d'après la date et l'heure. Seuls les #strong[dix instantanés les
plus récents] sont conservés, les plus anciens étant supprimés au fur et
à mesure. Ce filet protège même le travail effectué sur un projet «~sans
titre~» jamais enregistré sur le disque.

Le dossier `autosaves` se trouve dans le répertoire de données de
l'application~:

- #strong[Windows~:] `%APPDATA%\runtime-live-machine-pro\autosaves\`
- #strong[macOS~:]
  `~/Library/Application Support/runtime-live-machine-pro/autosaves/`
- #strong[Linux~:] `~/.config/runtime-live-machine-pro/autosaves/`

#strong[Comment récupérer.] Si le fichier `.lmp` principal est corrompu,
ou si l'ordinateur s'est éteint brutalement, ouvrez le dossier
`autosaves`, repérez l'instantané dont l'horodatage est le plus proche
du moment de l'interruption, puis chargez-le depuis RLMP comme un
fichier de projet ordinaire. Vous pouvez aussi renommer le fichier
`.bak` situé à côté du projet en `.lmp` et l'ouvrir directement.

== 10.4 Exporter le projet avec l'audio
Comme le fichier `.lmp` ne contient que les chemins vers les fichiers
audio, et non les fichiers eux-mêmes, un projet est fragile~: si vous
déplacez, renommez ou supprimez ne serait-ce qu'un seul des fichiers
sources, le clip correspondant passe au rouge. La fonction
#strong[Exporter le projet avec l'audio], dans le menu FILE (juste sous
#emph[Enregistrer sous…]), résout le problème à la racine en consolidant
tout l'audio à l'intérieur du projet.

=== Comment ça marche
<comment-ça-marche>
RLMP analyse tous les chemins vers les fichiers audio du projet, crée un
sous-dossier `audio/` à côté du fichier `.lmp` et #strong[copie
physiquement] chaque fichier référencé à l'intérieur. Les fichiers déjà
présents et identiques ne sont pas recopiés~; les doublons de nom sont
renommés pour éviter tout écrasement, et les fichiers orphelins, ceux
qui ne sont plus référencés, sont retirés du dossier.

La différence par rapport à une simple sauvegarde tient à ce qui se
passe #strong[après] la copie~: RLMP #strong[repointe chaque clip vers
la nouvelle copie] dans `audio/` et #strong[réenregistre le projet]. Dès
lors, le dossier `audio/` n'est pas une archive de secours posée à côté
du projet, mais la source depuis laquelle la session lit réellement
l'audio.

=== Le résultat~: vous pouvez supprimer les originaux
<le-résultat-vous-pouvez-supprimer-les-originaux>
Comme le projet pointe désormais vers les copies dans `audio/`,
#strong[les fichiers audio à leur emplacement d'origine ne servent plus]
et vous pouvez les supprimer en toute sécurité~: l'émission continue de
fonctionner en lisant depuis l'archive. C'est là toute la différence
avec les versions précédentes, où le dossier `audio/` restait un doublon
orphelin et où supprimer les originaux cassait les clips.

Le dossier du projet devient ainsi autonome~: `.lmp` plus sous-dossier
`audio/`, tout le nécessaire pour diffuser l'émission, prêt à être
archivé, copié ou transporté sur un autre ordinateur équipé de RLMP.

Quelques détails utiles~:

- L'opération est #strong[répétable]~: si vous ajoutez de nouveaux clips
  et réexportez, RLMP ne copie que les fichiers nouveaux et réaligne le
  projet, sans dupliquer ceux qui sont déjà archivés.
- Le raccrochage à l'archive #strong[n'entre pas dans l'historique
  Annuler/Répéter]~: un #emph[Annuler] ramènerait les clips vers les
  originaux, que vous avez peut-être déjà supprimés.
- La référence à l'archive est un #strong[chemin absolu]. Tant que le
  dossier du projet reste où il est, tout fonctionne~; si vous le
  déplacez ailleurs, les chemins doivent être régénérés par un nouvel
  export depuis le nouvel emplacement.

#suggerimento[
Utilisez #emph[Exporter le projet avec l'audio]
à la fin de la préparation de chaque émission pour consolider l'audio
dans le projet. Vous obtiendrez un «~master~» compact et portable, et
vous pourrez libérer de l'espace en supprimant les fichiers épars depuis
lesquels vous aviez importé.
]

=== Contrôle d'intégrité à l'ouverture
<contrôle-dintégrité-à-louverture>
À chaque ouverture d'un fichier `.lmp`, RLMP lance un #strong[contrôle
d'intégrité] automatique et vérifie que chaque fichier audio référencé
est accessible. Les fichiers manquants sont signalés par une bordure
rouge et l'étiquette FICHIER MANQUANT sur la carte correspondante,
tandis que le reste du projet, tous les clips dont les fichiers sont
bien là, reste pleinement fonctionnel.
