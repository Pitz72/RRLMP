#!/usr/bin/env python3
"""
RLMP Manual PDF Builder
=======================
Generates a professional PDF manual from Markdown chapter files.

Usage:
    python3 build_manual_pdf.py --lang it --output "Runtime_Live_Machine_Pro_Manuale_IT.pdf"
    python3 build_manual_pdf.py --lang en --output "Runtime_Live_Machine_Pro_Manual_EN.pdf"

Requirements:
    pip install weasyprint markdown --break-system-packages

Version: 1.0
"""

import argparse
import os
import re
import sys
from pathlib import Path
import markdown
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

# ─── Directory layout ────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent.resolve()
ASSETS_DIR = SCRIPT_DIR.parent / "docs" / "assets"
FONTS_DIR  = Path("/sessions/tender-gracious-ritchie/fonts")

# ─── Global metadata ─────────────────────────────────────────────────────────

META = {
    "version":       "1.2.4",
    "production":    "Ecosystem.Runtime",
    "author":        "Simone Pizzi",
    "software":      "Runtime Live Machine Pro",
    "copyright_year":"2026",
}

# ─── Per-language configuration ───────────────────────────────────────────────

LANG_CONFIG = {
    "it": {
        "title":         "Manuale Utente",
        "toc_title":     "Indice",
        "edition":       "Prima Edizione",
        "chapters":      [f"cap{i}" for i in range(1, 13)],
        "note_label":    "Nota",
        "tip_label":     "Suggerimento",
        "warning_label": "Attenzione",
        "page_label":    "Pagina",
    },
    "en": {
        "title":         "User Manual",
        "toc_title":     "Contents",
        "edition":       "First Edition",
        "chapters":      [f"cap{i}" for i in range(1, 13)],
        "note_label":    "Note",
        "tip_label":     "Tip",
        "warning_label": "Warning",
        "page_label":    "Page",
    },
    "fr": {
        "title":         "Manuel Utilisateur",
        "toc_title":     "Sommaire",
        "edition":       "Première Édition",
        "chapters":      [f"cap{i}" for i in range(1, 9)],
        "note_label":    "Note",
        "tip_label":     "Conseil",
        "warning_label": "Attention",
        "page_label":    "Page",
    },
    "de": {
        "title":         "Benutzerhandbuch",
        "toc_title":     "Inhaltsverzeichnis",
        "edition":       "Erste Ausgabe",
        "chapters":      [f"cap{i}" for i in range(1, 9)],
        "note_label":    "Hinweis",
        "tip_label":     "Tipp",
        "warning_label": "Achtung",
        "page_label":    "Seite",
    },
    "es": {
        "title":         "Manual de Usuario",
        "toc_title":     "Índice",
        "edition":       "Primera Edición",
        "chapters":      [f"cap{i}" for i in range(1, 9)],
        "note_label":    "Nota",
        "tip_label":     "Sugerencia",
        "warning_label": "Atención",
        "page_label":    "Página",
    },
    "de": {
        "title":         "Benutzerhandbuch",
        "toc_title":     "Inhaltsverzeichnis",
        "edition":       "Erste Ausgabe",
        "chapters":      [f"cap{i}" for i in range(1, 9)],
        "note_label":    "Hinweis",
        "tip_label":     "Tipp",
        "warning_label": "Achtung",
        "page_label":    "Seite",
    },
    "pt": {
        "title":         "Manual do Utilizador",
        "toc_title":     "Índice",
        "edition":       "Primeira Edição",
        "chapters":      [f"cap{i}" for i in range(1, 9)],
        "note_label":    "Nota",
        "tip_label":     "Dica",
        "warning_label": "Atenção",
        "page_label":    "Página",
    },
    "ru": {
        "title":         "Руководство пользователя",
        "toc_title":     "Содержание",
        "edition":       "Первое издание",
        "chapters":      [f"cap{i}" for i in range(1, 9)],
        "note_label":    "Примечание",
        "tip_label":     "Совет",
        "warning_label": "Внимание",
        "page_label":    "Страница",
    },
    "zh-cn": {
        "title":         "用户手册",
        "toc_title":     "目录",
        "edition":       "第一版",
        "chapters":      [f"cap{i}" for i in range(1, 9)],
        "note_label":    "注意",
        "tip_label":     "提示",
        "warning_label": "警告",
        "page_label":    "页",
    },
}

# ─── CSS ─────────────────────────────────────────────────────────────────────

def build_css(cfg):
    inter_path    = str(FONTS_DIR / "Inter-Variable.ttf")
    lato_regular  = "/usr/share/fonts/truetype/lato/Lato-Regular.ttf"
    lato_bold     = "/usr/share/fonts/truetype/lato/Lato-Bold.ttf"
    lato_black    = "/usr/share/fonts/truetype/lato/Lato-Black.ttf"
    lato_italic   = "/usr/share/fonts/truetype/lato/Lato-Italic.ttf"
    lato_boldital = "/usr/share/fonts/truetype/lato/Lato-BoldItalic.ttf"
    serif_regular = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
    serif_bold    = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
    serif_italic  = "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"
    serif_boldital= "/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf"
    mono_regular  = "/usr/share/fonts/truetype/noto/NotoSansMono-Regular.ttf"
    mono_bold     = "/usr/share/fonts/truetype/noto/NotoSansMono-Bold.ttf"

    return f"""
/* ── Font face declarations ── */
@font-face {{
    font-family: 'Inter';
    src: url('file://{inter_path}');
    font-weight: 100 900;
}}
@font-face {{
    font-family: 'Lato';
    src: url('file://{lato_regular}');
    font-weight: 400;
    font-style: normal;
}}
@font-face {{
    font-family: 'Lato';
    src: url('file://{lato_bold}');
    font-weight: 700;
    font-style: normal;
}}
@font-face {{
    font-family: 'Lato';
    src: url('file://{lato_black}');
    font-weight: 900;
    font-style: normal;
}}
@font-face {{
    font-family: 'Lato';
    src: url('file://{lato_italic}');
    font-weight: 400;
    font-style: italic;
}}
@font-face {{
    font-family: 'Lato';
    src: url('file://{lato_boldital}');
    font-weight: 700;
    font-style: italic;
}}
@font-face {{
    font-family: 'LibSerif';
    src: url('file://{serif_regular}');
    font-weight: 400;
    font-style: normal;
}}
@font-face {{
    font-family: 'LibSerif';
    src: url('file://{serif_bold}');
    font-weight: 700;
    font-style: normal;
}}
@font-face {{
    font-family: 'LibSerif';
    src: url('file://{serif_italic}');
    font-weight: 400;
    font-style: italic;
}}
@font-face {{
    font-family: 'LibSerif';
    src: url('file://{serif_boldital}');
    font-weight: 700;
    font-style: italic;
}}
@font-face {{
    font-family: 'NotoMono';
    src: url('file://{mono_regular}');
    font-weight: 400;
}}
@font-face {{
    font-family: 'NotoMono';
    src: url('file://{mono_bold}');
    font-weight: 700;
}}

/* ── Page setup ── */
@page {{
    size: A4;
    margin: 24mm 22mm 22mm 26mm;

    @top-left {{
        content: string(chapter-title);
        font-family: 'Lato', sans-serif;
        font-size: 7.5pt;
        font-weight: 400;
        color: #888;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        padding-top: 4mm;
    }}
    @top-right {{
        content: "{META['software']}";
        font-family: 'Lato', sans-serif;
        font-size: 7.5pt;
        font-weight: 400;
        color: #bbb;
        letter-spacing: 0.04em;
        padding-top: 4mm;
    }}
    @bottom-center {{
        content: counter(page);
        font-family: 'Lato', sans-serif;
        font-size: 8pt;
        color: #999;
        padding-bottom: 4mm;
    }}
    border-top: 0.4pt solid #e0e0e0;
}}

/* Cover page — no headers/footers, no border */
@page cover {{
    size: A4;
    margin: 0;
    @top-left   {{ content: none; border: none; }}
    @top-right  {{ content: none; border: none; }}
    @bottom-center {{ content: none; }}
    border-top: none;
}}

/* TOC page */
@page toc {{
    size: A4;
    margin: 24mm 22mm 22mm 26mm;
    @top-left  {{ content: "{cfg['toc_title']}"; font-family: 'Lato', sans-serif; font-size: 7.5pt; color: #888; letter-spacing: 0.04em; text-transform: uppercase; padding-top: 4mm; }}
    @top-right {{ content: "{META['software']}"; font-family: 'Lato', sans-serif; font-size: 7.5pt; color: #bbb; letter-spacing: 0.04em; padding-top: 4mm; }}
    @bottom-center {{ content: counter(page); font-family: 'Lato', sans-serif; font-size: 8pt; color: #999; padding-bottom: 4mm; }}
    border-top: 0.4pt solid #e0e0e0;
}}

/* Colophon page */
@page colophon {{
    size: A4;
    margin: 24mm 22mm 22mm 26mm;
    @top-left   {{ content: none; }}
    @top-right  {{ content: none; }}
    @bottom-center {{ content: counter(page); font-family: 'Lato', sans-serif; font-size: 8pt; color: #999; padding-bottom: 4mm; }}
    border-top: none;
}}

/* ── Reset ── */
* {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}}

/* ── Cover page ── */
.cover {{
    page: cover;
    page-break-after: always;
    width: 210mm;
    height: 297mm;
    background: #0d0f14;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}}

.cover-gradient {{
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 60mm;
    background: linear-gradient(180deg, rgba(0,160,180,0.08) 0%, transparent 100%);
}}

.cover-brand-bar {{
    position: absolute;
    top: 0; left: 0;
    width: 3mm;
    height: 100%;
    background: linear-gradient(180deg, #00c8d4 0%, #0070ff 50%, #6610f2 100%);
}}

.cover-banner-wrap {{
    margin: 22mm 20mm 0 25mm;
}}
.cover-banner-wrap img {{
    width: 130mm;
    height: auto;
    display: block;
    border-radius: 6pt;
}}

.cover-text-block {{
    margin: 14mm 20mm 0 25mm;
    padding-bottom: 8mm;
    border-bottom: 0.5pt solid rgba(255,255,255,0.12);
}}
.cover-label {{
    font-family: 'Lato', sans-serif;
    font-size: 8.5pt;
    font-weight: 400;
    color: #00c8d4;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 4mm;
}}
.cover-title {{
    font-family: 'Lato', sans-serif;
    font-size: 28pt;
    font-weight: 900;
    color: #ffffff;
    line-height: 1.05;
    letter-spacing: -0.01em;
}}
.cover-subtitle {{
    font-family: 'Lato', sans-serif;
    font-size: 11pt;
    font-weight: 400;
    color: rgba(255,255,255,0.55);
    margin-top: 4mm;
    letter-spacing: 0.03em;
}}

.cover-meta-block {{
    margin: 8mm 20mm 0 25mm;
}}
.cover-meta-row {{
    font-family: 'Lato', sans-serif;
    font-size: 8.5pt;
    font-weight: 400;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.05em;
    line-height: 2.0;
}}
.cover-meta-row strong {{
    color: rgba(255,255,255,0.65);
    font-weight: 700;
}}

.cover-footer {{
    position: absolute;
    bottom: 10mm;
    left: 25mm;
    right: 20mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 0.4pt solid rgba(255,255,255,0.10);
    padding-top: 4mm;
}}
.cover-production {{
    font-family: 'Lato', sans-serif;
    font-size: 7.5pt;
    font-weight: 700;
    color: rgba(255,255,255,0.30);
    letter-spacing: 0.12em;
    text-transform: uppercase;
}}
.cover-edition {{
    font-family: 'Lato', sans-serif;
    font-size: 7.5pt;
    font-weight: 400;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.05em;
}}

/* ── Colophon ── */
.colophon {{
    page: colophon;
    page-break-after: always;
    padding-top: 10mm;
}}
.colophon p {{
    font-family: 'LibSerif', serif;
    font-size: 8.5pt;
    color: #555;
    line-height: 1.7;
    margin-bottom: 3mm;
}}
.colophon .colophon-title {{
    font-family: 'Lato', sans-serif;
    font-size: 9pt;
    font-weight: 700;
    color: #333;
    margin-bottom: 5mm;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}}

/* ── TOC ── */
.toc {{
    page: toc;
    page-break-after: always;
}}
.toc-title {{
    font-family: 'Lato', sans-serif;
    font-size: 22pt;
    font-weight: 900;
    color: #111;
    letter-spacing: -0.02em;
    margin-bottom: 10mm;
    padding-bottom: 4mm;
    border-bottom: 2pt solid #111;
}}
.toc-item {{
    display: flex;
    align-items: baseline;
    margin-bottom: 2.8mm;
    padding: 0;
}}
.toc-chapter-num {{
    font-family: 'Lato', sans-serif;
    font-size: 7pt;
    font-weight: 700;
    color: #999;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    min-width: 14mm;
    flex-shrink: 0;
}}
.toc-chapter-title {{
    font-family: 'LibSerif', serif;
    font-size: 10pt;
    color: #222;
    flex: 1;
    padding-right: 4mm;
}}
.toc-chapter-title em {{
    font-style: normal;
    font-size: 8.5pt;
    color: #888;
    display: block;
    margin-top: 0.5mm;
    font-family: 'Lato', sans-serif;
    font-weight: 400;
}}
.toc-dots {{
    flex: 1;
    border-bottom: 0.5pt dotted #ccc;
    margin: 0 3mm 1.5mm 3mm;
    min-width: 5mm;
}}
.toc-page {{
    font-family: 'Lato', sans-serif;
    font-size: 8.5pt;
    color: #999;
    min-width: 8mm;
    text-align: right;
}}
.toc-section-header {{
    font-family: 'Lato', sans-serif;
    font-size: 7pt;
    font-weight: 700;
    color: #00a8b4;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin: 6mm 0 3mm 0;
}}

/* ── Chapter pages ── */
.chapter {{
    page-break-before: always;
    string-set: chapter-title content(first-line, h1);
}}

.chapter-header {{
    margin-bottom: 14mm;
    padding-bottom: 6mm;
    border-bottom: 0.4pt solid #e0e0e0;
    position: relative;
}}
.chapter-number {{
    font-family: 'Lato', sans-serif;
    font-size: 7pt;
    font-weight: 700;
    color: #00a8b4;
    letter-spacing: 0.20em;
    text-transform: uppercase;
    margin-bottom: 3mm;
    display: block;
}}
.chapter-number-bg {{
    position: absolute;
    top: -8mm;
    right: 0;
    font-family: 'Lato', sans-serif;
    font-size: 88pt;
    font-weight: 900;
    color: rgba(0,0,0,0.04);
    line-height: 1;
    letter-spacing: -0.04em;
}}

/* ── Body typography ── */
body {{
    font-family: 'LibSerif', serif;
    font-size: 10.5pt;
    line-height: 1.68;
    color: #1a1a1a;
    -webkit-hyphens: auto;
    hyphens: auto;
    orphans: 3;
    widows: 3;
}}

h1 {{
    font-family: 'Lato', sans-serif;
    font-size: 24pt;
    font-weight: 900;
    color: #111;
    letter-spacing: -0.02em;
    line-height: 1.10;
    margin-bottom: 0;
    string-set: chapter-title content();
}}

h2 {{
    font-family: 'Lato', sans-serif;
    font-size: 13pt;
    font-weight: 700;
    color: #111;
    letter-spacing: -0.01em;
    margin-top: 9mm;
    margin-bottom: 3mm;
    padding-bottom: 1.5mm;
    border-bottom: 0.4pt solid #e8e8e8;
    page-break-after: avoid;
}}

h3 {{
    font-family: 'Lato', sans-serif;
    font-size: 10.5pt;
    font-weight: 700;
    color: #222;
    letter-spacing: 0;
    margin-top: 6mm;
    margin-bottom: 2mm;
    page-break-after: avoid;
}}

h4 {{
    font-family: 'Lato', sans-serif;
    font-size: 9.5pt;
    font-weight: 700;
    color: #00808a;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-top: 5mm;
    margin-bottom: 2mm;
    page-break-after: avoid;
}}

p {{
    margin-bottom: 2.8mm;
    text-align: justify;
}}

/* First paragraph after a heading — no indent, flush left */
h1 + p, h2 + p, h3 + p, h4 + p, hr + p {{
    text-indent: 0;
}}

/* ── Nota dell'autore ── */
em.author-note-label {{
    display: block;
    font-family: 'Lato', sans-serif;
    font-size: 7.5pt;
    font-weight: 700;
    color: #00808a;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 4mm;
    font-style: normal;
}}

/* First italic block treated as author note */
.chapter-body > p:first-child em {{
    font-style: italic;
    color: #666;
}}

/* ── Lists ── */
ul, ol {{
    margin: 2.5mm 0 3.5mm 0;
    padding-left: 6mm;
}}
li {{
    margin-bottom: 1.5mm;
    line-height: 1.55;
}}
li p {{
    margin-bottom: 1mm;
}}

/* ── Horizontal rule ── */
hr {{
    border: none;
    border-top: 0.4pt solid #ddd;
    margin: 7mm 0;
}}

/* ── Blockquote (Note/Tip boxes) ── */
blockquote {{
    background: #f7f9fa;
    border-left: 3pt solid #00a8b4;
    margin: 5mm 0;
    padding: 3.5mm 5mm 3.5mm 5mm;
    border-radius: 0 3pt 3pt 0;
    page-break-inside: avoid;
}}
blockquote p {{
    font-family: 'LibSerif', serif;
    font-size: 9.5pt;
    color: #333;
    margin-bottom: 1mm;
    text-align: left;
}}
blockquote p:last-child {{
    margin-bottom: 0;
}}
blockquote strong {{
    color: #00808a;
    font-family: 'Lato', sans-serif;
    font-size: 8pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}}

/* ── Code & pre ── */
code {{
    font-family: 'NotoMono', monospace;
    font-size: 8.5pt;
    color: #005f6e;
    background: #f0f7f8;
    padding: 0.5mm 1.5mm;
    border-radius: 2pt;
}}
pre {{
    background: #f5f5f5;
    border: 0.4pt solid #e0e0e0;
    border-left: 2.5pt solid #00a8b4;
    padding: 4mm 5mm;
    margin: 4mm 0;
    overflow-x: auto;
    page-break-inside: avoid;
    border-radius: 0 3pt 3pt 0;
}}
pre code {{
    font-family: 'NotoMono', monospace;
    font-size: 8pt;
    color: #1a3a3f;
    background: none;
    padding: 0;
    border-radius: 0;
    line-height: 1.5;
}}

/* ── Tables ── */
table {{
    width: 100%;
    border-collapse: collapse;
    margin: 4mm 0;
    font-family: 'Lato', sans-serif;
    font-size: 9pt;
    page-break-inside: avoid;
}}
thead {{
    background: #111;
    color: #fff;
}}
thead th {{
    font-weight: 700;
    padding: 2.5mm 3.5mm;
    text-align: left;
    letter-spacing: 0.03em;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}}
tbody tr:nth-child(even) {{
    background: #f7f9fa;
}}
tbody tr:nth-child(odd) {{
    background: #fff;
}}
tbody td {{
    padding: 2mm 3.5mm;
    border-bottom: 0.4pt solid #e8e8e8;
    color: #222;
    line-height: 1.5;
    vertical-align: top;
}}
tbody td:first-child {{
    font-weight: 600;
    color: #111;
}}

/* ── Strong & em ── */
strong {{
    font-weight: 700;
    color: #111;
}}

/* ── Separator between chapter sections ── */
.section-sep {{
    border: none;
    border-top: 0.4pt solid #e0e0e0;
    margin: 8mm 0;
}}
"""

# ─── Markdown → HTML conversion ───────────────────────────────────────────────

MD_EXTENSIONS = [
    "tables",
    "fenced_code",
    "codehilite",
    "nl2br",
    "sane_lists",
    "smarty",
    "attr_list",
]

def parse_chapter_title(md_text):
    """Extract the chapter title from the first H1 in the markdown."""
    m = re.search(r'^# (.+)$', md_text, re.MULTILINE)
    if m:
        return m.group(1).strip()
    return ""

def get_chapter_number(filename):
    """Extract numeric chapter number from filename like cap1, cap12."""
    m = re.search(r'cap(\d+)', filename)
    return int(m.group(1)) if m else 0

def md_to_html(md_text):
    """Convert markdown to HTML body fragment."""
    # Patch: treat *Nota dell'autore* as a styled label
    md_text = re.sub(
        r'^\*Nota dell\'autore\*\s*$',
        '<em class="author-note-label">Nota dell\'autore</em>',
        md_text,
        flags=re.MULTILINE
    )
    md_ext = MD_EXTENSIONS.copy()
    md_ext_config = {
        "codehilite": {"noclasses": True, "linenums": False},
        "smarty": {"smart_dashes": True, "smart_quotes": True, "smart_ellipses": True},
    }
    md = markdown.Markdown(extensions=md_ext, extension_configs=md_ext_config)
    html = md.convert(md_text)
    return html

# ─── TOC builder ─────────────────────────────────────────────────────────────

TOC_SUMMARIES = {
    "it": {
        "cap1":  "Filosofia del progetto, target, architettura, cinque colonne",
        "cap2":  "Requisiti, installazione su Windows/macOS/Linux, welcome screen",
        "cap3":  "Header, barra di controllo, griglia a 5 colonne, card audio",
        "cap4":  "Drag & drop, riproduzione, organizzazione scaletta, cue INTRO/OUTRO",
        "cap5":  "Waveform editor, trim, marker, fade, next action, keybind",
        "cap6":  "Gerarchia audio, ducking, music dominance, stacchi, master chain",
        "cap7":  "Smart mic auto-ducking, mic-in-mix, ARM, configurazione",
        "cap8":  "Routing audio, comandi tastiera, controller MIDI, MIDI learn",
        "cap9":  "Session recording, formati export, qualità, workflow",
        "cap10": "File .lmp, salvataggio, auto-backup, export package, integrità",
        "cap11": "NoteBoard, colori colonne, transizioni, impostazioni, toast",
        "cap12": "Problemi audio, clip rosse, MIDI, avvio, FAQ",
    },
    "en": {
        "cap1":  "Philosophy, target users, architecture, five columns",
        "cap2":  "Requirements, installation, welcome screen",
        "cap3":  "Header, toolbar, 5-column grid, clip cards",
        "cap4":  "Drag & drop, playback, playlist management, INTRO/OUTRO cues",
        "cap5":  "Waveform editor, trim, markers, fades, next action, keybind",
        "cap6":  "Audio hierarchy, ducking, music dominance, stabs, master chain",
        "cap7":  "Smart mic, mic-in-mix, ARM, configuration",
        "cap8":  "Audio routing, keyboard, MIDI controller, MIDI learn",
        "cap9":  "Session recording, export formats, quality, workflow",
        "cap10": ".lmp file, save, auto-backup, export package",
        "cap11": "NoteBoard, column colors, transitions, settings, toasts",
        "cap12": "Audio issues, red clips, MIDI, startup, FAQ",
    },
}

def build_toc_html(lang, cfg, chapters_info):
    """Build a styled Table of Contents HTML block."""
    toc_summary = TOC_SUMMARIES.get(lang, {})
    items_html = ""
    for i, (fname, title) in enumerate(chapters_info, 1):
        num_str = f"{i:02d}"
        summary = toc_summary.get(fname, "")
        summary_html = f"<em>{summary}</em>" if summary else ""
        items_html += f"""
        <div class="toc-item">
            <span class="toc-chapter-num">{num_str}</span>
            <span class="toc-chapter-title">
                {title}
                {summary_html}
            </span>
        </div>"""

    return f"""
<div class="toc">
    <div class="toc-title">{cfg['toc_title']}</div>
    {items_html}
</div>"""

# ─── Cover page ───────────────────────────────────────────────────────────────

def build_cover_html(lang, cfg, banner_path):
    banner_uri = f"file://{banner_path}"
    return f"""
<div class="cover">
    <div class="cover-gradient"></div>
    <div class="cover-brand-bar"></div>

    <div class="cover-banner-wrap">
        <img src="{banner_uri}" alt="Runtime Live Machine Pro" />
    </div>

    <div class="cover-text-block">
        <div class="cover-label">{cfg['title']}</div>
        <div class="cover-title">{META['software']}</div>
        <div class="cover-subtitle">On Air. In Control.</div>
    </div>

    <div class="cover-meta-block">
        <div class="cover-meta-row"><strong>Versione</strong> &nbsp; {META['version']}</div>
        <div class="cover-meta-row"><strong>Edizione</strong> &nbsp; {cfg['edition']}</div>
        <div class="cover-meta-row"><strong>Lingua</strong> &nbsp; {lang.upper()}</div>
    </div>

    <div class="cover-footer">
        <div class="cover-production">{META['production']}</div>
        <div class="cover-edition">{META['author']} &nbsp;·&nbsp; {META['copyright_year']}</div>
    </div>
</div>"""

# ─── Colophon ────────────────────────────────────────────────────────────────

def build_colophon_html(lang, cfg):
    return f"""
<div class="colophon">
    <p class="colophon-title">Note legali</p>
    <p><strong>{META['software']}</strong><br/>
    {cfg['title']} — {cfg['edition']}<br/>
    Versione software {META['version']}</p>
    <p>Software ideato e sviluppato da <strong>{META['author']}</strong>.<br/>
    Produzione: <strong>{META['production']}</strong>.</p>
    <p>© {META['copyright_year']} {META['production']} / {META['author']}.<br/>
    Tutti i diritti riservati. Nessuna parte di questo documento può essere riprodotta,
    distribuita o trasmessa in qualsiasi forma o con qualsiasi mezzo senza il previo
    consenso scritto dell'autore.</p>
    <p>Runtime Live Machine Pro è un software originale. Tutti i marchi citati
    appartengono ai rispettivi proprietari.</p>
</div>"""

# ─── Chapter renderer ────────────────────────────────────────────────────────

def render_chapter(fname, title, body_html, chapter_index, lang, cfg):
    num = get_chapter_number(fname)
    num_str = f"{num:02d}" if num > 0 else ""
    return f"""
<div class="chapter" id="chapter-{num}">
    <div class="chapter-header">
        <div class="chapter-number-bg">{num_str}</div>
        <span class="chapter-number">Capitolo {num}</span>
        {body_html.split('</h1>')[0].replace('<h1>', '<h1>')}
        </h1>
    </div>
    <div class="chapter-body">
        {'</h1>'.join(body_html.split('</h1>')[1:])}
    </div>
</div>"""

# ─── Full HTML document ───────────────────────────────────────────────────────

def build_full_html(lang, cfg, cover_html, colophon_html, toc_html, chapters_html):
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8"/>
<title>{META['software']} — {cfg['title']}</title>
</head>
<body>
{cover_html}
{colophon_html}
{toc_html}
{''.join(chapters_html)}
</body>
</html>"""

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Build RLMP PDF manual")
    parser.add_argument("--lang", default="it", choices=list(LANG_CONFIG.keys()),
                        help="Language code (default: it)")
    parser.add_argument("--output", default=None,
                        help="Output PDF path (default: auto-named in parent dir)")
    args = parser.parse_args()

    lang = args.lang
    cfg  = LANG_CONFIG[lang]

    # Resolve paths
    lang_dir     = SCRIPT_DIR / lang
    banner_path  = ASSETS_DIR / "banner.png"
    icon_path    = ASSETS_DIR / "icon.png"

    if not lang_dir.exists():
        print(f"ERROR: Language directory not found: {lang_dir}", file=sys.stderr)
        sys.exit(1)

    if args.output:
        output_path = Path(args.output)
    else:
        safe_lang = lang.replace("-", "_").upper()
        output_path = SCRIPT_DIR.parent / f"Runtime_Live_Machine_Pro_Manual_{safe_lang}_v{META['version']}.pdf"

    print(f"  Language : {lang}")
    print(f"  Output   : {output_path}")
    print(f"  Chapters : {len(cfg['chapters'])}")

    # Read and parse chapters
    chapters_info = []
    chapters_html_list = []

    for fname in cfg['chapters']:
        md_path = lang_dir / f"{fname}.md"
        if not md_path.exists():
            print(f"  SKIP: {md_path.name} not found")
            continue

        md_text = md_path.read_text(encoding="utf-8")
        title   = parse_chapter_title(md_text)
        chapters_info.append((fname, title))
        print(f"  Reading: {fname}.md → {title[:50]}")

        body_html = md_to_html(md_text)
        chapter_index = len(chapters_html_list) + 1

        # Clean up the chapter HTML: remove the H1 from body (we render it in the header)
        # but keep it for string-set purposes via a hidden element
        num = get_chapter_number(fname)
        num_str = f"{num:02d}" if num > 0 else ""

        # Extract h1 and rest
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', body_html, re.DOTALL)
        h1_content = h1_match.group(1) if h1_match else title
        body_rest = re.sub(r'<h1[^>]*>.*?</h1>', '', body_html, count=1, flags=re.DOTALL)

        ch_html = f"""
<div class="chapter" id="chapter-{num}">
    <div class="chapter-header">
        <div class="chapter-number-bg">{num_str}</div>
        <span class="chapter-number">Capitolo {num}</span>
        <h1>{h1_content}</h1>
    </div>
    <div class="chapter-body">
        {body_rest}
    </div>
</div>"""
        chapters_html_list.append(ch_html)

    if not chapters_info:
        print("ERROR: No chapters found.", file=sys.stderr)
        sys.exit(1)

    # Build HTML sections
    print("  Building cover page…")
    cover_html     = build_cover_html(lang, cfg, str(banner_path))
    colophon_html  = build_colophon_html(lang, cfg)
    toc_html       = build_toc_html(lang, cfg, chapters_info)

    full_html = build_full_html(lang, cfg, cover_html, colophon_html, toc_html, chapters_html_list)

    # Build CSS
    css_string = build_css(cfg)

    # Generate PDF
    print("  Rendering PDF (WeasyPrint)…")
    font_config = FontConfiguration()
    html_obj = HTML(string=full_html, base_url=str(SCRIPT_DIR))
    css_obj  = CSS(string=css_string, font_config=font_config)

    html_obj.write_pdf(
        str(output_path),
        stylesheets=[css_obj],
        font_config=font_config,
        presentational_hints=True,
    )

    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"\n  PDF generated: {output_path}")
    print(f"  Size: {size_mb:.1f} MB")
    print("  Done.")

if __name__ == "__main__":
    main()
