#import "../lib/manuale-template.typ": *

= Le moteur de mixage

En régie radiophonique manuelle, tout se joue en même temps~: lancer un
morceau, baisser la musique, parler au micro, préparer le clip suivant,
surveiller l'horloge du coin de l'œil. Chaque geste supplémentaire est
une occasion d'erreur, et l'erreur, ici, se joue en public et sans
filet.

Le moteur de mixage de Runtime Live Machine Pro délègue au logiciel une
bonne partie de ces gestes. Il ne s'agit pas d'automatisation façon «~le
logiciel décide à votre place sans vous prévenir~», mais plutôt de
règles que vous appliqueriez vous-même si vous aviez assez de mains pour
tout faire à la fois.

== 6.1 La hiérarchie audio
<la-hiérarchie-audio>
Le système de mixage automatique repose sur une #strong[hiérarchie de
priorité] entre les types de clips, qu'on peut se représenter simplement
comme une échelle de «~droit de parole~».

#strong[Voix / Enregistrements --- priorité absolue.] Quand un clip voix
est en lecture, il garde son volume nominal et tout le reste baisse
autour de lui. Aucun autre signal ne peut passer outre.

#strong[Musiques de l'épisode.] Elles cèdent le pas aux Voix, mais
dominent les bases des Assets. Quand un morceau entre, les bases
musicales des Assets s'effacent, sans s'arrêter pour autant~: elles
continuent de tourner en silence, prêtes à revenir. C'est le principe de
la Music Dominance, détaillé plus loin.

#strong[Show Assets, Jingle et Promo --- les bases de service.] Les Voix
les baissent, les Musiques les réduisent au silence. Exception~: quand
un asset est configuré en #strong[Stacco], c'est lui qui prend le dessus
(voir §6.4).

#strong[Effets du pad FX.] Les effets sonores échappent à cette
hiérarchie~: ils jouent à leur propre volume, se superposent à ce qui
est à l'antenne, et ne sont jamais réduits au silence. Une seule
exception, par courtoisie envers la parole~: quand une voix est active,
ils descendent à mi-volume (50 %) pour ne pas la couvrir, puis remontent
d'eux-mêmes.

== 6.2 Ducking automatique
Le #strong[ducking] désigne ce mécanisme~: un signal baisse
automatiquement dès qu'un signal de priorité supérieure entre en
lecture.

Le cas le plus courant~: un morceau joue à pleine dynamique, et vous
lancez une interview préenregistrée depuis la colonne Voix. RLMP amène
alors le morceau à environ #strong[20 % du volume] (une réduction
d'environ 14 dB), avec un fondu doux d'une demi-seconde, pour laisser la
voix occuper l'espace sonore de façon intelligible. Dès que l'interview
se termine, le morceau remonte à son volume d'origine, avec un fondu
d'entrée tout aussi fluide.

L'opérateur, lui, n'a rien touché~: un seul clic, celui qui lance
l'interview. L'ampleur de la réduction et sa vitesse se règlent dans les
Paramètres (Chapitre 13).

== 6.3 Music Dominance~: gestion intelligente des bases
Une erreur sonore classique survient quand un morceau et une base
musicale (#emph[bed]) se superposent~: deux rythmes qui s'entrechoquent,
deux grosses caisses décalées, et au final un mix confus.

RLMP règle ce scénario grâce à la #strong[Music Dominance].

#strong[Le scénario type.] Une base tourne en boucle dans la colonne
Assets, sous la voix de l'animateur, qui lance un morceau depuis la
colonne Musiques.

#strong[Ce que fait RLMP.] Il n'arrête pas la base~: l'arrêter forcerait
à la relancer manuellement ensuite. Il la fait plutôt descendre à
#strong[volume zéro], tout en la gardant en lecture «~fantôme~»~: le
fichier continue de défiler, la boucle tourne toujours, mais on n'entend
rien.

#strong[Le résultat sonore.] Seul le morceau s'entend. La base a disparu
sans que l'opérateur soit intervenu.

#strong[Le retour.] Une fois le morceau terminé, la base réémerge avec
un fondu d'entrée automatique, exactement là où elle en était dans sa
boucle. Tout l'enchaînement (base → morceau → base) se fait sans un clic
de plus.

== 6.4 Stacchi~: l'exception à la règle
<stacchi-lexception-à-la-règle>
Le comportement #strong[Stacco] («~coupe/transition brève~»,
configurable dans les propriétés de chaque clip, voir Chapitre 5)
inverse temporairement la hiérarchie~: le clip qui le porte devient
prioritaire. Il fait taire les autres assets de sa colonne et baisse la
musique, sans rien arrêter. Le fondu appliqué, plus rapide que celui du
ducking ordinaire, donne une entrée plus percussive et nette.

L'usage typique est le #emph[station ID] vocal («~Vous écoutez…~»)~: il
doit s'entendre clairement pendant que la base continue de tourner en
dessous. Pour un résultat plus soigné, associez le Stacco à un fondu
d'entrée bref (300--500 ms), afin que l'entrée reste douce plutôt que
brutale.

== 6.5 Homologation du volume (loudness)
Les clips venus d'horizons différents arrivent presque toujours à des
niveaux différents~: un générique bien masterisé, une voix téléphonique
enregistrée trop bas, un morceau téléchargé avec son propre volume de
référence. Pour éviter de devoir sans cesse retoucher le Gain à la main,
RLMP applique par défaut une #strong[homologation du volume], fondée sur
la norme de loudness EBU R128, avec une cible de #strong[−16 LUFS].

Concrètement, le logiciel évalue la sonorité perçue de chaque clip et la
ramène vers une référence commune, si bien que morceaux, voix et bases
démarrent déjà sur un pied d'égalité. La fonction est active par défaut
\; la valeur cible se règle dans Paramètres → Master Chain.

== 6.6 Master Chain~: la chaîne de processeurs sur le master bus
<master-chain-la-chaîne-de-processeurs-sur-le-master-bus>
#figure(image("../screenshots-fr/impostazioni-master-chain.png", alt: "Figure 6.1 — La Master Chain : homologation du volume (−16 LUFS), HPF à 30 Hz, glue multibande et limiter brickwall."),
  caption: [
    Figure 6.1 --- La Master Chain~: homologation du volume (−16 LUFS),
    HPF à 30 Hz, glue multibande et limiter brickwall.
  ]
)

Le signal combiné de tous les clips en lecture, après le Master Volume,
traverse une #strong[chaîne de processeurs] sur le bus master avant
d'atteindre le périphérique de sortie. Active par défaut, cette chaîne
vise un son de qualité broadcast sans demander de réglages avancés.

Elle s'organise en trois étages, en série.

#strong[High-Pass Filter (HPF) à 30 Hz.] Avec une pente douce, il
élimine les fréquences sub-bass inutiles, celles qui grignotent le
headroom et peuvent salir les systèmes de diffusion. La fréquence de
coupure est réglable (20--200 Hz) \; désactivé, l'étage devient
totalement transparent.

#strong[Glue multibande.] Il ne s'agit pas d'un compresseur unique, mais
de trois compresseurs «~doux~» travaillant en parallèle sur trois bandes
de fréquence (graves, médiums, aigus), séparées par un crossover. Chaque
bande a ses seuils et ratios propres, calibrés pour «~coller~» (Glue) le
mix sans l'écraser, et pour contenir les écarts de dynamique entre clips
de niveaux différents. Le style se choisit parmi quelques presets
(Neutre, Rock, Jazz, Électronique), Neutre étant celui par défaut.

#strong[Limiter brickwall.] Seuil à −1 dBFS, ratio de limitation élevé,
réaction quasi instantanée~: il garantit que le signal ne dépasse jamais
le niveau maximal autorisé, et évite ainsi la distorsion numérique
(clipping) quoi qu'il se passe en amont.

Toute la chaîne, comme chaque étage pris isolément, se configure et se
désactive depuis Paramètres → Master Chain, où se trouve aussi un bouton
pour revenir aux valeurs par défaut. Si le signal passe déjà par un
mixeur matériel ou une chaîne externe, mieux vaut la désactiver pour
éviter un double traitement.
