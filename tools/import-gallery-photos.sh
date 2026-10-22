#!/usr/bin/env bash
# One-time import of photographic images, never the previous video frame grabs.
# Source photos are Unsplash License images; see docs/HOMEPAGE_CAROUSEL.md.
set -euo pipefail
command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null
mkdir -p astro-static/scenes
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

scenes=(
 "gallery-mountain|photo-1501785888041-af3ef285b470"
 "gallery-coast|photo-1507525428034-b723cf961d3e"
 "gallery-meadow|photo-1470252649378-9c29740c9fa8"
 "gallery-forest|photo-1448375240586-882707db888b"
)
for item in "${scenes[@]}"; do
 name="${item%%|*}"
 photo="${item#*|}"
 echo "::group::Preparing $name"
 url="https://images.unsplash.com/$photo?auto=format&fit=crop&w=1920&h=1080&q=88"
 curl --fail --location --retry 4 --retry-delay 3 --max-time 180 --silent --show-error "$url" -o "$tmp/$name.src"
 ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$tmp/$name.src"
 ffmpeg -nostdin -hide_banner -loglevel error -y -i "$tmp/$name.src" -frames:v 1 \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
    -c:v libwebp -quality 78 -compression_level 6 "astro-static/scenes/$name.webp"
 size="$(stat -c %s "astro-static/scenes/$name.webp")"
 test "$size" -gt 40000 && test "$size" -lt 800000 || { echo "Photo size outside budget: $name $size"; exit 1; }
 echo "Saved $name.webp ($size bytes)"
 echo "::endgroup::"
done
