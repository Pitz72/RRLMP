# Chapitre 13 — Fonctions avancées

---

Ce chapitre rassemble les fonctionnalités qui n'appartiennent pas au flux de travail de base, mais qui, une fois découvertes, entrent durablement dans la pratique de ceux qui produisent des émissions avec soin et régularité : la NoteBoard, la gestion des couleurs de colonnes, les transitions, les paramètres généraux, le registre des lancements et l'historique des modifications.

---

## 13.1 NoteBoard : le conducteur en régie

La **NoteBoard** est le système de notes intégrées aux clips. Elle permet d'associer à n'importe quel clip un texte écrit (instructions opérationnelles, conduites, notes sur une interview, le texte complet d'un spot) et de le faire apparaître automatiquement à l'écran au moment où ce clip entre en lecture.

### Saisir une note

1. Ouvrez les paramètres du clip (clic droit sur la carte) et allez à la section *Notes*.
2. Écrivez le texte dans le champ libre. Il n'y a pas de limite de longueur.

Les clips ayant une note affichent le badge 📋 sur la carte.

### Le panneau en direct

Quand un clip avec notes entre en lecture, le **panneau NoteBoard** apparaît dans la partie inférieure de l'écran avec le texte associé, coiffé du nom et de la couleur du clip. Le panneau reste visible pendant toute la durée de la lecture et se ferme de lui-même quand le clip se termine. Si plusieurs clips avec notes jouent ensemble, le panneau affiche celui de plus haute priorité.

### Cas d'usage

- **Régie parlée.** Associez à chaque générique les premières lignes du bloc parlé qui suit : quand le générique part, le texte est déjà sous les yeux.
- **Contenu à lire.** Un spot publicitaire avec le texte complet dans la note : dès qu'il part, on lit.
- **Instructions opérationnelles.** « Baisser le retour », « Contrôler le niveau du casque invité », « Démarrer l'enregistrement ».
- **Interviews.** Les questions pour l'invité restent visibles pendant toute la durée du clip.

---

## 13.2 Personnalisation des couleurs de colonne

Les couleurs par défaut ont une signification établie (vert pour les Assets, rouge pour les Musiques, et ainsi de suite), mais chaque colonne est personnalisable. Cliquez sur la **pastille colorée** de l'en-tête de colonne : une palette de **30 couleurs** s'ouvre. Choisissez-en une et la colonne (en-tête, cartes, indicateurs) prend immédiatement la nouvelle couleur. Le choix est enregistré dans le fichier de projet.

Les cartes héritent dynamiquement de la couleur de la colonne : au repos, elles apparaissent dans une teinte atténuée, en lecture dans la couleur pleine. Chaque projet peut ainsi avoir sa propre identité chromatique.

---

## 13.3 Transitions entre clips

Quand un clip est réglé sur *Play Next*, le passage au clip suivant de la colonne se fait selon le mode de transition configuré :

- **Crossfade.** Le clip sortant s'estompe pendant que l'entrant monte, superposés. Durée par défaut : 2 secondes.
- **Segue.** Le clip sortant s'estompe en sortie pendant que le suivant démarre aussitôt à plein volume. Durée par défaut du fondu : 0,8 seconde.
- **Gapless (coupe nette).** Le clip sortant s'arrête net et le suivant démarre immédiatement, sans fondu.

Vous pouvez définir une transition au niveau de chaque clip ou laisser **Défaut global**, qui applique le choix général défini dans les Paramètres. La colonne Pré-émission utilise le crossfade par défaut. Tous les modes sont essayables sans passer à l'antenne, via le bouton « Test → » de l'éditeur (Chapitre 5).

---

## 13.4 La fenêtre Paramètres généraux

Les **Paramètres** (menu Outils) rassemblent les préférences globales du logiciel, organisées en onglets.

### Généraux

- **Langue.** Sélectionnez la langue de l'interface parmi les huit disponibles. La modification est immédiate.
- **Contrôle à distance (Bêta).** Active la télécommande via navigateur et affiche PIN, port et adresses (Chapitre 11).
- **Disposition régie.** Affiche ou masque individuellement les colonnes de la grille. Masquer une colonne n'en supprime pas les clips : ils restent dans le projet. C'est une préférence globale, valable pour tous les projets.

### Audio & Mix

- **Périphérique de sortie.** La destination audio (Chapitre 8).
- **Intelligence de mixage.** L'ampleur du ducking (de combien la musique descend quand une voix parle, par défaut 20 %) et sa rapidité (par défaut 500 ms).
- **Transitions.** Le mode de transition par défaut et les durées de crossfade et de segue.

### Enregistrement

Récapitulatif du point de capture (après le limiter) et choix du format par défaut proposé à l'exportation (Chapitre 9).

### Master Chain

- **Homologation du volume.** Active/désactive la normalisation de loudness et en définit la cible (par défaut −16 LUFS).
- **Master Chain.** Active ou bypasse toute la chaîne, et règle les étages individuels : fréquence de l'HPF, style du glue multibande, seuil du limiter. Un bouton rétablit les valeurs par défaut (Chapitre 6).

---

## 13.5 Playout Log

Le **Playout Log** (icône dans l'en-tête) est le registre chronologique des lancements : il garde trace de ce qui est passé à l'antenne et quand, jusqu'aux derniers milliers d'événements. Il est utile pour reconstituer une conduite a posteriori, vérifier ce qui a été diffusé ou compiler un compte rendu du direct.

---

## 13.6 Annuler et Répéter

Les modifications de la conduite (ajouts, déplacements, suppressions) sont réversibles. `Ctrl+Z` annule la dernière opération, `Ctrl+Y` (ou `Ctrl+Shift+Z`) la répète, avec un historique profond de plusieurs dizaines de pas. Les mêmes entrées sont disponibles dans le menu Outils. C'est le filet de sécurité pour les opérations faites à la hâte pendant la préparation.

---

## 13.7 Système de notifications toast

RLMP n'utilise pas de fenêtres bloquantes pour les communications de routine. Les notifications non critiques apparaissent sous forme de **toasts** : de petits bandeaux non intrusifs dans un coin de l'écran, qui restent quelques secondes et disparaissent d'eux-mêmes sans interrompre la lecture. Ils servent à confirmer un enregistrement, la fin d'une exportation, une opération de MIDI Learn ou à avertir de fichiers manquants.

Les **fenêtres de confirmation**, nécessaires quand une action est irréversible (la suppression de clips, la fermeture d'un projet non enregistré), sont en revanche modales et exigent une réponse, mais elles sont conçues pour ne pas couper la lecture en cours : l'audio continue pendant que vous décidez.
