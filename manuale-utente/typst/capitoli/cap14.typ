#import "../lib/manuale-template.typ": *

= Résolution des problèmes et FAQ
<chapitre-14-résolution-des-problèmes-et-faq>

Ce chapitre rassemble les problèmes les plus fréquents dans l'usage
quotidien de Runtime Live Machine Pro, avec leurs solutions. Chaque
section décrit le symptôme, la cause la plus probable, puis la marche à
suivre pour y remédier.

== 14.1 Problèmes audio
<problèmes-audio>
=== Le minuteur défile et les VU meter bougent, mais on n'entend rien
<le-minuteur-défile-et-les-vu-meter-bougent-mais-on-nentend-rien>
Le logiciel diffuse bien le signal, présent dans le bus interne, mais
celui-ci n'atteint jamais le périphérique d'écoute.

#strong[Vérifiez dans l'ordre~:]

+ #strong[Master Volume.] Le curseur de l'en-tête est-il à zéro~?
  Portez-le à 100 %.
+ #strong[Périphérique de sortie.] Ouvrez Paramètres → #emph[Audio &
  Mix] et contrôlez quel périphérique est sélectionné. Windows et macOS
  peuvent changer l'identifiant des périphériques USB lorsqu'ils sont
  débranchés et rebranchés. Si le nom ne correspond pas à celui
  physiquement connecté, sélectionnez-le de nouveau.
+ #strong[Mixeur externe.] Si le signal arrive à un mixeur matériel,
  contrôlez que le fader du canal n'est pas baissé ou en mute, et que la
  sortie du mixeur est reliée aux moniteurs ou à la chaîne de diffusion.

=== L'audio saute, grésille ou a des interruptions
<laudio-saute-grésille-ou-a-des-interruptions>
En temps normal, le moteur audio résiste bien à ce type d'artefact. S'il
en survient malgré tout, la cause est presque toujours extérieure au
logiciel.

- #strong[CPU sous charge extrême.] Fermez les applications lourdes en
  parallèle (montage vidéo, rendu, sauvegardes intensives).
- #strong[Buffer audio trop bas.] Avec une carte son professionnelle,
  contrôlez la valeur de buffer dans le panneau de contrôle du driver.
  Une valeur de 256 ou 512 échantillons est le bon équilibre~; sous 128
  échantillons, des dropouts peuvent apparaître.
- #strong[Disque lent ou sous stress.] RLMP diffuse l'audio en streaming
  depuis le disque. Un disque mécanique lent, ou un SSD presque plein,
  peut causer des interruptions sur les fichiers volumineux.

=== Le niveau audio est trop bas ou trop haut
- #strong[Gain par clip.] Réglez le Gain dans les propriétés du clip
  (clic droit → section Volume).
- #strong[Master Volume.] Si le niveau global est incorrect, agissez sur
  le curseur de l'en-tête.
- #strong[Homologation et Master Chain.] L'homologation du volume
  rapproche les niveaux des clips d'une référence commune~; le glue de
  la Master Chain peut rendre le son plus compact. Si un résultat ne
  vous convainc pas, vous pouvez régler ou désactiver ces étages dans
  Paramètres → Master Chain.

== 14.2 Clips rouges et fichiers manquants
=== Une carte est devenue rouge («~FICHIER MANQUANT~») et ne répond pas au clic
<une-carte-est-devenue-rouge-fichier-manquant-et-ne-répond-pas-au-clic>
La bordure rouge signale que le fichier audio est introuvable au chemin
enregistré dans le projet.

#strong[Causes possibles~:]

- Le fichier a été déplacé ou renommé sur le disque.
- Le fichier était sur un disque externe ou une clé USB maintenant
  déconnectée.
- Le projet a été ouvert sur un ordinateur différent, où les chemins ne
  correspondent pas.

#strong[Solutions~:]

+ #strong[Reconnectez le disque.] Si le fichier était sur une unité
  externe, rebranchez-la.
+ #strong[Remettez le fichier à sa position d'origine.] S'il a été
  déplacé, replacez-le à son chemin initial.
+ #strong[Remplacez le clip.] Faites glisser de nouveau le bon fichier
  dans la grille et supprimez la carte rouge.
+ #strong[Utilisez Exporter le projet avec l'audio à l'avenir.] La
  prévention la plus efficace consiste à consolider l'audio dans le
  projet avant de déplacer ou de transférer le projet (Chapitre 10).

== 14.3 Problèmes MIDI
<problèmes-midi>
=== Le contrôleur n'est pas détecté
<le-contrôleur-nest-pas-détecté>
+ #strong[Connexion.] Vérifiez que le contrôleur est bien branché et
  reconnu par le système d'exploitation. RLMP détecte en temps réel la
  connexion et la déconnexion des périphériques \; s'il n'apparaît
  toujours pas, débranchez puis rebranchez le câble USB.
+ #strong[Driver.] La plupart des contrôleurs USB-MIDI sont
  #emph[class-compliant] et ne demandent pas de driver. Pour les
  surfaces professionnelles à driver propriétaire, vérifiez que le
  driver est installé.
+ #strong[Vérification en mode Learn.] Activez MIDI Learn et appuyez sur
  une touche du contrôleur~: si la carte reçoit le mapping, le
  contrôleur est détecté.

=== Les clips mappés ne répondent pas aux touches du contrôleur
<les-clips-mappés-ne-répondent-pas-aux-touches-du-contrôleur>
- #strong[Le mode MIDI Learn est encore actif.] En MIDI Learn, les
  touches du contrôleur enregistrent de nouveaux mappings au lieu
  d'exécuter les clips. Désactivez le mode depuis le menu Outils.
- #strong[Le mapping a été perdu.] Les mappings des clips sont dans le
  fichier `.lmp` \; vérifiez que le projet a été enregistré après la
  session de MIDI Learn. Les mappings des fonctions globales sont, eux,
  liés à l'ordinateur individuel.

== 14.4 Problèmes de démarrage
<problèmes-de-démarrage>
=== L'application ne démarre pas sous macOS (avertissement Gatekeeper)
<lapplication-ne-démarre-pas-sous-macos-avertissement-gatekeeper>
Voir la section 2.3~: déblocage via #emph[Réglages Système →
Confidentialité et sécurité].

=== L'application ne démarre pas sous Windows (avertissement SmartScreen)
<lapplication-ne-démarre-pas-sous-windows-avertissement-smartscreen>
Voir la section 2.2. Cliquez sur #emph[Informations complémentaires]
puis sur #emph[Exécuter quand même].

=== Comportements anormaux au démarrage
<comportements-anormaux-au-démarrage>
Si le logiciel se comporte de façon inattendue à l'ouverture, fermez-le
et rouvrez-le. Si le problème persiste, vérifiez que le chemin
d'installation ne contient pas de caractères spéciaux, ils peuvent gêner
le chargement des composants FFmpeg.

== 14.5 Questions fréquentes
<questions-fréquentes>
#strong[RLMP peut-il automatiser une radio 24 heures sur 24 sans
surveillance ?] Non. RLMP est pensé pour la régie live, des émissions
tenues par un opérateur, et ne propose ni programmation horaire ni
rotation automatique de playlist. Seule la vue Automix offre une
automatisation limitée et volontaire du flux musical, active tant
qu'elle reste ouverte (Chapitre 7). Pour l'automatisation 24h/24, des
logiciels dédiés existent déjà (Zara Radio, PlayIt Live, Rivendell)~:
ils couvrent un besoin différent.

#strong[Quelle est la différence entre Enregistrer et Enregistrer
sous~?] #emph[Enregistrer le projet] écrase le fichier `.lmp` ouvert, en
silence. #emph[Enregistrer sous…] ouvre toujours la boîte de dialogue et
crée un nouveau fichier, sans toucher au fichier courant.

#strong[Puis-je utiliser RLMP sur iPad ou sur des appareils mobiles ?]
Pas comme application principale~: RLMP reste un logiciel de bureau,
pour Windows, macOS et Linux. Une tablette ou un téléphone peuvent en
revanche servir de #strong[télécommande] via navigateur, grâce au
Contrôle à distance (Chapitre 11).

#strong[Les fichiers `.lmp` des versions précédentes sont-ils
compatibles avec la 1.15.10~?] Oui. À l'ouverture d'un projet créé avec
une version précédente, RLMP en met à jour automatiquement la structure,
colonnes ajoutées entre-temps comprises, sans modifier le fichier tant
que vous n'effectuez pas d'enregistrement.

#strong[Comment mettre RLMP à jour vers une nouvelle version~?] Le
logiciel vérifie les mises à jour au démarrage et vous avertit. Sous
Windows et Linux AppImage, l'installation est automatique depuis la
fenêtre de mise à jour~; sous macOS et Linux `.deb`, le navigateur est
ouvert sur la page de téléchargement. Tous les détails au Chapitre 12.

#strong[Où sont enregistrées les sauvegardes automatiques~?] Dans le
dossier `autosaves` du répertoire de données de l'application
(`%APPDATA%\runtime-live-machine-pro\autosaves\` sous Windows~; chemins
équivalents sous macOS et Linux, Chapitre 10). Les dix instantanés les
plus récents sont conservés.

#strong[Le logiciel fonctionne-t-il hors ligne ?] Oui, entièrement. RLMP
n'a besoin d'aucune connexion internet pour tourner. Le réseau ne sert
que pour la vérification des mises à jour, optionnelle, et pour le
Contrôle à distance en réseau local, optionnel lui aussi.

#strong[Le Contrôle à distance ne se connecte pas. Pourquoi~?] Vérifiez
que l'appareil distant est sur le #strong[même réseau] que l'ordinateur,
que vous avez saisi le #strong[PIN correct] (il change à chaque
démarrage) et que vous utilisez l'adresse affichée dans les Paramètres.
Rappelez-vous que le Contrôle à distance repart éteint à chaque
démarrage de l'application (Chapitre 11).
