# build.ps1 — Compila il Manuale Utente di Runtime Live Machine Pro in PDF.
#
#   pwsh ./build.ps1            genera i capitoli da Markdown e compila -> manuale.pdf
#   pwsh ./build.ps1 -Watch     ricompila a ogni salvataggio (senza rigenerare)
#   pwsh ./build.ps1 -Png       esporta anche le pagine in pag-{p}.png (anteprima)
#   pwsh ./build.ps1 -Lang en   usa i capitoli Markdown di un'altra lingua
#
# Richiede Typst (>= 0.13, winget install --id Typst.Typst) e pandoc.
param([switch]$Watch, [switch]$Png, [string]$Lang = "it")

$root  = $PSScriptRoot
$fonts = Join-Path $root 'fonts'
$src   = Join-Path $root 'manuale.typ'
$pdf   = Join-Path $root 'manuale.pdf'

if (-not $Watch) {
  Write-Host "Genero i capitoli Typst da Markdown ($Lang)..." -ForegroundColor Cyan
  python (Join-Path $root 'build-typst.py') $Lang
  if ($LASTEXITCODE -ne 0) { Write-Error "Conversione Markdown->Typst fallita"; exit 1 }
}

if ($Watch) {
  typst watch --font-path $fonts $src $pdf
} else {
  typst compile --font-path $fonts $src $pdf
  if ($LASTEXITCODE -eq 0) { Write-Host "OK -> $pdf" -ForegroundColor Green }
  if ($Png -and $LASTEXITCODE -eq 0) {
    typst compile --font-path $fonts --format png --ppi 150 $src (Join-Path $root 'pag-{p}.png')
  }
}
