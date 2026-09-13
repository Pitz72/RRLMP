#!/usr/bin/env python3
# Genera la copertina SVG del manuale (una per lingua), aderente al banner
# ufficiale. Fonte unica: le stringhe localizzate rispecchiano
# manuale-utente/typst/lib/strings.typ (manual-title / edition-name /
# version-word / language-name) — brand, tagline e credit line restano
# invariati in ogni lingua (sono nome di prodotto e slogan, non contenuto).
#
# Uso:  python build-cover.py [lang]      (default: tutte e 8 le lingue)
import base64, math, random, pathlib, sys

ROOT = pathlib.Path(r"C:\Users\Utente\Documents\GitHub\RRLMP")
LOGO = ROOT / "src" / "renderer" / "src" / "assets" / "logo.png"
OUT_DIR = ROOT / "branding" / "covers"

VERSION = "1.15.32"

# Specchio di lib/strings.typ (manual-title, edition-name, version-word, language-name).
# 2026-07-22: manuale mantenuto SOLO in it/en (decisione utente).
STRINGS = {
    "it": dict(manual_title="Manuale Utente", edition_name="Seconda Edizione", version_word="Versione", language_name="Italiano"),
    "en": dict(manual_title="User Manual", edition_name="Second Edition", version_word="Version", language_name="English"),
}

# Coda di fallback per i glifi non latini (Cirillico coperto da Segoe UI/Arial;
# il CJK richiede un font dedicato).
FONT_STACK = "Segoe UI, Microsoft YaHei, Noto Sans SC, Helvetica, Arial, sans-serif"

W, H = 595, 842
CX = W / 2

# ── Equalizzatore in basso (spettro) ────────────────────────────────────────
STOPS = [(0.0,(34,211,238)),(0.28,(34,197,94)),(0.5,(245,217,11)),
         (0.72,(245,158,11)),(1.0,(239,68,68))]
def color_at(f):
    for i in range(len(STOPS)-1):
        f0,c0 = STOPS[i]; f1,c1 = STOPS[i+1]
        if f0 <= f <= f1:
            t = (f-f0)/(f1-f0) if f1>f0 else 0
            r = round(c0[0]+(c1[0]-c0[0])*t)
            g = round(c0[1]+(c1[1]-c0[1])*t)
            b = round(c0[2]+(c1[2]-c0[2])*t)
            return f"#{r:02x}{g:02x}{b:02x}"
    return "#ef4444"

def build_eq():
    random.seed(7)
    bw, gap = 5, 4
    baseline = 838
    x = 6
    bars = []
    while x < W-6:
        f = x/(W-12)
        env = 0.45 + 0.55*math.sin(math.pi*min(max(f,0),1))
        h = int((14 + random.random()*104) * env)
        h = max(10, h)
        col = color_at(f)
        bars.append(f'<rect x="{x:.0f}" y="{baseline-h}" width="{bw}" height="{h}" rx="1.5" fill="{col}" opacity="0.85"/>')
        x += bw+gap
    return "\n    ".join(bars)

def build_svg(lang, logo_uri):
    s = STRINGS[lang]
    title_line = f"{s['edition_name']} · {s['version_word']} {VERSION} · {s['language_name']}"
    alt = f"Copertina del Manuale Utente di Runtime Live Machine Pro, {s['edition_name']}, versione {VERSION}"
    eq = build_eq()
    return f'''<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{alt}">
  <defs>
    <linearGradient id="topbar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#22d3ee"/><stop offset="0.33" stop-color="#22c55e"/>
      <stop offset="0.66" stop-color="#f59e0b"/><stop offset="1" stop-color="#ef4444"/>
    </linearGradient>
    <linearGradient id="pro" gradientUnits="userSpaceOnUse" x1="222" y1="0" x2="373" y2="0">
      <stop offset="0" stop-color="#22d3ee"/><stop offset="0.32" stop-color="#22c55e"/>
      <stop offset="0.58" stop-color="#f5d90b"/><stop offset="0.8" stop-color="#f59e0b"/>
      <stop offset="1" stop-color="#ef4444"/>
    </linearGradient>
    <radialGradient id="glowL" cx="0.16" cy="0.30" r="0.55">
      <stop offset="0" stop-color="#0aa4c4" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#0a0d12" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowR" cx="0.92" cy="0.14" r="0.5">
      <stop offset="0" stop-color="#b3401f" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#0a0d12" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="logoGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#22d3ee" stop-opacity="0.20"/>
      <stop offset="1" stop-color="#0a0d12" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="{W}" height="{H}" fill="#0a0d12"/>
  <rect x="0" y="0" width="{W}" height="{H}" fill="url(#glowL)"/>
  <rect x="0" y="0" width="{W}" height="{H}" fill="url(#glowR)"/>
  <rect x="0" y="0" width="{W}" height="4" fill="url(#topbar)"/>

  <ellipse cx="{CX}" cy="152" rx="150" ry="150" fill="url(#logoGlow)"/>
  <image href="{logo_uri}" x="{CX-90:.0f}" y="62" width="180" height="180"/>

  <text x="{CX}" y="300" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="13" fill="#22b8cf">RUNTIME</text>
  <text x="{CX+6}" y="364" text-anchor="middle" font-family="Segoe UI Black, Segoe UI, Helvetica, Arial, sans-serif" font-size="56" font-weight="800" letter-spacing="2" fill="#f4f6fb">LIVE MACHINE</text>
  <text x="{CX}" y="440" text-anchor="middle" font-family="Segoe UI Black, Segoe UI, Helvetica, Arial, sans-serif" font-size="66" font-weight="800" letter-spacing="6" fill="url(#pro)">PRO</text>

  <g>
    <rect x="{CX-58:.0f}" y="462" width="116" height="30" rx="15" fill="none" stroke="#2b3442" stroke-width="1.2"/>
    <circle cx="{CX-38:.0f}" cy="477" r="3.5" fill="#22c55e"/>
    <text x="{CX+6:.0f}" y="482" text-anchor="middle" font-family="Consolas, Menlo, monospace" font-size="14" font-weight="700" letter-spacing="2" fill="#c7cede">v {VERSION}</text>
  </g>

  <text x="{CX}" y="536" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="20" font-style="italic" font-weight="400" fill="#8a93a6">On Air. <tspan font-weight="700" fill="#22c55e">In Control.</tspan></text>

  <rect x="90" y="576" width="415" height="1" fill="url(#hair)"/>

  <text x="{CX}" y="612" text-anchor="middle" font-family="{FONT_STACK}" font-size="13" font-weight="700" letter-spacing="6" fill="#00c8d4">{s['manual_title'].upper()}</text>
  <text x="{CX}" y="640" text-anchor="middle" font-family="{FONT_STACK}" font-size="15" font-weight="500" letter-spacing="1" fill="#c7cede">{title_line}</text>

  <text x="{CX}" y="686" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="4" fill="#5b6472">ECOSYSTEM.RUNTIME &#183; SIMONE PIZZI &#183; 2026</text>

  <g>
    {eq}
  </g>
</svg>
'''

def main():
    langs = [sys.argv[1]] if len(sys.argv) > 1 else list(STRINGS.keys())
    logo_b64 = base64.b64encode(LOGO.read_bytes()).decode()
    logo_uri = f"data:image/png;base64,{logo_b64}"
    OUT_DIR.mkdir(exist_ok=True)
    for lang in langs:
        svg = build_svg(lang, logo_uri)
        out = OUT_DIR / f"copertina-{lang}.svg"
        out.write_text(svg, encoding="utf-8")
        print("OK", out, f"{out.stat().st_size//1024} KB")

if __name__ == "__main__":
    main()
