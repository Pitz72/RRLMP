# CHAPITRE 5 : LE MOTEUR DE MIXAGE (LE CERVEAU)

Runtime Live Machine Pro n'est pas un simple lecteur qui joue des fichiers audio au hasard. À l'intérieur, il y a un **"Cerveau" de Mixage** toujours actif.
Le logiciel agit comme un ingénieur du son virtuel invisible : il écoute ce que vous faites et ajuste automatiquement les volumes des autres pistes pour garantir que le résultat final soit toujours propre et intelligible.

Vous n'avez pas à vous soucier de baisser manuellement la musique quand une interview commence : RRLMP s'en occupe.

---

## 5.1 La Hiérarchie Audio (La Pyramide)

Pour comprendre comment cela fonctionne, imaginez les colonnes comme une pyramide d'importance. Celui qui est au sommet "commande" sur le volume de celui qui est en dessous.

1.  **NIVEAU 1 (Chefs Suprêmes) : VOIX / PRÉ-ENREGISTREMENTS** (Colonne Orange)
    *   Elles ont toujours la priorité absolue. Personne ne peut baisser leur volume. Quand elles parlent, tous les autres se taisent.
2.  **NIVEAU 2 (Classe Moyenne) : CHANSONS DE L'ÉPISODE** (Colonne Rouge)
    *   Elles sont baissées par les Voix. Mais elles commandent sur les Assets.
3.  **NIVEAU 3 (Fond Sonore) : SHOW ASSETS** (Colonne Verte)
    *   Ce sont les bases et les tapis sonores. Ils sont rendus muets par presque tout le reste.

> **Notez Bien** : La colonne **SFX / CARTWALL** (Grise) est "hors système". Les effets sonores jouent toujours au volume maximum et se superposent à tout sans influencer ou être influencés par les autres. Des applaudissements doivent s'entendre fort, même par-dessus une voix.

---

## 5.2 Le Ducking Automatique (Effet Radio)

C'est la fonction la plus utilisée en radio. Le "Ducking" est la baisse automatique de la musique quand quelqu'un parle.

*   **Comment ça marche** :
    1.  Vous avez une Chanson ou une Base en lecture (Volume 100%).
    2.  Vous lancez un clip depuis la colonne **VOIX** (ex. une interview ou un vocal).
    3.  Le logiciel baisse immédiatement et doucement la Chanson/Base à un niveau de fond sonore (environ 20% du volume, ou -14dB).
    4.  La Voix sonne claire par-dessus la musique.
    5.  Dès que le clip Voix finit, la musique remonte automatiquement à 100%.

*   **Avantage** : Vous n'avez pas à utiliser la souris pour baisser des faders tout en essayant de lancer l'interview. C'est tout automatique.

---

## 5.3 Dominance Musicale (Gestion Intelligente des Bases)

Une erreur classique des réalisateurs débutants est de faire jouer une chanson *par-dessus* une base rythmique (Bed), créant un chaos sonore (batterie contre batterie). RRLMP résout ce problème avec la **Dominance Musicale**.

*   **Le Scénario** :
    Vous avez une Base (Show Asset) en boucle sous la voix de l'animateur. À un moment donné, vous lancez un disque (Chanson).
*   **Ce que fait RRLMP** :
    Au lieu d'arrêter la base (dont vous pourriez avoir besoin prête après la chanson), le logiciel la porte à **Volume 0 (Muet)** mais continue de la faire tourner en "fantôme".
*   **Le Résultat** :
    On n'entend que la Chanson. La base a disparu.
*   **Le Retour** :
    Quand la Chanson finit (ou que vous appuyez sur Stop sur la chanson), la Base réémerge automatiquement en fondu (Fade In).

Cela vous permet d'avoir un flux continu "Base -> Chanson -> Base" sans jamais avoir à cliquer sur "Play" sur la base une seconde fois.

---

## 5.4 Exceptions : Les "Stacchi" (Interruptions)

Que se passe-t-il si vous voulez jouer un Jingle de la radio *par-dessus* la base, sans que la base disparaisse complètement ?
Ici intervient le réglage **Behavior : Stacco** (voir Chap. 4).

*   Si un clip dans la colonne Assets est réglé sur "Normal", il arrêtera les autres bases.
*   S'il est réglé comme **"Stacco"**, il se superposera aux autres bases en les baissant légèrement, mais sans les arrêter. C'est idéal pour les Station ID ("Vous écoutez Runtime Radio...") qui doivent "chevaucher" l'intro d'un morceau ou une base.
