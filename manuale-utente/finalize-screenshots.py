#!/usr/bin/env python3
"""Finalizza gli screenshot grezzi catturati da capture-app.js / capture-extra.js /
capture-remote.js.

I capture producono file con nomi 0x-*/1x-* (1600x855 nativi; quelli del
Controllo Remoto a densità 2). Questo script li rinomina con i nomi definitivi
dei manuali, ricava barra-controllo (crop 1600x300 di menu-strumenti), mette il
telefono in cornice e specchia il set in typst/.

Uso:  python manuale-utente/finalize-screenshots.py <lang>
       (it: manuale-utente/screenshots/ ; altre lingue: screenshots-<lang>/)
"""
import sys
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent

# raw -> nome definitivo
RENAME = {
    "01-benvenuto.png": "schermata-benvenuto.png",
    "02-interfaccia.png": "interfaccia-principale.png",
    "03-pad-fx.png": "pad-fx.png",
    "04-automix.png": "vista-automix.png",
    "05-editor-generale.png": "impostazioni-clip.png",
    "05b-forma-onda.png": "waveform-editor.png",
    "06-impostazioni-masterchain.png": "impostazioni-master-chain.png",
    "07-menu-strumenti.png": "menu-strumenti.png",
    # v1.15.37 — Capitolo 11 (capture-remote.js, catture a densità 2)
    "08-remoto-impostazioni.png": "remoto-impostazioni.png",
    "09-remoto-fx.png": "remoto-fx.png",
    "10-remoto-musica.png": "remoto-musica.png",
}
FINAL_NAMES = list(RENAME.values()) + ["barra-controllo.png"]


def lang_dirs(lang: str):
    """L'italiano vive in screenshots/ e typst/screenshots/, le altre lingue in
    screenshots-<lang>/ (v1.15.37: prima lo script cercava screenshots-it)."""
    name = "screenshots" if lang == "it" else f"screenshots-{lang}"
    return HERE / name, HERE / "typst" / name


def frame_phone(path: Path) -> None:
    """Schermata del telefono (780x1688) dentro una cornice scura arrotondata,
    centrata su un fondo bianco più largo che alto: nel PDF le figure vanno a
    tutta larghezza, e un'immagine verticale uscirebbe più alta della pagina."""
    with Image.open(path) as shot:
        shot = shot.convert("RGB")
        sw, sh = shot.size
        bezel, radius = 26, 70
        fw, fh = sw + 2 * bezel, sh + 2 * bezel
        canvas = Image.new("RGB", (int(fh * 1.25), fh + 80), "white")
        ox, oy = (canvas.width - fw) // 2, 40
        draw = ImageDraw.Draw(canvas)
        draw.rounded_rectangle((ox, oy, ox + fw, oy + fh), radius=radius, fill="#111318")
        mask = Image.new("L", (sw, sh), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw, sh), radius=radius - bezel, fill=255)
        canvas.paste(shot, (ox + bezel, oy + bezel), mask)
        canvas.save(path)


def pad_panel(path: Path) -> None:
    """Ritaglio delle Impostazioni (densità 2) su fondo bianco, così nel PDF
    occupa circa tre quarti della larghezza invece di essere ingrandito."""
    with Image.open(path) as crop:
        crop = crop.convert("RGB")
        cw, ch = crop.size
        canvas = Image.new("RGB", (int(cw * 1.3), ch + 40), "white")
        canvas.paste(crop, ((canvas.width - cw) // 2, 20))
        canvas.save(path)


def finalize(lang: str) -> None:
    raw_dir, typst_dir = lang_dirs(lang)
    if not raw_dir.is_dir():
        sys.exit(f"ERRORE: manca {raw_dir}")

    # 1) rinomina i raw nei nomi definitivi
    for raw, final in RENAME.items():
        src = raw_dir / raw
        if not src.exists():
            sys.exit(f"ERRORE: manca il raw {src}")
        dst = raw_dir / final
        if src != dst:
            if dst.exists():
                dst.unlink()
            src.rename(dst)

    # 2) barra-controllo = fascia superiore 1600x300 del menu-strumenti
    menu = raw_dir / "menu-strumenti.png"
    with Image.open(menu) as im:
        w, _ = im.size
        im.crop((0, 0, w, 300)).save(raw_dir / "barra-controllo.png")

    # 2b) Capitolo 11: cornice del telefono e margini della sezione Impostazioni
    frame_phone(raw_dir / "remoto-fx.png")
    frame_phone(raw_dir / "remoto-musica.png")
    pad_panel(raw_dir / "remoto-impostazioni.png")

    # 3) rimuovi eventuali raw residui (nessuno atteso, ma pulizia)
    for p in raw_dir.glob("0*.png"):
        p.unlink()
    for p in raw_dir.glob("1*.png"):
        p.unlink()

    # 4) specchia in typst/<cartella della lingua>/
    typst_dir.mkdir(parents=True, exist_ok=True)
    for name in FINAL_NAMES:
        shutil.copy2(raw_dir / name, typst_dir / name)

    print(f"[{lang}] finalizzati {len(FINAL_NAMES)} screenshot -> {raw_dir.name}/ + typst/{typst_dir.name}/")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Uso: finalize-screenshots.py <lang>")
    finalize(sys.argv[1])
