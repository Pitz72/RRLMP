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
    rights: "Software libero, rilasciato sotto licenza MIT.",
    repro: "Questo manuale fa parte del progetto e ne segue la licenza: può essere copiato, modificato e ridistribuito liberamente, a condizione di conservare l'avviso di copyright e il testo della licenza MIT.",
    trademark: "Runtime Live Machine Pro è un progetto di Runtime Radio. I marchi citati appartengono ai rispettivi proprietari.",
    credits: "Software ideato e sviluppato da SIMONE PIZZI con l'ausilio di modelli linguistici: Gemini 3.0 e 3.1; Claude Sonnet 4.6, Opus 4.7, Opus 4.8, Sonnet 5, Opus 5 e Fable 5. Codice sorgente: github.com/Pitz72/RRLMP. Composto con Typst; titoli in Sora, testo in Inter, codice in Source Code Pro.",
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
    rights: "Free software, released under the MIT licence.",
    repro: "This manual is part of the project and follows its licence: it may be copied, modified and redistributed freely, provided the copyright notice and the text of the MIT licence are kept.",
    trademark: "Runtime Live Machine Pro is a Runtime Radio project. Trademarks mentioned belong to their respective owners.",
    credits: "Software designed and developed by SIMONE PIZZI with the help of large language models: Gemini 3.0 and 3.1; Claude Sonnet 4.6, Opus 4.7, Opus 4.8, Sonnet 5, Opus 5 and Fable 5. Source code: github.com/Pitz72/RRLMP. Typeset with Typst; headings in Sora, body in Inter, code in Source Code Pro.",
  ),
)

#let T = STR.at(LANG, default: STR.it)
