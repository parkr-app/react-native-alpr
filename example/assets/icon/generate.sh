#!/usr/bin/env bash
# Renders the PNG icons from the SVG sources in this folder. iOS 26+ uses ../app.icon
# (Icon Composer, Liquid Glass) directly; icon.png is the fallback for older iOS.
set -euo pipefail
cd "$(dirname "$0")"
out=..
rsvg-convert -w 1024 -h 1024 alpr.svg -o "$out/icon.png"
rsvg-convert -w 1024 -h 1024 android-foreground.svg -o "$out/android-icon-foreground.png"
rsvg-convert -w 1024 -h 1024 android-background.svg -o "$out/android-icon-background.png"
rsvg-convert -w 1024 -h 1024 android-monochrome.svg -o "$out/android-icon-monochrome.png"
rsvg-convert -w 1024 -h 1024 splash.svg -o "$out/splash-icon.png"
rsvg-convert -w 48 -h 48 alpr.svg -o "$out/favicon.png"
