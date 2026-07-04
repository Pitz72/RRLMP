# build.ps1 — Compila il Manuale Utente di Runtime Live Machine Pro in PDF.
#
#   pwsh ./build.ps1            genera i capitoli da Markdown e compila -> manuale.pdf (it)
#   pwsh ./build.ps1 -Watch     ricompila a ogni salvataggio (senza rigenerare)
#   pwsh ./build.ps1 -Png       esporta anche le pagine in pag-{p}.png (anteprima)
#   pwsh ./build.ps1 -Lang en   usa i capitoli Markdown di un'altra lingua
#   pwsh ./build.ps1 -All       compila le 8 lingue con il nome file localizzato
#
# Richiede Typst (>= 0.13, winget install --id Typst.Typst) e pandoc.
param([switch]$Watch, [switch]$Png, [string]$Lang = "it", [switch]$All)

$root  = $PSScriptRoot
$fonts = Join-Path $root 'fonts'
$src   = Join-Path $root 'manuale.typ'

# Nome file localizzato per lingua (niente più "Manuale-Utente-<LANG>" con la
# parola italiana fissa su ogni lingua): rispecchia manual-title in strings.typ,
# traslitterato in caratteri latini dove serve per la sicurezza del filesystem.
$FileNames = @{
  it    = "Manuale-Utente-IT.pdf"
  en    = "User-Manual-EN.pdf"
  fr    = "Manuel-Utilisateur-FR.pdf"
  de    = "Benutzerhandbuch-DE.pdf"
  es    = "Manual-de-Usuario-ES.pdf"
  pt    = "Manual-do-Utilizador-PT.pdf"
  ru    = "Rukovodstvo-Polzovatelya-RU.pdf"
  "zh-cn" = "Yonghu-Shouce-ZH-CN.pdf"
}

function Build-One([string]$L) {
  Write-Host "Genero i capitoli Typst da Markdown ($L)..." -ForegroundColor Cyan
  python (Join-Path $root 'build-typst.py') $L
  if ($LASTEXITCODE -ne 0) { Write-Error "Conversione Markdown->Typst fallita ($L)"; exit 1 }

  $outName = $FileNames[$L]
  if (-not $outName) { $outName = "Manuale-Utente-$($L.ToUpper()).pdf" }
  $pdf = Join-Path $root $outName

  typst compile --font-path $fonts --input "lang=$L" $src $pdf
  if ($LASTEXITCODE -eq 0) { Write-Host "OK -> $pdf" -ForegroundColor Green }
  else { Write-Error "Compilazione Typst fallita ($L)"; exit 1 }
  return $pdf
}

if ($All) {
  foreach ($L in $FileNames.Keys) { Build-One $L | Out-Null }
  exit 0
}

if ($Watch) {
  python (Join-Path $root 'build-typst.py') $Lang
  typst watch --font-path $fonts --input "lang=$Lang" $src (Join-Path $root 'manuale.pdf')
} else {
  $pdf = Build-One $Lang
  if ($Png) {
    typst compile --font-path $fonts --input "lang=$Lang" --format png --ppi 150 $src (Join-Path $root 'pag-{p}.png')
  }
}
