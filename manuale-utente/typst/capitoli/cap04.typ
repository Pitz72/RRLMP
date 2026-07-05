#import "../lib/manuale-template.typ": *

= Le workflow de base~: charger et diffuser

Le cycle de travail de Runtime Live Machine Pro tient en trois temps~:
importer les fichiers audio, les organiser dans la grille, les diffuser
en direct. Ce chapitre détaille chaque étape avec la précision voulue
pour travailler sereinement, même sous pression.

== 4.1 Importer les fichiers audio
RLMP ne propose ni navigateur de fichiers interne ni bibliothèque
centralisée. Tout passe par le #strong[glisser-déposer], directement
depuis le gestionnaire de fichiers du système (Explorateur sous Windows,
Finder sous macOS, Nautilus ou équivalent sous Linux). Le menu FILE
permet aussi d'importer une playlist #strong[M3U] et de la convertir en
séquence de clips.

=== Le geste de base
+ Ouvrez le dossier de votre ordinateur où se trouvent les fichiers
  audio.
+ Sélectionnez un ou plusieurs fichiers. Pour en sélectionner
  plusieurs~: `Ctrl+clic` pour une sélection discontinue, `Shift+clic`
  pour une sélection continue.
+ Faites glisser les fichiers sélectionnés au-dessus de l'une des
  colonnes de la grille et relâchez. Pour les effets sonores,
  glissez-les directement sur le pad FX (Chapitre 7).

Chaque fichier génère une carte dans la colonne de destination. En cas
de glissement multiple, les cartes se créent dans l'ordre d'apparition
des fichiers dans le gestionnaire, de haut en bas.

#strong[Indicateur d'insertion.] Une ligne bleue lumineuse court le long
de la colonne pendant le glissement et marque la position exacte
d'insertion. Vous pouvez ainsi placer un nouveau clip en haut, en bas,
ou à un endroit précis entre deux autres.

=== Formats pris en charge
Le moteur FFmpeg intégré garantit la compatibilité avec un large
éventail de formats audio~:

#figure(
  align(center)[#table(
    columns: (33.33%, 33.33%, 33.33%),
    align: (auto,auto,auto,),
    table.header([Format], [Extension], [Notes],),
    table.hline(),
    [MP3], [`.mp3`], [Tous les bitrates],
    [WAV], [`.wav`], [PCM non compressé, toute profondeur de bits],
    [FLAC], [`.flac`], [Lossless, tout sample rate],
    [AAC / M4A], [`.aac`, `.m4a`], [Inclut les fichiers d'iTunes/Apple
    Music],
    [OGG Vorbis], [`.ogg`], [],
    [Opus], [`.opus`], [],
    [WMA], [`.wma`], [Windows Media Audio],
    [WebM / MP4], [`.webm`, `.mp4`], [Pistes audio contenues dans ces
    conteneurs],
  )]
  , kind: table
  )

#strong[Une remarque sur les performances.] Le protocole de streaming
`media://` évite tout chargement des fichiers audio en mémoire vive au
moment de l'importation. Un WAV non compressé de 2 Go se comporte
exactement comme un MP3 de 5 Mo~: chargement instantané, impact
négligeable sur la mémoire système. Le CPU n'est sollicité que pendant
le décodage actif, autrement dit pendant la lecture.

=== Le chemin des fichiers
RLMP mémorise le #strong[chemin absolu] du fichier sur le disque, pas
une copie du fichier. Déplacez, renommez ou supprimez l'original, et la
carte correspondante devient rouge, illisible. Pour travailler sur
plusieurs ordinateurs ou créer des archives portables, la fonction
#strong[Exporter le projet avec l'audio] (Chapitre 10) reste la
meilleure option.

== 4.2 Lecture~: lancer et arrêter les clips
<lecture-lancer-et-arrêter-les-clips>
=== Lancer un clip
Un #strong[clic gauche] sur la carte suffit à lancer la lecture. Le
retour est immédiat~: la carte s'allume en vert actif, le minuteur passe
en compte à rebours, et les VU meter de l'en-tête reflètent aussitôt le
signal de sortie.

Si une touche du clavier a été attribuée au clip (voir Chapitre 8), elle
fait aussi bien l'affaire que le clic. Pratique quand vous travaillez
ailleurs dans l'interface et préférez ne pas quitter le clavier.

=== Arrêter un clip
<arrêter-un-clip>
#strong[Clic sur le clip actif] --- le clip entre en phase de
#strong[fondu de sortie] et s'arrête dans le temps configuré dans ses
propriétés (voir Chapitre 5).

#strong[Touche `Échap`] --- arrête instantanément tous les clips actifs.
C'est la commande d'urgence, active dès que RLMP est la fenêtre au
premier plan, même en pleine saisie dans un champ de texte.

#strong[Bouton STOP ALL] dans l'en-tête --- identique à `Échap`,
accessible à la souris.

=== La logique d'exclusion par colonne
Dans la plupart des colonnes, RLMP applique la règle #strong[«~un clip à
la fois~»]~: diffusez le #emph[Morceau A] dans la colonne Musiques,
cliquez sur le #emph[Morceau B] de la même colonne, et le premier
s'arrête en fondu pendant que le second démarre. Inutile d'arrêter
manuellement un clip avant d'en lancer un autre.

Les #strong[effets du pad FX] échappent à cette règle~: ils se
superposent à tout, effets compris, sans jamais interrompre ce qui joue
déjà. Un applaudissement peut ainsi démarrer en plein milieu d'un
morceau sans en couper la lecture.

Même logique pour les clips en mode #strong[Stacco] (configurable dans
les propriétés, Chapitre 5)~: ils se superposent sans jamais arrêter les
autres clips de leur colonne.

== 4.3 Organiser la conduite
=== Réorganiser les clips
<réorganiser-les-clips>
L'ordre des clips se réorganise à tout moment, que ce soit pendant la
préparation de l'émission ou en plein direct.

#strong[Glissement interne.] Cliquez sur une carte, maintenez, puis
faites-la glisser vers le haut ou le bas dans la même colonne. La ligne
guide bleue indique où elle s'insérera, sans jamais interrompre les
lectures en cours.

#strong[Déplacement entre colonnes.] Un clip glissé d'une colonne à
l'autre #strong[hérite des règles de sa nouvelle colonne]~: une voix
préenregistrée déplacée vers la colonne Musiques subira le ducking
exactement comme un morceau musical.

C'est une opération puissante, à réserver à des choix délibérés ---
d'autant plus prudents pendant un direct.

=== Sélection multiple et suppression
<sélection-multiple-et-suppression>
Pour retirer plusieurs clips d'un coup~:

+ `Ctrl+clic` (Windows/Linux) ou `Cmd+clic` (macOS) sur chaque clip à
  sélectionner~: la bordure devient bleue.
+ Appuyez sur `Suppr` ou `Delete`. Au-delà d'un clip sélectionné, le
  logiciel demande confirmation.

Supprimer depuis la grille retire les clips du projet courant, pas les
fichiers audio du disque. En cas d'erreur, `Ctrl+Z` rattrape le coup.

#suggerimento[
Le direct commencé, videz la colonne
Pré-émission d'un coup, via une sélection multiple suivie de `Suppr`~:
c'est le moyen le plus rapide de dégager l'interface et de basculer en
mode opérationnel.
]

== 4.4 Repères de structure~: INTRO et OUTRO
<repères-de-structure-intro-et-outro>
Chaque clip peut recevoir deux #strong[marqueurs structurels],
configurés dans l'éditeur de forme d'onde (Chapitre 5)~:

- #strong[Intro Marker] --- le moment où la mélodie principale entre
  vraiment, après l'introduction instrumentale. Il indique précisément
  quand commencer à parler par-dessus l'intro.
- #strong[Outro Marker] --- le début de la coda finale, qui signale le
  bon moment pour préparer la transition vers la piste suivante.

À l'approche de ces points, la carte affiche un avis visuel~:

- #strong[INTRO: −MM:SS] --- compte à rebours jusqu'à l'Intro Marker.
- #strong[OUTRO IN: −MM:SS] --- compte à rebours jusqu'à l'Outro Marker,
  suivi de #strong[🚨 OUTRO] quand la coda a commencé.

Ces avis n'apparaissent que si les marqueurs ont été configurés. Sans
marqueur, la carte se contente du compte à rebours standard vers la fin
du morceau.
