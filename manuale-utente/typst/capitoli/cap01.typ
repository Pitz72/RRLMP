#import "../lib/manuale-template.typ": *

= Runtime Live Machine Pro~: une philosophie

#emph[Note de l'auteur]

Quinze ans de micro ouvert, ça laisse des traces. J'ai animé des
podcasts, mené des talks, fait tourner une web radio, et pendant
longtemps j'ai tout fait seul~: la conduite, la musique, les interviews,
les volumes, le timing. Cette sensation de voir un morceau filer vers sa
fin alors qu'on cherche encore ses mots, je la connais bien. Devoir
baisser le fader d'une main et attraper le bon clip de l'autre, pendant
qu'une troisième main imaginaire tiendrait le fil du discours~: je suis
passé par là plus souvent qu'à mon tour.

Runtime Live Machine Pro est né de cette frustration et d'une conviction
simple~: la régie audio ne devrait pas être un métier à part entière,
elle devrait se faire oublier. L'animateur, le podcasteur, le créateur
de contenu qui mène seul un talk nocturne, sans ingénieur du son pour
l'épauler, doit pouvoir se concentrer sur son vrai travail~: parler,
penser, construire une relation avec son audience. Le logiciel prend le
reste à sa charge.

RLMP intègre les réflexes qu'un bon réalisateur son applique sans y
penser~: la hiérarchie entre les événements audio, le ducking qui
s'active dès que vous parlez, la musique qui s'interrompt puis reprend
au bon instant. Ce sont des mécanismes complexes, mais ils restent
invisibles derrière une interface qui ne demande qu'un geste~: cliquer
sur le bon clip au bon moment.

Ce logiciel vise d'abord ceux qui font vivre de petites ou moyennes talk
radios, ceux qui produisent des podcasts avec de vraies ambitions, ceux
qui diffusent un live streaming sans équipe technique. Il ne s'enferme
pourtant dans aucune niche~: les équipes plus structurées y trouveront
elles aussi de quoi travailler efficacement. Un seul objectif le guide~:
affranchir l'animateur de renforts qui ne sont pas toujours présents, et
qui ne sont pas toujours indispensables non plus.

Un outil naît toujours en réponse à quelque chose. Celle de Runtime Live
Machine Pro est précise~: la régie audio en direct (radio, podcast,
événementiel, théâtre) relève de la performance, pas de
l'automatisation. Elle demande un contrôle instantané, des nerfs solides
et un logiciel qui ne lâche jamais au pire moment.

Ce que vous installez n'est ni un système de programmation musicale
tournant 24 heures sur 24, ni une STAN pensée pour la post-production,
ni un simple lecteur à file d'attente. C'est autre chose~: une
#strong[machine de régie en temps réel], conçue autour d'une idée
directrice --- chaque émission est un acte unique, non reproductible,
qui mérite un contenant dédié et un contrôle précis sur chaque
transition.

== 1.1 Pour qui il a été conçu
<pour-qui-il-a-été-conçu>
Runtime Live Machine Pro s'adresse à deux types d'utilisateurs qui,
malgré la différence de contexte, partagent le même besoin fondamental.

Le #strong[professionnel du broadcast] (réalisateur d'une radio
commerciale, ingénieur du son d'un live streaming audio ou vidéo,
animateur qui gère sa propre émission) trouvera dans RLMP un système à
la hauteur des outils professionnels haut de gamme, sans l'agilité
opérationnelle que ces systèmes sacrifient trop souvent à la complexité.

Le #strong[créateur de contenu] (podcasteur indépendant, animateur d'une
web radio, organisateur d'événements en direct) trouvera un outil
accessible sans des années de formation technique, mais qui ne transige
jamais sur la qualité du résultat.

Dans les deux cas, l'utilisateur retrouvera une interface qui répond
instantanément à la touche, un moteur audio stable et un système de
sauvegarde qui n'oublie rien.

== 1.2 La philosophie «~Single Show~»
Le concept fondateur de Runtime Live Machine Pro tient en une idée~: le
#strong[projet isolé]. Chaque émission que vous réalisez, qu'il s'agisse
d'un épisode de podcast, d'un direct radio ou d'un spectacle de théâtre,
vit dans un fichier `.lmp` autonome qui contient tout~: la disposition
des clips, les volumes, les mappings MIDI, les points de cue, les notes
de régie. Chargez ce fichier, et vous retrouvez l'émission exactement
telle que vous l'avez laissée.

Cette approche a des conséquences bien concrètes. Plus besoin de
reconfigurer le logiciel à chaque changement d'émission. Un projet se
transporte sur n'importe quel ordinateur grâce à la fonction Exporter le
projet avec l'audio, avec la garantie qu'il fonctionnera. Les épisodes
passés s'archivent et se rouvrent des mois plus tard sans mauvaise
surprise.

Le fichier `.lmp` ne contient pas les fichiers audio physiques~: il
mémorise les chemins sur le disque. Pour le déplacement d'un ordinateur
à l'autre, la fonction #strong[Exporter le projet avec l'audio] copie
physiquement tout le nécessaire dans un dossier autonome.

== 1.3 L'architecture Main-Side-Heavy
Comprendre l'architecture interne n'a rien d'indispensable pour utiliser
le logiciel. Cela aide néanmoins à saisir pourquoi certains problèmes
fréquents chez d'autres lecteurs n'apparaissent pas ici.

Runtime Live Machine Pro repose sur #strong[Electron], une plateforme
qui sépare nettement le processus principal (#emph[Main Process], en
Node.js) du processus de rendu de l'interface (#emph[Renderer Process]).
Cette séparation n'a rien d'accidentel~: elle est exploitée
délibérément.

Le Main Process prend en charge toutes les opérations lourdes~: décodage
audio via FFmpeg, lecture des fichiers depuis le disque, analyse des
formes d'onde, gestion des sauvegardes. Le Renderer, lui, s'occupe
uniquement de l'interface --- afficher les clips, animer les VU meter,
répondre aux clics. Résultat~: une interface qui reste fluide même sous
forte charge, et un moteur audio qui ne se bat jamais pour les
ressources avec les pixels à l'écran.

Le protocole personnalisé `media://` garantit que les fichiers audio ne
sont jamais chargés en entier dans la mémoire vive~: ils circulent en
streaming, directement du disque vers le lecteur. Résultat, des fichiers
WAV non compressés de plusieurs heures se gèrent sans que la
consommation mémoire de l'application ne bouge de façon perceptible.

== 1.4 La grille de régie~: une grammaire visuelle
<la-grille-de-régie-une-grammaire-visuelle>
L'interface opérationnelle de RLMP s'organise en colonnes verticales,
chacune avec un rôle sémantique précis. Avant même de lancer le
logiciel, mieux vaut se familiariser avec cette grammaire.

Six colonnes sont visibles dans la grille principale. Une septième
surface --- le #strong[pad FX], la #emph[jingle machine] des effets ---
vit en dehors de la grille, dans un panneau dédié décrit au Chapitre 7.

#figure(
  align(center)[#table(
    columns: (33.33%, 33.33%, 33.33%),
    align: (auto,auto,auto,),
    table.header([Colonne], [Couleur], [Fonction],),
    table.hline(),
    [#strong[Show Assets]], [Vert], [Génériques, bases, ambiances
    structurelles de l'émission],
    [#strong[Jingle]], [Ambre], [Jingles et stacchi identitaires
    récurrents],
    [#strong[Promo]], [Cyan], [Promos, autopromotions, annonces
    programmées],
    [#strong[Musiques de l'épisode]], [Rouge], [La playlist musicale],
    [#strong[Voix / Enregistrements]], [Orange], [Interviews, messages
    vocaux, blocs parlés],
    [#strong[Pré-émission]], [Violet], [Musique d'attente avant le
    direct, avec rotation de jingles et de promos],
  )]
  , kind: table
  )

Les trois premières colonnes (Show Assets, Jingle et Promo) partagent la
même nature audio~: ce sont des éléments de structure et de service,
traités de façon identique par le moteur de mixage. Leur séparation
reste purement organisationnelle --- elle garde la conduite lisible,
même chargée, en distinguant clairement génériques, jingles et promos.

Chaque colonne possède des comportements audio distincts (priorité dans
le mixage, règles d'exclusion, valeurs de fondu), détaillés au Chapitre
\6. Retenez pour l'instant l'essentiel~: la position d'un clip dans la
grille n'a rien de décoratif, elle détermine comment le logiciel le
traitera pendant la diffusion. Les colonnes inutiles peuvent être
masquées (Paramètres → Généraux → Disposition régie) sans perdre les
clips qu'elles contiennent.

== 1.5 Version actuelle et mises à jour
<version-actuelle-et-mises-à-jour>
Ce manuel décrit la version #strong[1.15.10] de Runtime Live Machine
Pro. Au démarrage, le logiciel vérifie discrètement si une version plus
récente existe et, le cas échéant, affiche un avis de mise à jour ---
jamais pendant un direct. Le système de mise à jour fait l'objet du
Chapitre 12. Les fichiers de projet `.lmp` restent compatibles avec les
versions ultérieures~: une mise à jour n'entraîne ni perte ni migration
manuelle des projets existants.
