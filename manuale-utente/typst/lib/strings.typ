// =============================================================================
// strings.typ — Dizionario multilingua del Manuale Utente di Runtime Live
// Machine Pro. La lingua si sceglie da riga di comando: `--input lang=<lang>`.
// Un solo punto di verità per tutte le stringhe di template (copertina,
// frontespizio, colophon, header, box, indice, etichetta di capitolo).
// Lingue: it · en (solo italiano e inglese, come l'app dalla 1.15.32)
// =============================================================================

#let LANG = sys.inputs.at("lang", default: "it")

#let STR = (
  it: (
    typst-lang: "it",
    manual-title: "Manuale Utente",
    toc-title: "Indice",
    tagline: "SISTEMA DI REGIA AUDIO IN TEMPO REALE",
    aligned-to: "Allineato alla versione",
    version-word: "Versione",
    language-name: "Italiano",
    edition-name: "Seconda Edizione",
    chapter-prefix: "Capitolo ", chapter-suffix: "",
    note-label: "Nota", tip-label: "Suggerimento", warning-label: "⚠ Attenzione",
    rights: "Tutti i diritti riservati.",
    repro: "Nessuna parte di questo documento può essere riprodotta, distribuita o trasmessa in qualsiasi forma o con qualsiasi mezzo senza il previo consenso scritto dell'autore.",
    trademark: "Runtime Live Machine Pro è un software originale. Tutti i marchi citati appartengono ai rispettivi proprietari.",
    credits: "Software ideato e sviluppato da SIMONE PIZZI. Produzione Ecosystem.Runtime. Composto con Typst; titoli in Sora, testo in Inter, codice in Source Code Pro.",
  ),
  en: (
    typst-lang: "en",
    manual-title: "User Manual",
    toc-title: "Contents",
    tagline: "REAL-TIME AUDIO SHOW-CONTROL SYSTEM",
    aligned-to: "Aligned with version",
    version-word: "Version",
    language-name: "English",
    edition-name: "Second Edition",
    chapter-prefix: "Chapter ", chapter-suffix: "",
    note-label: "Note", tip-label: "Tip", warning-label: "⚠ Warning",
    rights: "All rights reserved.",
    repro: "No part of this document may be reproduced, distributed, or transmitted in any form or by any means without the prior written consent of the author.",
    trademark: "Runtime Live Machine Pro is an original software product. All trademarks mentioned belong to their respective owners.",
    credits: "Software designed and developed by SIMONE PIZZI. Produced by Ecosystem.Runtime. Typeset with Typst; headings in Sora, body in Inter, code in Source Code Pro.",
  ),
)

#let T = STR.at(LANG, default: STR.it)
