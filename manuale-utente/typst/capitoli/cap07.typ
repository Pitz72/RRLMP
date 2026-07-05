#import "../lib/manuale-template.typ": *

= Le pad FX et la vue Automix

Deux surfaces de travail se superposent à la grille, rappelables d'une
touche, chacune pensée pour un moment bien différent de la régie~: le
#strong[pad FX], pour lancer effets et stacchi à coup sûr sans rien
interrompre, et la #strong[vue Automix], pour gérer le flux musical
comme le ferait un DJ. Ni l'une ni l'autre n'empiète sur la grille~:
elles s'ouvrent au besoin et se referment d'un clic.

== 7.1 Le pad FX~: la jingle machine
#figure(image("../screenshots-fr/pad-fx.png", alt: "Figure 7.1 — Le pad FX : la jingle machine 5×5 des effets sonores, avec lancement superposé."),
  caption: [
    Figure 7.1 --- Le pad FX~: la jingle machine 5×5 des effets sonores,
    avec lancement superposé.
  ]
)

Les effets sonores n'ont pas de colonne dans la grille~: ils vivent dans
le #strong[pad FX], un panneau en grille de cellules (une #emph[jingle
machine]) qui s'ouvre depuis le bouton #strong[FX] de l'en-tête et reste
flottant dans un coin de l'écran.

Le pad est un #strong[overlay non bloquant]~: il n'assombrit pas la
board et n'intercepte aucun clic destiné ailleurs. Vous pouvez lancer un
effet tout en continuant d'opérer sur les colonnes ou sur les commandes
de l'en-tête. C'est pour cette raison que `Échap` ne ferme pas le pad~:
elle reste réservée à STOP ALL, toujours disponible. Le pad se ferme
depuis son propre bouton de fermeture, ou en rappuyant sur le toggle FX.

=== Charger et lancer les effets
Le pad démarre avec une grille de 25 cellules (5×5) et s'agrandit en
lignes à mesure que vous ajoutez des effets. Pour le peupler,
#strong[faites glisser les fichiers audio directement sur les cellules]
du pad, exactement comme sur une colonne de la grille.

Un clic sur une cellule #strong[lance l'effet]. Les effets du pad sont
polyphoniques et se superposent~: plusieurs cellules peuvent jouer en
même temps, par-dessus tout ce qui est à l'antenne, sans rien arrêter.
Le comportement audio reste celui d'un clip normal \; seule change la
surface de lancement. Un compteur, à côté du bouton FX de l'en-tête,
indique combien d'effets jouent à l'instant présent.

=== Configurer un effet
Les effets se configurent à deux niveaux, chacun répondant à un besoin
différent~:

- #strong[Paramètres rapides]~: le cas le plus courant pour une jingle
  machine --- nom, couleur, volume, boucle. Quelques secondes suffisent.
- #strong[Paramètres complets]~: la même fenêtre que pour les clips de
  la grille (éditeur de forme d'onde, trim, marqueurs, fade, attribution
  des touches), accessible depuis l'entrée «~Paramètres complets…~» dans
  les paramètres rapides.

=== Position du pad
Le pad se place dans le coin en bas à gauche ou en bas à droite de
l'écran, au choix~: les flèches du pad permettent de basculer, et la
préférence reste mémorisée d'une session à l'autre. À droite, il
recouvre la NoteBoard et la dernière colonne \; choisissez le côté qui
convient le mieux à la disposition de votre conduite.

#nota[
En mode MIDI Learn, un clic sur une cellule du pad
#strong[sélectionne] l'effet pour l'attribution au lieu de le jouer,
afin d'éviter de diffuser un jingle en pleine session de mapping (voir
Chapitre 8).
]

== 7.2 La vue Automix
#figure(image("../screenshots-fr/vista-automix.png", alt: "Figure 7.2 — La vue Automix : le deck de la colonne Musique, la compatibilité BPM et le mode automatique en fin de morceau."),
  caption: [
    Figure 7.2 --- La vue Automix~: le deck de la colonne Musique, la
    compatibilité BPM et le mode automatique en fin de morceau.
  ]
)

La #strong[vue Automix] est le deck de la colonne Musique~: un écran
plein cadre, rappelé par le bouton #strong[MIX] de l'en-tête, qui
présente la conduite musicale à la manière d'une console de DJ. Elle
s'ouvre au-dessus de la board mais sous le pad FX, si bien que les
effets restent utilisables même quand l'Automix est ouverte. Comme pour
le pad, `Échap` ne la ferme pas~: cette touche reste réservée à
l'urgence, et le bouton STOP ALL demeure accessible dans l'en-tête.

=== Le deck
Au centre se trouvent le morceau #strong[à l'antenne] et, en file
d'attente, le #strong[prochain] morceau de la colonne Musique, avec le
temps restant. De là, une seule commande suffit pour lancer une piste et
gérer le passage d'un morceau à l'autre~: le gros bouton de transition
applique le même crossfade que depuis la grille, avec en plus le calage
rythmique.

=== Compatibilité et transitions beat-matched
<compatibilité-et-transitions-beat-matched>
À côté de chaque morceau, une #strong[pastille de compatibilité] indique
son affinité rythmique avec le morceau précédent~:

- #strong[Vert] --- les deux tempos se calent bien~: la transition peut
  être beat-matched.
- #strong[Jaune] --- calage possible mais avec quelques réserves.
- #strong[Rouge] --- tempos trop éloignés pour un calage propre.

Quand le calage rythmique n'est pas praticable (BPM non détecté, beat
incertain, tempos trop éloignés), le logiciel le signale et se rabat
automatiquement sur un #strong[crossfade classique]~: aucune mauvaise
surprise à l'antenne.

=== Le mode automatique
En bas de la vue se trouve un interrupteur pour l'#strong[automatisation
en fin de morceau]~: une fois activé, RLMP enchaîne de lui-même sur le
morceau suivant dès que la piste à l'antenne approche de sa fin.

Ce mode est une exception assumée à la philosophie du logiciel, qui par
principe n'automatise pas l'émission. Voilà pourquoi il est
#strong[désactivé par défaut] et ne fonctionne #strong[que tant que la
vue Automix reste ouverte]~: la fermer désactive l'automatisation. C'est
l'outil qu'il faut pour un bloc musical continu, une demi-heure de
musique seule avant de revenir en voix, pas pour tenir tout le direct.
