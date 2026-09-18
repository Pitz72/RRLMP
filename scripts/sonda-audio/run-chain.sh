#!/bin/sh
# Misura la catena master attuale su due estratti musicali (EBU R128 + true peak).
# Uso: scripts/sonda-audio/run-chain.sh <brano-forte.mp3> <brano-dinamico.mp3> [etichetta]
# Lavora in una cartella temporanea; stampa LUFS integrati, LRA e picco vero per
# sorgente, catena spenta, Glue spento, Glue acceso.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../.." && pwd)"
FF="$ROOT/node_modules/ffmpeg-static/ffmpeg"; [ -x "$FF.exe" ] && FF="$FF.exe"
TAG="${3:-misura}"; WORK="$(mktemp -d)"
"$FF" -v error -y -ss 30 -t 60 -i "$1" -ar 48000 -ac 2 "$WORK/loud.wav"
"$FF" -v error -y -ss 20 -t 60 -i "$2" -ar 48000 -ac 2 "$WORK/dyn.wav"
echo '<html><body><script src="acm.bundle.js"></script></body></html>' > "$WORK/blank.html"
"$ROOT/node_modules/.bin/esbuild" "$ROOT/src/renderer/src/engine/AudioContextManager.ts" --bundle --format=iife --global-name=ACM --outfile="$WORK/acm.bundle.js" --log-level=warning
"$ROOT/node_modules/.bin/electron" "$HERE/chain-main.js" "$WORK" "$TAG" 2>&1 | grep -E "FATAL" || true
meter() { "$FF" -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 | grep -E " I:| LRA:|Peak:" | tail -3 | tr -s ' ' | tr '\n' ' '; }
for src in loud dyn; do
  printf '%-5s %-8s' "$src" source; meter "$WORK/$src.wav"; echo
  for st in off glueoff glueon; do printf '%-5s %-8s' "$src" "$st"; meter "$WORK/out-$TAG-$src-$st.wav"; echo; done
done
echo "File in $WORK"
