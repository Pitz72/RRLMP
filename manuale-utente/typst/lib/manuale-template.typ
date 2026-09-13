// =============================================================================
// manuale-template.typ — Identità tipografica del Manuale Utente di
// Runtime Live Machine Pro. Palette, font, copertina, frontespizio, colophon,
// impaginazione, titoli e box ricorrenti. Protocollo modulare Typst.
// Multilingua: le stringhe arrivano da strings.typ (--input lang=<lang>).
// =============================================================================

#import "strings.typ": T, LANG

// --- PALETTE DI MARCA ---------------------------------------------------------
#let c = (
  navy:        rgb("#0a0d12"),   // fondo copertina
  ink:         rgb("#141a24"),   // testo corpo (navy quasi-nero)
  ink-soft:    rgb("#3a4757"),
  muted:       rgb("#6a7686"),
  rule:        rgb("#dce4ee"),   // filetti chiari
  paper:       rgb("#ffffff"),
  cyan:        rgb("#0891b2"),   // accento su bianco
  cyan-bright: rgb("#22d3ee"),
  blue:        rgb("#0070ff"),
  purple:      rgb("#6610f2"),
  emerald:     rgb("#059669"),
  emerald-bright: rgb("#22c55e"),
  amber:       rgb("#b45309"),
  amber-bright: rgb("#f59e0b"),
  red:         rgb("#dc2626"),
)
#let brandGrad = gradient.linear(c.cyan-bright, c.blue, c.purple)

// --- FONT ---------------------------------------------------------------------
// Le code CJK (Microsoft YaHei / Noto Sans SC) chiudono la catena di fallback:
// vengono usate solo per i glifi cinesi dell'edizione zh-cn, trasparenti altrove.
#let cjk = ("Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC", "SimSun")
#let font-display = ("Sora", "Inter", "Segoe UI", ..cjk)
#let font-body    = ("Inter", "Segoe UI", ..cjk)
#let font-mono    = ("Source Code Pro", "Consolas", ..cjk)

#let _capnum = counter("rlmp-capitolo")

// =============================================================================
// COPERTINA — pagina a vivo, immagine localizzata a piena pagina.
// Ogni lingua ha la propria copertina (assets/copertina-<lang>.png), renderizzata
// dalla stessa pipeline SVG->PNG del riferimento estetico IT (branding/build-cover.py
// + manuale-utente/render-svg.js), non un redraw Typst separato: garantisce
// gradiente, glow e onda audio identici in tutte le lingue.
// =============================================================================
#let copertina() = page(
  fill: c.navy, margin: 0pt, header: none, footer: none,
)[
  #image("../assets/copertina-" + LANG + ".png", width: 100%, height: 100%)
]

// =============================================================================
// FRONTESPIZIO — pagina interna, testo scuro su bianco, accenti di marca
// =============================================================================
#let frontespizio(versione: "1.11.5", autore: "Simone Pizzi", edizione: "Seconda Edizione · 2026") = {
  page(header: none, footer: none)[
    #v(1fr)
    #align(center)[
      #image("../assets/logo.png", width: 1.7in)
      #v(9mm)
      #text(font: font-display, size: 10.5pt, weight: 600, tracking: 4pt, fill: c.cyan)[#T.tagline]
      #v(6mm)
      #text(font: font-display, size: 34pt, weight: 800, tracking: .5pt, fill: c.ink)[Runtime Live Machine #text(fill: c.blue)[Pro]]
      #v(3mm)
      #text(font: font-mono, size: 13pt, weight: 600, fill: c.cyan)[v#versione]
      #v(5mm)
      #box(width: 46mm, line(length: 100%, stroke: 1.6pt + brandGrad))
      #v(6mm)
      #text(font: font-display, size: 17pt, weight: 600, fill: c.ink-soft)[#T.manual-title]
      #v(8mm)
      #text(font: font-display, size: 11.5pt, weight: 500, fill: c.ink)[#autore]
    ]
    #v(1fr)
    #align(center)[
      #text(font: font-display, size: 9.5pt, weight: 600, fill: c.cyan, tracking: .5pt)[#edizione]
      #v(1.5mm)
      #text(font: font-mono, size: 9pt, fill: c.ink-soft)[#T.aligned-to #versione]
    ]
    #v(8mm)
  ]
}

// =============================================================================
// COLOPHON / PAGINA DEI DIRITTI
// =============================================================================
#let colophon(versione: "1.11.5", autore: "Simone Pizzi", edizione: "Seconda Edizione · 2026",
              produzione: "Runtime Radio") = {
  page(header: none, footer: none)[
    #v(1fr)
    #align(center)[
      #image("../assets/logo.png", width: 74pt)
      #v(6mm)
      #set par(justify: false, leading: .9em)
      #set text(font: font-body, size: 9.5pt, fill: c.ink-soft)
      #text(font: font-display, size: 12pt, weight: 600, fill: c.ink)[Runtime Live Machine Pro — #T.manual-title]
      #v(2.5mm)
      #text(size: 9pt)[#edizione · #T.aligned-to #versione]
      #v(3mm)
      #box(width: 30mm, line(length: 100%, stroke: 1pt + brandGrad))
      #v(3.5mm)
      #text(fill: c.ink, weight: 600)[© 2026 #autore (#produzione)]
      #linebreak()
      #T.rights
      #v(4.5mm)
      #block(width: 82%)[#T.repro]
      #v(4.5mm)
      #block(width: 82%)[#T.trademark]
      #v(4.5mm)
      #block(width: 82%)[#T.credits]
    ]
    #v(1fr)
  ]
}

// =============================================================================
// BOX RICORRENTI
// =============================================================================
#let _callout(titolo, accent, sfondo, corpo) = block(
  width: 100%,
  fill: sfondo,
  stroke: (left: 3pt + accent),
  radius: (top-right: 4pt, bottom-right: 4pt),
  inset: (left: 12pt, rest: 10pt),
  above: 1.1em, below: 1.1em,
)[
  #text(font: font-display, size: 8pt, weight: 700, fill: accent, tracking: 1pt)[#upper(titolo)]
  #v(-0.2em)
  #set text(size: 9.8pt)
  #corpo
]

#let nota(corpo)        = _callout(T.note-label, c.cyan, rgb("#eef7fb"), corpo)
#let suggerimento(corpo) = _callout(T.tip-label, c.emerald, rgb("#edfaf4"), corpo)
#let attenzione(corpo)  = _callout(T.warning-label, c.amber, rgb("#fdf6ec"), corpo)

// =============================================================================
// CONFIGURAZIONE DOCUMENTO
// =============================================================================
#let conf(titolo: "Manuale Utente", autore: "Simone Pizzi", doc) = {
  set document(title: "Runtime Live Machine Pro — " + titolo, author: autore)

  set page(
    width: 210mm, height: 297mm,               // A4 (edizione digitale)
    margin: (top: 22mm, bottom: 20mm, x: 20mm),
    header: context {
      let pg = here().page()
      let h1 = query(heading.where(level: 1))
      let corrente = none
      for h in h1 { if h.location().page() <= pg { corrente = h } }
      if corrente != none {
        set text(font: font-body, size: 8pt, fill: c.muted)
        grid(columns: (1fr, auto),
          align(left)[Runtime Live Machine Pro · #T.manual-title],
          align(right)[#corrente.body])
        v(-0.4em)
        line(length: 100%, stroke: 0.4pt + c.rule)
      }
    },
    footer: context {
      let pg = counter(page).get().first()
      if pg > 1 {
        set text(font: font-mono, size: 8.5pt, fill: c.ink-soft)
        align(center)[#pg]
      }
    },
  )

  set text(font: font-body, size: 10.5pt, fill: c.ink, lang: T.typst-lang, hyphenate: true)
  set par(justify: true, leading: 0.72em, spacing: 0.95em, first-line-indent: 0pt)
  set heading(numbering: none)

  // Titolo di capitolo (livello 1)
  show heading.where(level: 1): it => {
    pagebreak(weak: true)
    _capnum.step()
    block(above: 0pt, below: 0.9em)[
      #context text(font: font-display, size: 11pt, weight: 700, fill: c.cyan, tracking: 2pt)[
        #upper(T.chapter-prefix + str(_capnum.get().first()) + T.chapter-suffix)
      ]
      #v(1mm)
      #text(font: font-display, size: 26pt, weight: 800, fill: c.ink, hyphenate: false)[#it.body]
      #v(2mm)
      #box(width: 38mm, line(length: 100%, stroke: 2.5pt + brandGrad))
    ]
    v(0.4em)
  }
  show heading.where(level: 2): it => block(above: 1.5em, below: 0.6em)[
    #text(font: font-display, size: 15pt, weight: 600, fill: c.ink)[#it.body]
    #v(0.6mm)
    #line(length: 100%, stroke: 0.4pt + c.rule)
  ]
  show heading.where(level: 3): it => block(above: 1.1em, below: 0.4em)[
    #text(font: font-display, size: 11.5pt, weight: 600, fill: c.cyan)[#it.body]
  ]

  // Codice inline
  show raw.where(block: false): it => box(
    fill: rgb("#eef3f7"), radius: 2.5pt, inset: (x: 3.5pt, y: 0pt), outset: (y: 2.5pt),
  )[#text(font: font-mono, size: 0.86em, fill: c.cyan)[#it]]

  // Blocco codice
  show raw.where(block: true): it => block(
    width: 100%, fill: rgb("#f4f7f9"), stroke: (left: 2.5pt + c.cyan),
    radius: (top-right: 3pt, bottom-right: 3pt), inset: 9pt, above: 1em, below: 1em,
  )[#text(font: font-mono, size: 9pt, fill: c.ink)[#it]]

  // Tabelle
  set table(
    stroke: (x, y) => (bottom: 0.4pt + c.rule),
    inset: (x: 7pt, y: 5pt),
    fill: (_, y) => if y == 0 { c.ink } else if calc.even(y) { rgb("#f6f9fb") },
  )
  show table.cell: set text(size: 8.8pt)
  show table.cell.where(y: 0): set text(font: font-display, weight: 700, size: 8pt, fill: c.paper)

  // Figure e didascalie (numerazione a mano dentro il testo della didascalia)
  set figure(gap: 1.4mm, numbering: none)
  show figure.caption: it => text(font: font-body, size: 8.3pt, style: "italic", fill: c.muted)[#it.body]
  show figure: set block(breakable: false)

  // Enfasi / link
  show strong: set text(fill: c.ink)
  show link: set text(fill: c.cyan)

  doc
}
