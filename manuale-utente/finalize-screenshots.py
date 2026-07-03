#!/usr/bin/env python3
"""Finalizza gli screenshot grezzi catturati da capture-app.js / capture-extra.js.

I capture producono file con nomi 0x-* (1600x855 nativi). Questo script li
rinomina con i nomi definitivi dei manuali, ricava barra-controllo (crop
1600x300 di menu-strumenti) e specchia il set in typst/screenshots-<lang>/.

Uso:  python manuale-utente/finalize-screenshots.py <lang>
       (legge/scrive manuale-utente/screenshots-<lang>/)
"""
import sys
import shutil
from pathlib import Path
from PIL import Image

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
}
FINAL_NAMES = list(RENAME.values()) + ["barra-controllo.png"]


def finalize(lang: str) -> None:
    raw_dir = HERE / f"screenshots-{lang}"
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

    # 3) rimuovi eventuali raw residui (nessuno atteso, ma pulizia)
    for p in raw_dir.glob("0*.png"):
        p.unlink()

    # 4) specchia in typst/screenshots-<lang>/
    typst_dir = HERE / "typst" / f"screenshots-{lang}"
    typst_dir.mkdir(parents=True, exist_ok=True)
    for name in FINAL_NAMES:
        shutil.copy2(raw_dir / name, typst_dir / name)

    print(f"[{lang}] finalizzati {len(FINAL_NAMES)} screenshot -> {raw_dir.name}/ + typst/{typst_dir.name}/")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Uso: finalize-screenshots.py <lang>")
    finalize(sys.argv[1])
