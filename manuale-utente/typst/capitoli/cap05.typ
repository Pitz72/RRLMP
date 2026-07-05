#import "../lib/manuale-template.typ": *

= Propriétés du clip et Waveform Editor
<chapitre-5-propriétés-du-clip-et-waveform-editor>

Aucun fichier audio n'arrive parfait dans la grille. Il y a toujours
quelques secondes de silence au début d'un enregistrement, une coda de
morceau qui n'en finit pas, une interview dont le niveau est trop bas
par rapport au reste de l'émission. Pas besoin pour autant d'ouvrir un
éditeur audio externe à chaque fois qu'un fichier n'est pas «~prêt pour
l'antenne~»~: RLMP intègre un panneau de configuration pour chaque clip,
avec un éditeur visuel de forme d'onde doté de fonctions de coupe et de
marquage.

Toutes ces modifications sont #strong[non destructives]~: le fichier
original reste intact sur le disque. RLMP mémorise les réglages dans le
fichier de projet `.lmp` et les applique à la volée, pendant la lecture.

Pour ouvrir les paramètres d'un clip, faites un #strong[clic droit] sur
la carte.

== 5.1 Propriétés de base
<propriétés-de-base>
#figure(image("../screenshots-fr/impostazioni-clip.png", alt: "Figure 5.1 — Les paramètres du clip : Clip Name, Color Label, Volume Gain, Playback Behavior, Autoplay Next et attribution des touches."),
  caption: [
    Figure 5.1 --- Les paramètres du clip~: Clip Name, Color Label,
    Volume Gain, Playback Behavior, Autoplay Next et attribution des
    touches.
  ]
)

=== Nom et apparence
#strong[Clip Name.] Vous pouvez donner au clip un nom personnalisé,
indépendant du nom de fichier original \; c'est ce nom qui s'affiche sur
la carte, dans la grille. Choisissez des noms descriptifs, pensés pour
l'antenne~: «~GÉNÉRIQUE D'OUVERTURE~» se repère bien plus vite que
`generique_rev3_final_def.mp3` quand il ne vous reste que trois secondes
pour trouver le bon clip.

#strong[Color Label.] Par défaut, le clip hérite de la couleur de sa
colonne, mais vous pouvez lui attribuer une couleur propre pour le faire
ressortir visuellement. C'est pratique pour repérer un clip critique,
comme le générique de clôture, ou pour distinguer des groupes
thématiques dans une même colonne.

=== Volume (Gain)
Le curseur de gain (Volume Gain) va de 0 % à 150 % et agit comme un
pré-fader propre à ce clip, en amont du Master Volume global.

L'usage le plus courant, c'est l'alignement des niveaux. Une voix
enregistrée trop bas, un message WhatsApp par exemple ou un appel
téléphonique, peut être poussée au-delà de 100 % pour se rapprocher du
volume des autres pistes. À l'inverse, un clip particulièrement
«~chaud~» se ramène à un niveau raisonnable sans toucher au Master
Volume.

== 5.2 L'éditeur de forme d'onde
<léditeur-de-forme-donde>
#figure(image("../screenshots-fr/waveform-editor.png", alt: "Figure 5.2 — L’éditeur de forme d’onde : poignées Trim Start/End, marqueurs Intro End et Outro Start, Auto-Trim, Smart Cues et fondus."),
  caption: [
    Figure 5.2 --- L'éditeur de forme d'onde~: poignées Trim Start/End,
    marqueurs Intro End et Outro Start, Auto-Trim, Smart Cues et fondus.
  ]
)

C'est la fonction la plus puissante du panneau de configuration. Il
occupe la zone centrale et affiche la représentation graphique de
l'audio du clip entier.

=== Navigation dans l'éditeur
<navigation-dans-léditeur>
#strong[Zoom horizontal.] La vue de la forme d'onde s'agrandit de 1×
(vue complète) jusqu'à 8×, par paliers (1×, 2×, 3×, 4×, 6×, 8×), avec le
curseur de zoom ou la molette de la souris au-dessus de l'éditeur. À
fort zoom, la vue suit la position de lecture en défilant
automatiquement.

#strong[Règle adaptative.] L'axe temporel, en haut de l'éditeur,
s'adapte au niveau de zoom~: espacé en vue complète, il se densifie
jusqu'à afficher les secondes au zoom maximal.

#strong[Playhead.] Pendant la lecture d'aperçu, un trait vertical blanc
parcourt la forme d'onde en temps réel pour indiquer la position
courante. Cliquer sur la forme d'onde déplace la lecture à l'endroit
choisi.

=== Les quatre poignées
<les-quatre-poignées>
L'éditeur comporte quatre #strong[poignées] déplaçables, chacune avec sa
fonction et sa couleur propres~:

#strong[Trim Start (poignée rouge, à gauche).] Définit le point de début
effectif du clip~: tout ce qui se trouve à gauche est ignoré pendant la
lecture. Faites-la glisser vers la droite pour couper les silences ou
les parties indésirables du début.

#strong[Trim End (poignée rouge, à droite).] Définit le point de fin
effectif~: tout ce qui se trouve à droite est ignoré. Faites-la glisser
vers la gauche pour raccourcir la coda. Trim Start et Trim End ne
peuvent jamais se chevaucher.

#strong[Intro End (poignée cyan).] Marque le point où la mélodie
principale entre dans le morceau, après l'éventuelle introduction. Une
fois ce marqueur défini, le compte à rebours #strong[INTRO~: −MM~:SS]
s'affiche sur la carte en lecture.

#strong[Outro Start (poignée orange).] Marque le début de la coda, en
général le moment idéal pour prendre la parole et meubler la transition.
Le compte à rebours #strong[OUTRO IN~: −MM~:SS] s'affiche sur la carte.
Si la valeur entre en conflit avec le trim ou avec la durée du clip, le
logiciel la désactive et vous prévient.

Au lieu de faire glisser les poignées, on peut aussi utiliser les quatre
boutons #emph[Set], qui placent chacune à la position courante du
playhead~: pratique pour marquer à la volée pendant l'écoute. Les
valeurs restent ajustables avec précision dans leurs champs respectifs.

=== Auto-Trim (baguette magique)
Le bouton à l'icône de #strong[baguette magique] lance la détection
automatique du silence via FFmpeg. Le seuil n'est pas fixe~: le logiciel
évalue d'abord le niveau moyen du fichier, puis fixe le seuil de silence
environ 25 dB en dessous, dans une plage de sécurité comprise entre −55
et −20 dB (à défaut d'estimation fiable, il se rabat sur −40 dB). Trim
Start et Trim End se positionnent alors automatiquement, ce qui élimine
silences initiaux et codas muettes sans intervention manuelle.

Cette fonction rend service surtout sur les enregistrements vocaux
bruts~: appels téléphoniques, messages audio, interviews captées sur
mobile. Appliquer l'Auto-Trim à toute la colonne Voix avant une émission
prend moins d'une minute et rend les transitions nettement plus propres.

#nota[
L'analyse a lieu dans le Main Process via
FFmpeg, sans charger le fichier en mémoire dans le Renderer. Même sur
des fichiers volumineux, elle ne prend que quelques secondes.
]

=== Smart Cues (détection automatique des marqueurs)
<smart-cues-détection-automatique-des-marqueurs>
À côté de l'Auto-Trim, la fonction #strong[Smart Cues] propose
automatiquement les marqueurs d'Intro et d'Outro. Avec un seuil plus
agressif, elle repère le point où l'audio atteint sa pleine énergie
(Intro) et celui où démarre le fondu final (Outro), et place les deux
marqueurs sans que vous ayez à les chercher à l'oreille.

=== Aperçu de la transition
<aperçu-de-la-transition>
S'il existe un clip #strong[suivant] dans la même colonne, le bouton
#strong[«~Test →~»] rejoue les dernières secondes du clip courant et
laisse la transition vers le suivant se déclencher directement dans
l'éditeur. Un bouton #emph[Stop] permet d'interrompre l'essai à tout
moment.

== 5.3 Comportements et automatisation
= mode de superposition)
#strong[Normal] --- le comportement par défaut. Quand ce clip démarre,
il coupe (avec fondu de sortie) tout autre clip en lecture dans la même
colonne. C'est ce qu'il faut pour les morceaux et les bases~: un morceau
chasse l'autre.

#strong[Stacco (Jingle)] --- le clip démarre sans interrompre les
autres. Sa priorité est élevée~: il fait taire les autres assets de la
colonne et baisse la musique, mais n'arrête rien. C'est le cas typique
du #emph[station ID] («~Vous écoutez…~») qui doit chevaucher l'intro
d'un morceau, ou d'un jingle bref lancé par-dessus une base en boucle.

= automatisation en fin de clip)
Définit ce qui se passe quand le clip atteint le point de Trim End.

#strong[Stop] --- comportement par défaut pour Musiques, Voix et Assets.
Le clip se termine et s'arrête.

#strong[Play Next] --- quand le clip approche de la fin, il lance
automatiquement le clip suivant de la colonne, avec la transition
configurée. Le badge #strong[NEXT] apparaît sur la carte. C'est le
comportement par défaut de la colonne Pré-émission, et il suffit de
l'activer sur plusieurs clips consécutifs pour construire des blocs qui
s'enchaînent tout seuls, comme une playlist automatique.

La lecture en #strong[boucle] (Loop Playback) est une option à part~:
une fois activée, le clip repart du début (depuis le Trim Start) sans
transition, et le badge #strong[LOOP] apparaît sur la carte. Elle
convient aux bases musicales, aux ambiances sonores ou aux génériques de
fond destinés à tourner jusqu'à un arrêt explicite. Les modes de
transition (Crossfade, Segue, Gapless) sont décrits au Chapitre 13.

== 5.4 Fondus (Fade In et Fade Out)
Pour chaque clip, le panneau permet de régler la durée des fondus en
entrée et en sortie, de 0 à 60 000 millisecondes (60 secondes), avec une
courbe linéaire.

#strong[Fade In.] Le temps que met le volume à atteindre son niveau
maximal depuis le démarrage~: 2000 ms, par exemple, donne une montée
progressive de deux secondes. À utiliser sur les bases musicales qui
doivent émerger en douceur \; à laisser à 0 pour les voix et les effets
qui doivent s'entendre immédiatement.

#strong[Fade Out.] Le temps de fondu à la fermeture, que ce soit en
arrêtant un clip actif ou lors d'une transition. Valeurs typiques~:
2000--3000 ms pour les morceaux, 500--1000 ms pour les bases, 0 ms pour
les stacchi secs.

Un fondu de sortie à 0 ms produit une coupure immédiate («~hard cut~»).
Sur un morceau musical en direct, elle peut passer pour une erreur
technique~: à réserver aux cas où elle a vraiment sa place.

== 5.5 Attribution des commandes
Chaque clip peut aussi être lancé depuis une touche du clavier ou un
contrôleur MIDI.

#strong[Global Keybind.] La touche du clavier attribuée au clip. Elle se
définit depuis le champ dédié des paramètres du clip (cliquez, puis
appuyez sur la touche voulue) ou depuis la fenêtre #strong[Raccourcis &
tableau MIDI], accessible dans le menu Outils. Le badge correspondant
apparaît sur la carte. Si la touche est déjà prise par un autre clip, le
logiciel signale le conflit avant d'écraser quoi que ce soit.

#strong[MIDI Bind.] La note MIDI attribuée (ex. `NOTE:60`).
L'attribution se fait via le mode #strong[MIDI Learn] (voir Chapitre 8),
non en saisissant le numéro à la main.

Les bindings des clips sont enregistrés dans le fichier de projet~:
transportez-le sur un autre ordinateur équipé du même contrôleur MIDI,
et les mappings fonctionnent sans reconfiguration.
