#!/usr/bin/env bash
# Renders logo.png and social-preview.png from the SVG sources in this folder.
# The social preview uses the framed screenshots from example/screenshots (run capture.sh first).
# Upload social-preview.png in the repository settings under Social preview.
set -euo pipefail
cd "$(dirname "$0")"
web=../../example/screenshots/output/web
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/shots"
for f in ios-scan-bmw-i3 android-photo-tesla-model-s; do
  magick "$web/$f.webp" "$tmp/shots/$f.png"
done
cp social-preview.svg "$tmp/"
rsvg-convert -w 1280 -h 640 "$tmp/social-preview.svg" -o social-preview.png
rsvg-convert -w 512 -h 512 logo.svg -o logo.png
