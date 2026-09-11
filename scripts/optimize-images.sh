#!/usr/bin/env bash
#
# Optimize site images with macOS `sips`, or with the ffmpeg bundled by the
# ffmpeg-static devDependency when sips is unavailable (Windows/Linux).
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

# Backend: prefer sips on macOS; otherwise use ffmpeg-static (npm install first).
FFMPEG="$ROOT/node_modules/ffmpeg-static/ffmpeg"
[ -x "$FFMPEG" ] || FFMPEG="$FFMPEG.exe"
if command -v sips >/dev/null 2>&1; then BACKEND=sips
elif [ -x "$FFMPEG" ]; then BACKEND=ffmpeg
else echo "Need macOS sips or node_modules/ffmpeg-static (run npm install)." >&2; exit 1; fi

# ffmpeg scale filter: cap the longest side at $1, keep aspect, even dimensions.
ff_scale() { echo "scale='if(gt(iw,ih),$1,-2)':'if(gt(iw,ih),-2,$1)'"; }

# Print "width height" of an image.
dimensions() {
  if [ "$BACKEND" = sips ]; then
    echo "$(sips -g pixelWidth "$1" | awk '/pixelWidth/{print $2}') $(sips -g pixelHeight "$1" | awk '/pixelHeight/{print $2}')"
  else
    "$FFMPEG" -i "$1" 2>&1 | sed -nE 's/.* ([0-9]+)x([0-9]+)[ ,].*/\1 \2/p' | head -1
  fi
}

ABOUT_MAX=600   # ~2x the 260px About popover
ABOUT_Q=72      # JPEG quality; 70-75 is visually lossless at this size
PROJ_MAX=1200   # ~2x the 600px projects modal hero

# Resize a JPEG from the original into public/images, seeding the original first.
optimize_jpeg() {
  local name="$1" max="$2" quality="$3"
  [ -f "$ORIG/$name" ] || cp "$OUT/$name" "$ORIG/$name"
  if [ "$BACKEND" = sips ]; then
    sips -Z "$max" -s format jpeg -s formatOptions "$quality" "$ORIG/$name" --out "$OUT/$name" >/dev/null
  else
    # ffmpeg mjpeg quality is 2 (best) .. 31; ~4 lands near JPEG q72-80. -map_metadata -1 strips EXIF.
    "$FFMPEG" -y -loglevel error -i "$ORIG/$name" -vf "$(ff_scale "$max")" -map_metadata -1 -q:v 4 "$OUT/$name"
  fi
}

# Convert a PNG/JPEG original to a resized WebP. Best choice for screenshots and
# photos that were saved as PNG but need no transparency: ~10-50x smaller.
optimize_webp() {
  local name="$1" max="$2" quality="$3"
  local base="${name%.*}"
  [ -f "$ORIG/$name" ] || cp "$OUT/$name" "$ORIG/$name"
  if [ "$BACKEND" = ffmpeg ]; then
    "$FFMPEG" -y -loglevel error -i "$ORIG/$name" -vf "$(ff_scale "$max")" -c:v libwebp -quality "$quality" "$OUT/$base.webp"
  else
    # sips can't write WebP; fall back to cwebp if installed (brew install webp).
    command -v cwebp >/dev/null || { echo "cwebp missing; skipping $name (brew install webp)" >&2; return; }
    cwebp -quiet -resize "$max" 0 -q "$quality" "$ORIG/$name" -o "$OUT/$base.webp"
  fi
}

# Resize a PNG from the original. PNG is lossless, so resampling is the only size
# lever — and sips is a poor PNG (re)compressor, so re-encoding an image that's
# already within the cap only bloats it. We therefore skip re-encoding entirely
# when no downscale is needed and just copy the original bytes through.
optimize_png() {
  local name="$1" max="$2"
  [ -f "$ORIG/$name" ] || cp "$OUT/$name" "$ORIG/$name"
  local w h longest
  read -r w h <<<"$(dimensions "$ORIG/$name")"
  longest=$(( w > h ? w : h ))
  if [ "$longest" -le "$max" ]; then
    cp "$ORIG/$name" "$OUT/$name"   # already small enough; keep original bytes
  elif [ "$BACKEND" = sips ]; then
    # Downscaling cuts decoded bitmap memory; a small file-size bump from sips's
    # PNG encoder is an acceptable trade for that memory win.
    sips -Z "$max" -s format png "$ORIG/$name" --out "$OUT/$name" >/dev/null
  else
    "$FFMPEG" -y -loglevel error -i "$ORIG/$name" -vf "$(ff_scale "$max")" "$OUT/$name"
  fi
}

# About page (priority — the memory concern)
for f in bermuda roblox sunnybrook nmixx cider mlb geline; do
  optimize_jpeg "$f.jpg" "$ABOUT_MAX" "$ABOUT_Q"
done
for f in cxc hogsmeade; do   # straight-off-the-camera 6000x4000 JPGs
  optimize_jpeg "$f.JPG" "$ABOUT_MAX" "$ABOUT_Q"
done
optimize_png cfm.png "$ABOUT_MAX"   # diagram/logo: keep PNG to avoid JPEG ringing on text
# Screenshots saved as PNG with no transparency -> WebP (index.html references .webp)
for f in balatro trumpet; do
  optimize_webp "$f.png" "$ABOUT_MAX" 78
done

# Projects page (secondary; larger display)
for f in peerassist peerassist2 trustnoghost pharmagotchi; do
  optimize_png "$f.png" "$PROJ_MAX"
done

echo "Done ($BACKEND). Optimized -> $OUT; originals preserved in $ORIG."
