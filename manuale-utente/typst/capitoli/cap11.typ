#import "../lib/manuale-template.typ": *

= Contrôle à distance
<chapitre-11-contrôle-à-distance>

L'animateur n'est pas toujours assis devant l'ordinateur. Il se trouve
parfois à l'autre bout du studio, derrière une vitre, ou se déplace avec
un invité. Le #strong[Contrôle à distance] de Runtime Live Machine Pro
permet justement de piloter les passages essentiels de l'émission depuis
un second appareil, tablette, téléphone ou portable, relié au même
réseau local, simplement via le navigateur. Rien à installer sur
l'appareil distant.

La fonction est pour l'instant marquée comme #strong[Bêta].

== 11.1 Comment ça marche
<comment-ça-marche>
Une fois activé, RLMP démarre en interne un petit #strong[serveur web
local]. L'appareil distant s'y connecte en ouvrant une adresse dans le
navigateur, ce qui affiche une page de contrôle reflétant l'état de la
colonne Musique et permettant d'agir dessus.

Tout se passe #strong[à l'intérieur du réseau local]~: seuls les
appareils connectés au même réseau Wi-Fi ou LAN que le studio peuvent
atteindre le serveur, qui ne transite jamais par internet.

== 11.2 Activation
+ Ouvrez les #strong[Paramètres] depuis le menu Outils et allez à
  l'onglet #emph[Généraux].
+ Activez le toggle #strong[Contrôle à distance (Bêta)].
+ Apparaissent un #strong[PIN à six chiffres], le #strong[port] du
  serveur et les #strong[adresses réseau] auxquelles l'appareil distant
  peut se connecter.
+ Le bouton #strong[Copier le lien] copie dans le presse-papiers
  l'adresse prête à l'emploi (sous la forme
  `http://<adresse-de-l-ordinateur>:8787`).

Le serveur écoute sur le port #strong[8787]. Le PIN est #strong[régénéré
à chaque démarrage] de l'application et n'est pas mémorisé~: fermer et
rouvrir RLMP produit un nouveau PIN. Le Contrôle à distance lui-même
repart toujours éteint à chaque démarrage, à réactiver au besoin.

== 11.3 Se connecter depuis l'appareil distant
+ Sur la tablette ou le téléphone, ouvrez le navigateur et saisissez
  l'adresse affichée dans les Paramètres (ou collez-la depuis le lien
  copié).
+ Une page avec un pavé numérique apparaît~: saisissez le #strong[PIN à
  six chiffres].
+ Une fois le PIN correct, la page affiche la liste des clips de la
  colonne #strong[Musique], avec les commandes de lecture, et un bouton
  #strong[Stop All]. Un bouton dédié passe la page en plein écran,
  pratique sur tablette.

De là, vous lancez et arrêtez les morceaux de la colonne Musique, et si
besoin coupez tout d'un coup. L'état se met à jour en temps réel dans
les deux sens~: ce qui démarre ou s'arrête sur l'ordinateur principal se
reflète sur la page distante, et réciproquement.

== 11.4 Ce qui se pilote à distance
<ce-qui-se-pilote-à-distance>
Le Contrôle à distance est délibérément minimal. À distance, vous
pouvez~:

- #strong[Lancer] un clip de la colonne Musique.
- #strong[Arrêter] un clip de la colonne Musique.
- Exécuter un #strong[Stop All].

Ce sont les seules actions autorisées. Le reste de la régie, les autres
colonnes, le pad FX, l'éditeur, les paramètres, demeure sur l'ordinateur
principal. Ce choix répond à un impératif de sécurité~: la télécommande
sert à gérer le flux musical à distance, pas à remplacer le poste de
régie.

== 11.5 Sécurité et limites
<sécurité-et-limites>
- #strong[PIN obligatoire.] Aucun appareil ne peut envoyer de commandes
  sans avoir passé la vérification du PIN à six chiffres.
- #strong[Protection contre les tentatives.] Les tentatives de saisie du
  PIN sont limitées dans le temps~: après quelques échecs rapprochés,
  l'accès depuis cet appareil est temporairement bloqué.
- #strong[Commandes en liste blanche.] Le serveur n'accepte que les
  trois commandes prévues (lancer, arrêter, Stop All)~: toute autre
  requête est ignorée.
- #strong[Réseau local uniquement.] Le serveur est pensé pour le réseau
  du studio. Si votre réseau Wi-Fi est ouvert ou partagé, évaluez avec
  attention qui peut l'atteindre.
- #strong[Aucune persistance.] Le PIN et l'état d'activation ne sont pas
  enregistrés~: à chaque redémarrage, vous repartez d'une configuration
  propre.

#nota[
Cette fonction étant en version Bêta, l'éventail des
commandes disponibles pourra s'élargir dans les versions futures. Pour
l'heure, elle vise le cas d'usage le plus courant~: gérer la musique à
distance pendant l'animation.
]
