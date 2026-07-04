# Chapitre 12 — Mises à jour

---

Runtime Live Machine Pro se met à jour tout seul, mais jamais à vos dépens. Deux règles régissent tout : aucune mise à jour ne doit interférer avec un direct, et aucun téléchargement ne se lance sans votre consentement. Ce chapitre explique comment le logiciel vérifie la présence de nouvelles versions, comment il les installe et pourquoi il se comporte parfois différemment selon le système d'exploitation.

---

## 12.1 La vérification au démarrage

Peu après le démarrage (environ trois secondes), RLMP vérifie en silence s'il existe une version plus récente. Le résultat apparaît sur l'écran d'accueil, à côté du numéro de version :

- **« Version la plus récente »** (vert) — vous utilisez la dernière version.
- **« Mise à jour disponible »** (ambre) — une version plus récente est disponible. C'est un bouton : cliquez dessus pour ouvrir la fenêtre de mise à jour.
- **« OFFLINE »** — impossible de contacter le service ; réessayez plus tard. Le logiciel fonctionne normalement.

La vérification est optionnelle et non bloquante : si vous êtes hors ligne, RLMP démarre et travaille sans problème.

---

## 12.2 La fenêtre de mise à jour

Quand une mise à jour est disponible, la fenêtre dédiée affiche la version courante, la nouvelle version et les notes de version. De là, c'est vous qui décidez :

- **Plus tard** — ferme la fenêtre sans rien faire. Vous pourrez la rouvrir quand vous voulez.
- **Télécharger** — lance le téléchargement de la nouvelle version. Le téléchargement **ne se lance jamais tout seul** : il ne commence que lorsque vous appuyez sur ce bouton. Une barre de progression en montre l'avancement.
- **Redémarrer et installer** — apparaît quand le téléchargement est terminé : redémarre l'application en appliquant la mise à jour.

---

## 12.3 La règle « jamais pendant le direct »

La vérification automatique peut trouver une mise à jour au moment même où vous êtes à l'antenne. Dans ce cas, RLMP **ne vous interrompt pas** : la fenêtre de mise à jour reste en attente et ne s'ouvre d'elle-même que lorsque le direct est terminé (quand vous arrêtez tout). La priorité est toujours l'émission en cours.

Il y a une seule exception, et elle est voulue : le bouton **Vérifier les mises à jour maintenant**, dans le panneau *Infos & Mises à jour* (menu Outils), est une action explicite de votre part et ouvre aussitôt la fenêtre, même en direct. Si vous l'appuyez, c'est que vous le voulez.

---

## 12.4 Différences entre les plateformes

La façon dont la mise à jour est installée dépend du système d'exploitation.

**Windows et Linux (AppImage).**
La mise à jour est entièrement intégrée : vous téléchargez la nouvelle version depuis la fenêtre et le logiciel l'installe au redémarrage suivant, sans étape manuelle.

**macOS et Linux (paquet .deb).**
Sur ces systèmes, RLMP ne peut pas installer la mise à jour de façon fiable. À la place de l'installation automatique, la fenêtre vous avertit et ouvre le navigateur sur la page de téléchargement de la nouvelle version : de là, vous téléchargez le paquet et l'installez comme vous le feriez pour une nouvelle installation (Chapitre 2). Vos projets et vos fichiers `.lmp` restent intacts.

> **Note.** Dans tous les cas, mettre RLMP à jour n'entraîne pas la perte des projets : les fichiers `.lmp` sont compatibles entre les versions et ne demandent pas de migration manuelle.
