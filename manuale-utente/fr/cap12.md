# Chapitre 12 — Mises à jour

---

Runtime Live Machine Pro se met à jour tout seul, mais jamais à vos dépens. Deux règles gouvernent le processus : aucune mise à jour ne vient jamais interférer avec un direct, et aucun téléchargement ne démarre sans votre accord. Ce chapitre explique comment le logiciel repère les nouvelles versions, comment il les installe, et pourquoi son comportement varie selon le système d'exploitation.

---

## 12.1 La vérification au démarrage

Quelques secondes à peine après le démarrage, RLMP vérifie discrètement s'il existe une version plus récente. Le résultat s'affiche sur l'écran d'accueil, à côté du numéro de version :

- **« Version la plus récente »** (vert) — vous utilisez la dernière version.
- **« Mise à jour disponible »** (ambre) — une version plus récente est disponible. C'est un bouton : cliquez dessus pour ouvrir la fenêtre de mise à jour.
- **« OFFLINE »** — impossible de contacter le service ; réessayez plus tard. Le logiciel fonctionne normalement.

Cette vérification est optionnelle et non bloquante : hors ligne, RLMP démarre et fonctionne sans le moindre problème.

---

## 12.2 La fenêtre de mise à jour

Quand une mise à jour est disponible, la fenêtre dédiée affiche la version courante, la nouvelle version et les **notes de version** : la liste réelle des nouveautés de cette version (le même changelog que celui de ce logiciel), mise en forme et lisible, et non une simple liste de fichiers. Les notes restent visibles même une fois le téléchargement terminé, juste avant l'installation, pour que vous sachiez toujours ce que vous vous apprêtez à appliquer. C'est ensuite à vous de décider :

- **Plus tard** — ferme la fenêtre sans rien faire. Vous pourrez la rouvrir quand vous voulez.
- **Télécharger** — lance le téléchargement de la nouvelle version. Le téléchargement **ne se lance jamais tout seul** : il ne commence que lorsque vous appuyez sur ce bouton. Une barre de progression en montre l'avancement.
- **Redémarrer et installer** — apparaît quand le téléchargement est terminé : ferme l'application et applique la mise à jour. La fermeture est propre et immédiate : ayant déjà confirmé le redémarrage, le logiciel ne repropose pas la demande d'enregistrement et ne reste pas ouvert derrière l'installateur.

---

## 12.3 La règle « jamais pendant le direct »

Il peut arriver que la vérification automatique trouve une mise à jour pendant que vous êtes à l'antenne. Dans ce cas, RLMP **ne vous interrompt jamais** : la fenêtre de mise à jour patiente et ne s'ouvre d'elle-même qu'une fois le direct terminé, c'est-à-dire quand vous arrêtez tout. L'émission en cours passe toujours avant le reste.

Une seule exception existe, et elle est volontaire : le bouton **Vérifier les mises à jour maintenant**, dans le panneau *Infos & Mises à jour* (menu Outils), traduit une action explicite de votre part et ouvre donc la fenêtre sur-le-champ, même en direct. En l'actionnant, vous savez ce que vous faites.

---

## 12.4 Différences entre les plateformes

La manière dont la mise à jour s'installe dépend du système d'exploitation.

**Windows et Linux (AppImage).**
La mise à jour est entièrement intégrée : vous téléchargez la nouvelle version depuis la fenêtre, et le logiciel l'installe au redémarrage suivant, sans aucune étape manuelle.

**macOS et Linux (paquet .deb).**
Sur ces systèmes, RLMP ne peut pas installer la mise à jour de façon fiable. Plutôt que de tenter une installation automatique, la fenêtre vous prévient et ouvre le navigateur sur la page de téléchargement de la nouvelle version. De là, vous téléchargez le paquet et l'installez comme pour une installation initiale (Chapitre 2). Vos projets et vos fichiers `.lmp` restent intacts dans tous les cas.

> **Note.** Dans tous les cas, mettre RLMP à jour n'entraîne pas la perte des projets : les fichiers `.lmp` sont compatibles entre les versions et ne demandent pas de migration manuelle.
