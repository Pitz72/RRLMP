#import "../lib/manuale-template.typ": *

= Fonctions avancées
<chapitre-13-fonctions-avancées>

Ce chapitre rassemble des fonctionnalités qui ne relèvent pas du flux de
travail de base, mais qui, une fois découvertes, s'installent
durablement dans les habitudes de ceux qui produisent leurs émissions
avec soin~: la NoteBoard, la gestion des couleurs de colonnes, les
transitions, les paramètres généraux, le registre des lancements et
l'historique des modifications.

== 13.1 NoteBoard~: le conducteur en régie
<noteboard-le-conducteur-en-régie>
La #strong[NoteBoard] est le système de notes intégrées aux clips. Elle
permet d'associer à n'importe quel clip un texte, instructions
opérationnelles, conduite, notes sur une interview ou texte complet d'un
spot, et de le faire apparaître automatiquement à l'écran dès que ce
clip entre en lecture.

=== Saisir une note
+ Ouvrez les paramètres du clip (clic droit sur la carte) et allez à la
  section #emph[Notes].
+ Écrivez le texte dans le champ libre. Il n'y a pas de limite de
  longueur.

Les clips ayant une note affichent le badge 📋 sur la carte.

=== Le panneau en direct
Dès qu'un clip muni d'une note entre en lecture, le #strong[panneau
NoteBoard] apparaît en bas de l'écran, avec le texte associé sous le nom
et la couleur du clip. Il reste affiché pendant toute la lecture et se
referme tout seul quand le clip se termine. Si plusieurs clips notés
jouent en même temps, le panneau montre celui de priorité la plus haute.

=== Cas d'usage
- #strong[Régie parlée.] Associez à chaque générique les premières
  lignes du bloc parlé qui suit~: quand le générique part, le texte est
  déjà sous les yeux.
- #strong[Contenu à lire.] Un spot publicitaire avec le texte complet
  dans la note~: dès qu'il part, on lit.
- #strong[Instructions opérationnelles.] «~Baisser le retour~»,
  «~Contrôler le niveau du casque invité~», «~Démarrer
  l'enregistrement~».
- #strong[Interviews.] Les questions pour l'invité restent visibles
  pendant toute la durée du clip.

== 13.2 Personnalisation des couleurs de colonne
Les couleurs par défaut suivent une convention établie, vert pour les
Assets, rouge pour les Musiques, et ainsi de suite, mais chaque colonne
reste personnalisable. Un clic sur la #strong[pastille colorée] de
l'en-tête de colonne ouvre une palette de #strong[30 couleurs]~: sitôt
le choix fait, la colonne entière (en-tête, cartes, indicateurs) adopte
la nouvelle teinte, enregistrée dans le fichier de projet.

Les cartes héritent dynamiquement de la couleur de leur colonne~:
atténuée au repos, pleine en lecture. Chaque projet peut ainsi
développer sa propre identité chromatique.

== 13.3 Transitions entre clips
Quand un clip est réglé sur #emph[Play Next], le passage au clip suivant
de la colonne se fait selon le mode de transition configuré~:

- #strong[Crossfade.] Le clip sortant s'estompe pendant que l'entrant
  monte, superposés. Durée par défaut~: 2 secondes.
- #strong[Segue.] Le clip sortant s'estompe en sortie pendant que le
  suivant démarre aussitôt à plein volume. Durée par défaut du fondu~:
  0,8 seconde.
- #strong[Gapless (coupe nette).] Le clip sortant s'arrête net et le
  suivant démarre immédiatement, sans fondu.

Vous pouvez régler la transition clip par clip, ou vous en remettre à
#strong[Défaut global], qui applique le choix défini dans les
Paramètres. La colonne Pré-émission utilise le crossfade par défaut.
Tous les modes s'essaient sans passer à l'antenne, via le bouton «~Test
→~» de l'éditeur (Chapitre 5).

== 13.4 La fenêtre Paramètres généraux
<la-fenêtre-paramètres-généraux>
Les #strong[Paramètres] (menu Outils) rassemblent les préférences
globales du logiciel, organisées en onglets.

=== Généraux
<généraux>
- #strong[Langue.] Sélectionnez la langue de l'interface parmi les huit
  disponibles. La modification est immédiate.
- #strong[Contrôle à distance (Bêta).] Active la télécommande via
  navigateur et affiche PIN, port et adresses (Chapitre 11).
- #strong[Disposition régie.] Affiche ou masque individuellement les
  colonnes de la grille. Masquer une colonne n'en supprime pas les
  clips~: ils restent dans le projet. C'est une préférence globale,
  valable pour tous les projets.

=== Audio & Mix
- #strong[Périphérique de sortie.] La destination audio (Chapitre 8).
- #strong[Intelligence de mixage.] L'ampleur du ducking (de combien la
  musique descend quand une voix parle, par défaut 20 %) et sa rapidité
  (par défaut 500 ms).
- #strong[Transitions.] Le mode de transition par défaut et les durées
  de crossfade et de segue.

=== Enregistrement
Récapitulatif du point de capture (après le limiter) et choix du format
par défaut proposé à l'exportation (Chapitre 9).

=== Master Chain
- #strong[Homologation du volume.] Active/désactive la normalisation de
  loudness et en définit la cible (par défaut −16 LUFS).
- #strong[Master Chain.] Active ou bypasse toute la chaîne, et règle les
  étages individuels~: fréquence de l'HPF, style du glue multibande,
  seuil du limiter. Un bouton rétablit les valeurs par défaut (Chapitre
  6).

== 13.5 Playout Log
Le #strong[Playout Log] (icône dans l'en-tête) est le registre
chronologique des lancements~: il garde la trace de ce qui est passé à
l'antenne, et quand, sur les derniers milliers d'événements. Utile pour
reconstituer une conduite a posteriori, vérifier ce qui a été diffusé,
ou compiler un compte rendu du direct.

== 13.6 Annuler et Répéter
<annuler-et-répéter>
Les modifications de la conduite, ajouts, déplacements, suppressions,
sont réversibles. `Ctrl+Z` annule la dernière opération, `Ctrl+Y` (ou
`Ctrl+Shift+Z`) la répète, avec un historique qui remonte sur plusieurs
dizaines de pas. Ces mêmes commandes figurent aussi dans le menu
Outils~: un vrai filet de sécurité pour les manipulations faites à la
hâte pendant la préparation.

== 13.7 Système de notifications toast
<système-de-notifications-toast>
RLMP se garde d'utiliser des fenêtres bloquantes pour les communications
de routine. Les notifications non critiques prennent la forme de
#strong[toasts]~: de petits bandeaux discrets, dans un coin de l'écran,
qui restent quelques secondes puis disparaissent d'eux-mêmes sans
interrompre la lecture. Ils confirment un enregistrement, signalent la
fin d'une exportation, une opération de MIDI Learn, ou avertissent de
fichiers manquants.

Les #strong[fenêtres de confirmation], elles, s'imposent quand une
action est irréversible, suppression de clips, fermeture d'un projet non
enregistré~: modales, elles exigent une réponse, mais sans jamais couper
la lecture en cours. L'audio continue pendant que vous décidez.
