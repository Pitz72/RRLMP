#import "lib/manuale-template.typ": *

// Versione del software ed etichetta d'edizione: un solo punto di verità.
#let VERSIONE = "1.11.5"
#let EDIZIONE = "Seconda Edizione · 2026"

// Due tirature dalla stessa sorgente:
//  • digitale (default) — include la copertina a pagina intera;
//  • interno KDP (`--input kdp=1`) — parte dal frontespizio, senza copertina
//    (la stampa cartacea sarà lavorata in una sessione dedicata).
#let per-kdp = "kdp" in sys.inputs

#show: conf.with(titolo: "Manuale Utente", autore: "Simone Pizzi")

// ---- FRONTE DEL MANUALE -----------------------------------------------------
#if not per-kdp { copertina() }
#frontespizio(versione: VERSIONE, autore: "Simone Pizzi", edizione: EDIZIONE)
#colophon(versione: VERSIONE, autore: "Simone Pizzi", edizione: EDIZIONE)

// ---- INDICE -----------------------------------------------------------------
#page(header: none)[
  #text(font: font-display, size: 22pt, weight: 800, fill: c.ink)[Indice]
  #v(2mm)
  #box(width: 38mm, line(length: 100%, stroke: 2.5pt + brandGrad))
  #v(6mm)
  #outline(title: none, depth: 2, indent: 1.2em)
]

// ---- CAPITOLI ---------------------------------------------------------------
#include "capitoli/cap01.typ"
#include "capitoli/cap02.typ"
#include "capitoli/cap03.typ"
#include "capitoli/cap04.typ"
#include "capitoli/cap05.typ"
#include "capitoli/cap06.typ"
#include "capitoli/cap07.typ"
#include "capitoli/cap08.typ"
#include "capitoli/cap09.typ"
#include "capitoli/cap10.typ"
#include "capitoli/cap11.typ"
#include "capitoli/cap12.typ"
#include "capitoli/cap13.typ"
#include "capitoli/cap14.typ"
