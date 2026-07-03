# Manuale Utente — Runtime Live Machine Pro (Typst)

Sorgente del manuale utente in **PDF tipografico**, generato con
[Typst](https://typst.app) secondo lo stesso protocollo modulare del manuale di
**FAVELLA 1** e **The Thin Stack**. Edizione corrente: **Seconda Edizione · 2026**,
allineata al software **v1.11.5**.

Il **contenuto** resta in Markdown (`manuale-utente/<lingua>/cap1..14.md`): un
convertitore lo trasforma in capitoli Typst, così la stessa fonte serve anche le
traduzioni.

## Come compilare

Servono **Typst ≥ 0.13** (`winget install --id Typst.Typst`) e **pandoc**
(`winget install --id JohnMacFarlane.Pandoc`) e **Python** con `markdown`
(`pip install markdown`), poi:

```powershell
pwsh ./build.ps1            # genera i capitoli da Markdown e compila -> manuale.pdf
pwsh ./build.ps1 -Watch     # ricompila live (senza rigenerare)
pwsh ./build.ps1 -Png       # esporta anche le anteprime pag-{p}.png
pwsh ./build.ps1 -Lang en   # usa i capitoli Markdown di un'altra lingua
```

Oppure a mano, in due passi:

```powershell
python build-typst.py it                                   # md -> capitoli/*.typ
typst compile --font-path fonts manuale.typ manuale.pdf    # ebook digitale
```

La sorgente è unica e prevede due tirature (come nel protocollo FAVELLA):

- **Edizione digitale** (default) — copertina a pagina intera, formato A4.
- **Interno stampa/KDP** (`--input kdp=1`) — parte dal frontespizio, senza
  copertina (la copertina di stampa è un file a sé). **La messa a punto della
  versione cartacea — trim, abbondanza, dorso — è rimandata a una sessione
  dedicata.**

## Struttura

| Percorso | Ruolo |
|---|---|
| `manuale.typ` | Documento principale: fronte del manuale + `#include` dei 14 capitoli (toggle copertina via `--input kdp=1`). |
| `build-typst.py` | Convertitore Markdown → Typst (pandoc + post-processing: box da blockquote, figure, titoli). Ripetibile per ogni lingua. |
| `build.ps1` | Genera i capitoli e compila il PDF. |
| `capitoli/cap01..14.typ` | I 14 capitoli generati (non modificare a mano: si rigenerano da Markdown). |
| `lib/manuale-template.typ` | Identità tipografica: palette di marca, font, copertina, frontespizio, colophon, impaginazione, titoli, box (`nota`, `suggerimento`, `attenzione`). |
| `assets/` | Logo dell'app e immagine di copertina. |
| `screenshots/` | Le 8 schermate del software (copiate da `../screenshots/`). |
| `fonts/` | Font di marca statici: **Sora** (titoli) e **Source Code Pro** (codice), licenza OFL. Il corpo usa **Inter** (di sistema, ripiego su Segoe UI). |
| `manuale.pdf` | Edizione digitale compilata. |

## Stato

**Completo — solo Italiano** (Seconda Edizione · 2026): 14 capitoli, copertina,
frontespizio, colophon, indice con numeri di pagina, allineato alla **v1.11.5**.
Le altre 7 lingue e la versione cartacea sono lavori successivi.
