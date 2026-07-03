# Chapitre 11 — Contrôle à distance

---

Celui qui anime n'est pas toujours assis devant l'ordinateur. Parfois l'animateur est à l'autre bout du studio, derrière une vitre, ou bien il se déplace avec un invité. Le **Contrôle à distance** de Runtime Live Machine Pro permet de commander les passages essentiels de l'émission depuis un second appareil (une tablette, un téléphone, un portable) relié au même réseau local, en utilisant simplement le navigateur. Il n'y a rien à installer sur l'appareil distant.

La fonction est pour l'instant marquée comme **Bêta**.

---

## 11.1 Comment ça marche

Quand vous l'activez, RLMP démarre en son sein un petit **serveur web local**. L'appareil distant se connecte à ce serveur en ouvrant une adresse dans le navigateur : de là apparaît une page de contrôle qui reflète l'état de la colonne Musique et permet d'agir dessus.

Tout se passe **à l'intérieur du réseau local** : le serveur est accessible aux appareils connectés au même réseau Wi-Fi ou LAN que le studio, et il ne passe pas par internet.

---

## 11.2 Activation

1. Ouvrez les **Paramètres** depuis le menu Outils et allez à l'onglet *Généraux*.
2. Activez le toggle **Contrôle à distance (Bêta)**.
3. Apparaissent un **PIN à six chiffres**, le **port** du serveur et les **adresses réseau** auxquelles l'appareil distant peut se connecter.
4. Le bouton **Copier le lien** copie dans le presse-papiers l'adresse prête à l'emploi (sous la forme `http://<adresse-de-l-ordinateur>:8787`).

Le serveur écoute sur le port **8787**. Le PIN est **régénéré à chaque démarrage** de l'application et n'est pas mémorisé : fermer et rouvrir RLMP produit un nouveau PIN. Le Contrôle à distance lui-même repart toujours éteint à chaque démarrage, à réactiver au besoin.

---

## 11.3 Se connecter depuis l'appareil distant

1. Sur la tablette ou le téléphone, ouvrez le navigateur et saisissez l'adresse affichée dans les Paramètres (ou collez-la depuis le lien copié).
2. Une page avec un pavé numérique apparaît : saisissez le **PIN à six chiffres**.
3. Une fois le PIN correct, la page affiche la liste des clips de la colonne **Musique**, avec les commandes de lecture, et un bouton **Stop All**. Un bouton dédié passe la page en plein écran, pratique sur tablette.

De là, vous pouvez lancer et arrêter les morceaux de la colonne Musique et, au besoin, tout arrêter. L'état se met à jour en temps réel : ce qui part ou s'arrête sur l'ordinateur principal se reflète sur la page distante, et inversement.

---

## 11.4 Ce qui se pilote à distance

Le Contrôle à distance est délibérément minimal. À distance, vous pouvez :

- **Lancer** un clip de la colonne Musique.
- **Arrêter** un clip de la colonne Musique.
- Exécuter un **Stop All**.

Ce sont les seules actions autorisées. Le reste de la régie (les autres colonnes, le pad FX, l'éditeur, les paramètres) reste sur l'ordinateur principal. C'est un choix de sécurité : la télécommande sert à gérer le flux musical à distance, non à remplacer le poste de régie.

---

## 11.5 Sécurité et limites

- **PIN obligatoire.** Aucun appareil ne peut envoyer de commandes sans avoir passé la vérification du PIN à six chiffres.
- **Protection contre les tentatives.** Les tentatives de saisie du PIN sont limitées dans le temps : après quelques échecs rapprochés, l'accès depuis cet appareil est temporairement bloqué.
- **Commandes en liste blanche.** Le serveur n'accepte que les trois commandes prévues (lancer, arrêter, Stop All) : toute autre requête est ignorée.
- **Réseau local uniquement.** Le serveur est pensé pour le réseau du studio. Si votre réseau Wi-Fi est ouvert ou partagé, évaluez avec attention qui peut l'atteindre.
- **Aucune persistance.** Le PIN et l'état d'activation ne sont pas enregistrés : à chaque redémarrage, vous repartez d'une configuration propre.

> **Note.** S'agissant d'une fonction en Bêta, l'ensemble des commandes disponibles pourra s'élargir dans les versions futures. Pour l'instant, elle est calibrée sur le cas d'usage le plus fréquent : gérer la musique à distance pendant l'animation.
