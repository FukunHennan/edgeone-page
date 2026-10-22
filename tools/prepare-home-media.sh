#!/usr/bin/env bash
# One-time, deliberately small source manifest for homepage scenery.
# Source pages and licenses: docs/HOMEPAGE_CAROUSEL.md
set -euo pipefail

command -v ffmpeg >/dev/null || { echo "ffmpeg is required"; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe is required"; exit 1; }

base="https://assets.mixkit.co/videos/preview"
outdir="astro-static/scenes"
mkdir -p "$outdir"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# All four are landscape Free License clips on official Mixkit pages.
names=(
  "mountain-lake|mixkit-landscape-with-mountains-and-a-lake-seen-from-above-42490-large.mp4"
  "soft-coast|mixkit-beautiful-aerial-shot-of-beach-shore-1085-large.mp4"
  "green-meadow|mixkit-countryside-meadow-4075-large.mp4"
  "misty-forest|mixkit-forest-stream-in-the-sunlight-529-large.mp4"
)
for item in "${names[@]}"; do
  name="${item%%|*}"
  filename="${item#*|}"
  url="$base/$filename"
  src="$tmp/$filename"
  video="$outdir/$name.mp4"
  poster="$outdir/$name.webp"

  echo "::group::Preparing $name"
  echo "Source: $url"
  curl --fail --location --retry 3 --retry-delay 3 --connect-timeout 20 --max-time 180 --silent --show-error "$url" -o "$src"
  test "$(stat -c %s "$src")" -gt 100000 || { echo "Source is suspiciously small: $name"; exit 1; }
  ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of default=noprint_wrappers=1 "$src"
  ffmpeg -nostdin -hide_banner -loglevel error -y -i "$src" -t 12 \
    -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=20" \
    -c:v libx264 -preset veryfast -crf 29 -pix_fmt yuv420p -an -movflags +faststart "$video"
  ffmpeg -nostdin -hide_banner -loglevel error -y -ss 2 -i "$video" -frames:v 1 \
    -c:v libwebp -quality 75 -compression_level 5 "$poster"
  video_bytes="$(stat -c %s "$video")"
  poster_bytes="$(stat -c %s "$poster")"
  test "$video_bytes" -lt 6500000 || { echo "Video exceeds 6.5MB size budget: $name"; exit 1; }
  test "$poster_bytes" -lt 600000 || { echo "Poster exceeds 600KB size budget: $name"; exit 1; }
  echo "Output: $video ($video_bytes bytes), $poster ($poster_bytes bytes)"
  echo "::endgroup::"
done
echo "All four scenes transcoded and posters generated."
