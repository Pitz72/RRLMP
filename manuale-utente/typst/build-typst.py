#!/usr/bin/env python3
# Converte i capitoli Markdown del manuale in capitoli Typst per il protocollo
# modulare (lib/manuale-template.typ). Ripetibile per ogni lingua.
#   python build-typst.py [lang]     (default: it)
import re, subprocess, sys, pathlib

LANG = sys.argv[1] if len(sys.argv) > 1 else "it"
HERE = pathlib.Path(__file__).parent.resolve()          # manuale-utente/typst
SRC  = HERE.parent / LANG                                # manuale-utente/<lang>
OUT  = HERE / "capitoli"
N_CAP = 14

IMPORT = '#import "../lib/manuale-template.typ": *\n\n'

def pre_md(md):
    # ![desc](path) seguito da una riga in corsivo *…* (didascalia figura, in
    # qualunque lingua: Figura/Figure/Abbildung/Рисунок/图) -> usa la riga
    # come caption della figura.
    md = re.sub(r"!\[[^\]]*\]\(([^)]+)\)\s*\n\s*\n\s*\*([^*\n]+)\*",
                lambda m: f"![{m.group(2).strip()}]({m.group(1)})", md)
    return md

def match_bracket(s, i):
    # s[i] == '[' ; ritorna l'indice della ']' corrispondente
    d = 0
    while i < len(s):
        if s[i] == '[': d += 1
        elif s[i] == ']':
            d -= 1
            if d == 0: return i
        i += 1
    return -1

# Etichette dei blockquote nelle 8 lingue -> tipo di box. Le traduzioni sono
# quelle imposte ai traduttori (una per riquadro), così la mappatura è certa.
_TIP = {
    "suggerimento operativo", "prassi consigliata",           # it
    "operational tip", "recommended practice",                # en
    "conseil pratique", "bonne pratique",                     # fr
    "praxis-tipp", "empfohlene vorgehensweise",               # de
    "consejo práctico", "práctica recomendada",               # es
    "sugestão prática", "boa prática",                        # pt
    "практический совет", "рекомендуемая практика",           # ru
    "操作建议", "推荐做法",                                     # zh
}
_WARN = {
    "attenzione", "warning", "attention", "achtung",
    "atención", "atenção", "внимание", "警告",
}

def box_for(label):
    l = label.strip().lower()
    if l in _TIP: return "suggerimento"
    if l in _WARN: return "attenzione"
    return "nota"   # Nota / Note / Hinweis / Nota tecnica / Примечание / 注意 …

def quotes_to_boxes(t):
    out, i = [], 0
    marker = "#quote(block: true)["
    while True:
        j = t.find(marker, i)
        if j == -1:
            out.append(t[i:]); break
        out.append(t[i:j])
        open_br = j + len(marker) - 1
        close = match_bracket(t, open_br)
        inner = t[open_br+1:close].strip()
        # estrai etichetta iniziale #strong[Etichetta.] se presente
        m = re.match(r"#strong\[([^\]]+?)\]\s*", inner)
        label = "Nota"
        if m:
            label = m.group(1).rstrip(". ")
            inner = inner[m.end():].lstrip()
        out.append(f"#{box_for(label)}[\n{inner}\n]")
        i = close + 1
    return "".join(out)

def post_typ(t):
    lines = []
    for ln in t.splitlines():
        s = ln.strip()
        if s == "#horizontalrule": continue          # separatori decorativi
        if re.fullmatch(r"<[A-Za-z0-9_\-]+>", s): continue  # anchor dei titoli
        lines.append(ln)
    t = "\n".join(lines)
    # titolo capitolo: "= <Parola-capitolo> N --- Titolo" -> "= Titolo"
    # (il template ri-aggiunge l'etichetta di capitolo localizzata). Generico su
    # tutte le lingue: taglia il prefisso fino al primo trattino lungo/em-dash.
    # Es. "= Chapter 3 --- X", "= Kapitel 3 --- X", "= 第 3 章 --- X".
    t = re.sub(r"^=\s*\S[^\n]*?\s*(?:---|—|–)\s*(.+)$", r"= \1", t, flags=re.M)
    t = quotes_to_boxes(t)
    # comprime 3+ righe vuote
    t = re.sub(r"\n{3,}", "\n\n", t)
    return IMPORT + t.strip() + "\n"

def convert(cap):
    md = (SRC / f"cap{cap}.md").read_text(encoding="utf-8")
    md = pre_md(md)
    r = subprocess.run(["pandoc", "-f", "markdown", "-t", "typst"],
                       input=md, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        print(f"  pandoc ERRORE cap{cap}:", r.stderr[:300]); sys.exit(1)
    typ = post_typ(r.stdout)
    (OUT / f"cap{cap:02d}.typ").write_text(typ, encoding="utf-8")

OUT.mkdir(exist_ok=True)
for cap in range(1, N_CAP + 1):
    convert(cap)
    print(f"  cap{cap:02d}.typ")
print(f"OK — {N_CAP} capitoli Typst generati in {OUT}")
