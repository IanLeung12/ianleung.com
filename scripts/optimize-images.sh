#!/usr/bin/env bash
#
# Optimize site images with macOS `sips` (no external deps).
#
# Resizes full-res originals down to display size and re-encodes, which cuts both
# file size and — more importantly — decoded bitmap memory (a browser holds
# ~width*height*4 bytes per displayed image). The About popover is 260px wide, so
# 600px is ~2x retina and plenty.
#
# Originals live in image-originals/ (committed). On first run we seed that folder
# from the current public/images/* (only if an original is missing, so re-runs
# never clobber). We always resize FROM originals INTO public/images, so the
# script is idempotent and never compounds compression.
#
# Usage: npm run optimize:images   (or: bash scripts/optimize-images.sh)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ORIG="$ROOT/image-originals"
OUT="$ROOT/public/images"
mkdir -p "$ORIG"

ABOUT_MAX=600   # ~2x the 260px About popover
ABOUT_Q=72      # JPEG quality; 70-75 is visually lossless at this size
PROJ_MAX=1200   # ~2x the 600px projects modal hero

# Resize a JPEG from the original into public/images, seeding the original first.
optimize_jpeg() {
  local name="$1" max="$2" quality="$3"
  [ -f "$ORIG/$name" ] || cp "$OUT/$name" "$ORIG/$name"
  sips -Z "$max" -s format jpeg -s formatOptions "$quality" "$ORIG/$name" --out "$OUT/$name" >/dev/null
}

# Resize a PNG from the original. PNG is lossless, so resampling is the only size
# lever — and sips is a poor PNG (re)compressor, so re-encoding an image that's
# already within the cap only bloats it. We therefore skip sips entirely when no
# downscale is needed and just copy the original bytes through.
optimize_png() {
  local name="$1" max="$2"
  [ -f "$ORIG/$name" ] || cp "$OUT/$name" "$ORIG/$name"
  local w h longest
  w=$(sips -g pixelWidth "$ORIG/$name" | awk '/pixelWidth/{print $2}')
  h=$(sips -g pixelHeight "$ORIG/$name" | awk '/pixelHeight/{print $2}')
  longest=$(( w > h ? w : h ))
  if [ "$longest" -le "$max" ]; then
    cp "$ORIG/$name" "$OUT/$name"   # already small enough; keep original bytes
  else
    # Downscaling cuts decoded bitmap memory; a small file-size bump from sips's
    # PNG encoder is an acceptable trade for that memory win.
    sips -Z "$max" -s format png "$ORIG/$name" --out "$OUT/$name" >/dev/null
  fi
}

# About page (priority — the memory concern)
for f in bermuda roblox sunnybrook nmixx cider mlb geline; do
  optimize_jpeg "$f.jpg" "$ABOUT_MAX" "$ABOUT_Q"
done
optimize_png cfm.png "$ABOUT_MAX"   # diagram/logo: keep PNG to avoid JPEG ringing on text

# Projects page (secondary; larger display)
for f in peerassist peerassist2 trustnoghost pharmagotchi; do
  optimize_png "$f.png" "$PROJ_MAX"
done

echo "Done. Optimized -> $OUT; originals preserved in $ORIG."
