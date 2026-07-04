# Chapitre 3 — L'interface de travail

---

L'interface de Runtime Live Machine Pro a été pensée pour le contexte le plus exigeant qui soit : le direct. Le thème sombre, le fort contraste, la taille des commandes — chaque choix visuel répond à un besoin fonctionnel précis. Rien d'esthétique ici pour le seul plaisir des yeux : tout sert l'ergonomie.

À l'ouverture d'un projet, l'écran se divise en deux zones : la **barre de contrôle**, en haut, qui gère le projet et le système, et la **grille de régie**, au centre, où se joue le travail réel.

---

## 3.1 La barre de contrôle (en-tête)

L'en-tête occupe toute la largeur de l'écran. De gauche à droite se succèdent l'identité du logiciel, les commandes sur les fichiers, le monitoring et les commandes de transport, le menu des outils, puis les indicateurs de session.

### Identité

**Logo et badge PRO.** À gauche, le logo côtoie l'inscription **RLM PRO**, dont le mot « PRO » affiche un dégradé iridescent passant du cyan au vert, à l'ambre, puis au rouge. À côté, en caractères à chasse fixe, figure la version installée (`v1.11.5`). Survolez le logo à la souris : le nom complet du logiciel apparaît avec son numéro de version.

### Menu Fichier

Le bouton **FILE** ouvre un menu regroupant les opérations sur les projets :

- *Nouveau Projet* — ouvre une session vide. En cas de modifications non enregistrées, le logiciel demande confirmation.
- *Enregistrer le projet* — enregistrement rapide sur le fichier `.lmp` courant. L'entrée se met en jaune lorsqu'il y a des modifications non enregistrées.
- *Enregistrer sous…* — ouvre toujours la boîte de dialogue, pour créer des versions progressives (ex. `Ep47_brouillon.lmp`, `Ep47_final.lmp`).
- *Charger un Projet* — ouvre un projet `.lmp` depuis le disque.
- *Importer playlist M3U* — importe une playlist au format M3U comme séquence de clips.
- *Exporter l'archive autonome* — crée une copie autonome du projet, fichiers audio inclus. Décrit au Chapitre 10.

### Monitoring et transport

**VU meter stéréo (L/R).** Deux barres horizontales affichent le niveau audio réel en sortie, après le Master Volume. L'échelle chromatique parle d'elle-même : vert jusqu'à environ 85 % du parcours, puis jaune, puis rouge en approchant du fond d'échelle. Un rouge qui persiste signale un écrêtage — baissez le niveau.

**Master Volume.** Ce fader contrôle le volume général de sortie, de 0 à 100 %. Ramené à zéro, plus aucun son ne sort, quel que soit l'état des clips individuels — c'est un vrai fader master. Un petit badge signale l'attribution si vous avez mappé une commande MIDI dessus.

**STOP ALL (bouton rouge « ALL »).** Arrête instantanément tous les clips actifs et remet à zéro les fondus en cours : c'est la commande d'urgence du système. La touche `Échap` fait exactement la même chose quand l'application est au premier plan, y compris pendant la saisie de texte dans un champ.

> **Note.** Contrairement aux versions précédentes, `Échap` n'est plus un raccourci global du système : elle n'agit que si RLMP est la fenêtre active. Les boîtes de dialogue peuvent ainsi utiliser `Échap` pour se fermer sans interrompre le direct.

**FX.** Ouvre et ferme le pad FX, la *jingle machine* des effets (Chapitre 7). Un petit compteur indique le nombre d'effets en cours de lecture.

**MIX.** Ouvre et ferme la vue Automix, le deck dédié à la colonne Musique (Chapitre 7).

### Outils

Le menu **Outils** (icône clé anglaise) regroupe :

- *Annuler* et *Répéter* — l'historique des modifications apportées à la conduite (`Ctrl+Z` / `Ctrl+Y`).
- *Apprentissage MIDI* — active le mode d'apprentissage MIDI (Chapitre 8).
- *Raccourcis & tableau MIDI* — la fenêtre d'attribution des touches aux clips.
- *Paramètres généraux* — les préférences globales du logiciel (Chapitre 13).
- *Infos & Mises à jour* — version, crédits et vérification manuelle des mises à jour.

Juste sous le menu, l'indicateur *Auto-saved* apparaît brièvement pour confirmer l'enregistrement automatique du projet.

![La barre de contrôle avec le menu Outils ouvert.](../screenshots-fr/barra-controllo.png)

*Figure 3.1 — La barre de contrôle et le menu Outils ouvert (Annuler/Répéter, Apprentissage MIDI, Raccourcis, Paramètres généraux, Infos).*

### Indicateurs de session

À droite de l'en-tête se trouvent le bouton du **Playout Log** (le registre chronologique des lancements, Chapitre 13), le bouton d'**Enregistrement** (Chapitre 9), le **minuteur On Air** (qui affiche `ON AIR HH:MM:SS` sur fond rouge une fois en direct) et l'**horloge de studio** numérique au format 24 heures, calée sur l'horloge système.

Des notifications discrètes (**toast**) peuvent également apparaître dans l'en-tête pour signaler une opération terminée ou un avertissement système. À la différence des boîtes de dialogue bloquantes, elles disparaissent seules après quelques secondes sans interrompre la lecture.

---

## 3.2 La grille à six colonnes

![La grille de régie à six colonnes avec des clips d'exemple et leurs badges d'état.](../screenshots-fr/interfaccia-principale.png)

*Figure 3.2 — L'interface de travail : la grille à six colonnes avec les cartes audio.*

La grille est le centre opérationnel du logiciel : six colonnes verticales côte à côte, chacune avec son en-tête coloré et sa propre logique de comportement audio. Les effets sonores n'y ont pas leur place : ils vivent dans le pad FX (Chapitre 7).

### En-têtes de colonne

Chaque en-tête affiche le nom de la colonne, sa catégorie, et sert aussi d'indicateur d'état. En temps normal, il reste statique, coloré dans la teinte propre à la colonne. Mais si le clip en lecture est le dernier disponible, qu'il n'est pas en boucle et qu'il reste moins de **20 secondes** avant la fin, l'en-tête bascule en alerte **DEAD AIR** : il pulse, vire à l'ambre, affiche une icône d'avertissement et le badge **END**. De quoi avoir le temps de préparer la piste suivante avant que le silence ne s'installe.

Chaque couleur de colonne se personnalise : un clic sur la pastille colorée de l'en-tête ouvre une palette de **30 teintes**, et le choix est enregistré dans le fichier de projet.

L'en-tête de la colonne **Pré-émission** porte en plus un bouton de **rotation** : une fois activé, il insère automatiquement jingles et promos à intervalles réguliers dans la file d'attente d'avant-direct (Chapitre 13).

### Les six colonnes

**Show Assets (Vert)**
Ce sont les éléments structurels de l'émission : génériques, bases musicales, ambiances (*bed*), stacchi institutionnels. Ils se comportent en éléments de second plan, cédant de l'espace dès qu'une voix ou un morceau arrive, mais gardent leur rotation interne tant qu'on ne les arrête pas.

**Jingle (Ambre)** et **Promo (Cyan)**
Ces deux colonnes accueillent respectivement les jingles identitaires et les promos ou autopromotions. Sur le plan audio, elles se comportent exactement comme les Show Assets, dont elles partagent la famille ; les séparer garde simplement la conduite lisible.

**Musiques de l'épisode (Rouge)**
C'est la playlist musicale. Ses clips participent activement au mixage automatique : baissés quand une voix intervient, ils font eux-mêmes taire les bases des Assets dès qu'ils entrent en lecture (Chapitre 6). Le logiciel détecte automatiquement leur **BPM**, affiché par un badge dédié.

**Voix / Enregistrements (Orange)**
Interviews, blocs parlés préenregistrés, messages vocaux : cette colonne détient la **priorité maximale** du système de mixage. Dès qu'un de ses clips joue, tous les autres signaux passent à un niveau d'arrière-plan.

**Pré-émission (Violet)**
C'est la playlist d'échauffement avant le direct, une file musicale autonome avec rotation optionnelle de jingles et de promos. Une fois le direct lancé, cette colonne est en général vidée ou désactivée.

---

## 3.3 La carte audio (clip)

Chaque fichier audio importé prend la forme d'une **carte** rectangulaire dans la grille. C'est l'unité opérationnelle du système : on la voit, on la lance, on la configure, on la déplace.

### Anatomie d'une carte

**Titre et artiste.** C'est le nom du fichier, ou un nom personnalisé attribué dans les propriétés. Ce titre personnalisé ne change que l'étiquette affichée dans le logiciel : le fichier original reste intact sur le disque. Sur les clips musicaux, le nom de l'artiste peut s'afficher sous le titre.

**Minuteur.** À l'arrêt, il affiche la durée totale du clip au format `MM:SS`. Pendant la lecture, il bascule en **compte à rebours** avec un signe négatif (ex. `−01:20`), puis passe au **rouge** à moins de 15 secondes de la fin.

**Badges d'état.** De petites étiquettes communiquent immédiatement les propriétés configurées :

- **STACCO** — le clip est réglé pour se superposer aux autres sans les arrêter.
- **LOOP** — le clip repartira du début à la fin de la lecture.
- **NEXT** — à la fin de ce clip, le suivant de la colonne démarrera automatiquement.
- **▶ UP NEXT** — met en évidence quel clip sera le prochain à partir dans la séquence automatique.
- **### BPM** — le tempo détecté, sur les clips musicaux.
- **TRIM…** — analyse du silence en cours (Auto-Trim).
- **FADE OUT** — apparaît sur le clip sortant pendant un crossfade ou un fondu.
- **📋** — le clip a une note associée dans la NoteBoard (Chapitre 13).

**Attributions.** Une touche assignée au clip affiche sa lettre dans un badge à la couleur de la colonne ; un binding MIDI affiche l'étiquette `M` suivie du numéro de note (ex. `M60`).

**Repères de structure.** Une fois les marqueurs configurés, la lecture affiche les comptes à rebours `INTRO: −MM:SS` (en cyan) puis `OUTRO IN: −MM:SS` (en orange), jusqu'à l'avis `🚨 OUTRO` au début de la coda.

**Indicateur de lecture.** Un clip en lecture illumine sa carte : bordure verte, halo lumineux en fond, pastille pulsante, titre mis en évidence. La barre de progression défile en arrière-plan de la carte.

### Interaction avec les cartes

- **Clic gauche** — lance le clip à l'arrêt, ou l'arrête (avec fondu de sortie) s'il joue déjà.
- **Ctrl + clic** (Windows/Linux) ou **Cmd + clic** (macOS) — sélectionne le clip sans le lancer. La bordure devient bleue. Utile pour la sélection multiple et la suppression groupée.
- **Touche Suppr** (ou *Delete* / *Backspace*) — supprime les clips sélectionnés de la grille. Si plusieurs clips sont sélectionnés, le logiciel demande confirmation.
- **Clic droit** — ouvre les **Paramètres du clip** : propriétés, éditeur de forme d'onde, notes (Chapitre 5).
- **Glisser-déposer** — faites glisser une carte pour la réorganiser dans la colonne ou la déplacer vers une autre. Un indicateur lumineux bleu montre la position d'insertion pendant le glissement.

### Carte en état d'erreur

Une carte affichant **FICHIER MANQUANT** avec une bordure rouge signale un fichier audio devenu inaccessible : déplacé, renommé, ou situé sur un disque externe débranché. Le clip reste illisible tant que le fichier n'a pas retrouvé son chemin d'origine. La gestion de ces erreurs de chemin est détaillée au Chapitre 14.
