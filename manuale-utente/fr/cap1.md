# Chapitre 1 — Runtime Live Machine Pro : une philosophie

---

*Note de l'auteur*

Quinze ans de micros ouverts laissent une empreinte précise sur celui qui les a vécus. J'ai géré des podcasts, animé des talks, fait vivre une web radio, et pendant une bonne partie de ce temps j'ai tout fait seul : la conduite, la musique, les interviews, les volumes, le timing. Je sais ce que c'est de s'apercevoir en direct qu'un morceau va se terminer alors qu'on est encore en train de formuler l'idée qu'on veut exprimer. Je sais ce que signifie devoir baisser le fader d'une main et trouver le bon clip de l'autre, pendant que la troisième main — celle qu'on n'a pas — devrait vous tenir le fil du discours.

Runtime Live Machine Pro est né de cette frustration, et d'une conviction simple : la régie audio ne devrait pas être un métier en soi. Elle devrait être transparente. L'animateur, le podcasteur, le créateur de contenu qui mène seul un talk de nuit — sans un ingénieur du son pour lui servir d'appui — doit pouvoir se concentrer sur ce qu'il sait faire : parler, penser, construire la relation avec ceux qui l'écoutent. Le logiciel s'occupe du reste.

J'ai mis dans RLMP les règles qu'un bon réalisateur du son applique automatiquement : la hiérarchie entre les événements audio, le ducking qui se déclenche quand vous parlez, la musique qui s'arrête et reprend au bon moment. Des règles complexes, cachées sous une interface qui ne demande qu'un seul geste : cliquer sur le bon clip au bon moment.

Ce logiciel s'adresse avant tout à ceux qui gèrent de petites et moyennes talk radios, à ceux qui produisent des podcasts avec une ambition professionnelle, à ceux qui diffusent un live streaming sans équipe technique autour d'eux. Mais sa nature n'a rien d'exclusif : ceux qui travaillent dans des contextes plus structurés y trouveront des outils adaptés à leurs besoins. L'objectif est unique : rendre l'animateur indépendant de figures de soutien qui ne sont pas toujours là, et pas toujours nécessaires.

---

Chaque outil naît d'une réponse. Runtime Live Machine Pro répond à un problème précis : la régie audio en direct (radio, podcast, événements, théâtre) est une activité de performance, non d'automatisation. Elle exige un contrôle instantané, des nerfs solides et un logiciel qui ne vous trahit pas au mauvais moment.

Le logiciel installé sur votre ordinateur n'est pas un système de programmation musicale 24h/24, ni une STAN pour la post-production, ni un simple lecteur avec file d'attente. C'est autre chose : une **machine de régie en temps réel**, construite autour de l'idée que chaque émission est un acte unique, non reproductible, qui mérite un conteneur dédié et un contrôle chirurgical sur chaque transition.

---

## 1.1 Pour qui il a été conçu

Runtime Live Machine Pro s'adresse à deux types d'utilisateurs qui, malgré la différence de contexte, partagent le même besoin fondamental.

Le **professionnel du broadcast** — le réalisateur d'une radio commerciale, l'ingénieur du son d'un live streaming audio ou vidéo, l'animateur qui gère sa propre émission — trouvera dans RLMP un système à la hauteur des outils professionnels haut de gamme, avec l'agilité opérationnelle que ces systèmes sacrifient souvent sur l'autel de la complexité.

Le **créateur de contenu** — le podcasteur indépendant, l'animateur d'une web radio, l'organisateur d'événements en direct — trouvera un outil qui ne demande pas des années de formation technique pour être maîtrisé, mais qui ne fait aucun compromis sur la qualité du résultat.

L'un comme l'autre trouveront une interface qui répond instantanément à la touche, un moteur audio stable et un système de sauvegarde qui n'oublie rien.

---

## 1.2 La philosophie « Single Show »

Le concept fondateur de Runtime Live Machine Pro est le **projet isolé**. Chaque émission que vous réalisez — un épisode de podcast, un direct radio, un spectacle de théâtre — vit dans un fichier `.lmp` autonome qui contient tout : la disposition des clips, les volumes, les mappings MIDI, les points de cue, les notes de régie. Quand vous chargez ce fichier, vous retrouvez l'émission exactement telle que vous l'avez laissée.

Cette approche a des conséquences concrètes. Vous n'avez pas à reconfigurer le logiciel chaque fois que vous passez d'une émission à l'autre. Vous pouvez transporter un projet sur n'importe quel ordinateur — grâce à la fonction Export Package — en sachant qu'il fonctionnera. Vous pouvez archiver les épisodes passés et les rouvrir des mois plus tard sans mauvaise surprise.

Le fichier `.lmp` ne contient pas les fichiers audio physiques : il mémorise les chemins sur le disque. Pour le déplacement d'un ordinateur à l'autre, la fonction **Export Package** copie physiquement tout le nécessaire dans un dossier autonome.

---

## 1.3 L'architecture Main-Side-Heavy

Comprendre l'architecture interne n'est pas indispensable pour utiliser le logiciel, mais cela aide à saisir pourquoi certains problèmes communs à d'autres lecteurs ne se produisent pas ici.

Runtime Live Machine Pro est construit sur **Electron**, une plateforme qui sépare nettement le processus principal (*Main Process*, en Node.js) du processus de rendu de l'interface (*Renderer Process*). Cette séparation est exploitée de façon intentionnelle.

Toutes les opérations lourdes — décodage audio via FFmpeg, lecture des fichiers depuis le disque, analyse des formes d'onde, gestion des sauvegardes — sont déléguées au Main Process. Le Renderer s'occupe uniquement de l'interface : afficher les clips, animer les VU meter, répondre aux clics. Le résultat : une interface qui reste fluide même pendant les opérations intensives, et un moteur audio qui ne se dispute pas les ressources avec les pixels à l'écran.

Le protocole personnalisé `media://` garantit que les fichiers audio ne sont jamais chargés entièrement dans la mémoire vive : ils sont transmis en streaming directement du disque vers le lecteur. Vous pouvez gérer des fichiers WAV non compressés de plusieurs heures sans que la consommation mémoire de l'application varie de façon appréciable.

---

## 1.4 La grille de régie : une grammaire visuelle

L'interface opérationnelle de RLMP est organisée en colonnes verticales, chacune ayant un rôle sémantique précis. Avant même de lancer le logiciel, il vaut la peine de fixer cette grammaire.

Six colonnes sont visibles dans la grille principale. Une septième surface — le **pad FX**, la *jingle machine* des effets — vit en dehors de la grille, dans un panneau dédié décrit au Chapitre 7.

| Colonne | Couleur | Fonction |
|---|---|---|
| **Show Assets** | Vert | Génériques, bases, ambiances structurelles de l'émission |
| **Jingle** | Ambre | Jingles et stacchi identitaires récurrents |
| **Promo** | Cyan | Promos, autopromotions, annonces programmées |
| **Musiques de l'épisode** | Rouge | La playlist musicale |
| **Voix / Enregistrements** | Orange | Interviews, messages vocaux, blocs parlés |
| **Pré-émission** | Violet | Musique d'attente avant le direct, avec rotation de jingles et de promos |

Les trois premières colonnes (Show Assets, Jingle et Promo) partagent la même nature audio : ce sont des éléments de structure et de service, traités de la même manière par le moteur de mixage. La distinction est organisationnelle : séparer les génériques des jingles et des promos garde la conduite lisible même quand elle est chargée.

Chaque colonne a des comportements audio distincts — priorité dans le mixage, règles d'exclusion, valeurs de fondu — qui seront détaillés au Chapitre 6. Pour l'instant, il suffit de savoir que la position d'un clip dans la grille n'est pas décorative : elle détermine la façon dont le logiciel le traitera pendant la diffusion. Les colonnes dont vous n'avez pas besoin peuvent être masquées de la vue (Paramètres → Généraux → Disposition régie) sans perdre les clips qu'elles contiennent.

---

## 1.5 Version actuelle et mises à jour

Ce manuel décrit la version **1.11.5** de Runtime Live Machine Pro. Au démarrage, le logiciel vérifie en silence la disponibilité d'une version plus récente et, s'il en trouve une, ouvre un avis de mise à jour, jamais pendant un direct. Le système de mise à jour est décrit au Chapitre 12. Les fichiers de projet `.lmp` sont compatibles avec les versions ultérieures : mettre le logiciel à jour n'entraîne ni la perte ni la migration manuelle des projets existants.
