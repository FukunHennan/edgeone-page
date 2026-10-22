#!/usr/bin/env bash
# One-time, deliberately small source manifest for homepage scenery.
# Source pages and licenses: docs/HOMEPAGE_CAROUSEL.md
set -euo pipefail

command -v ffmpeg >/dev/null || { echo "ffmpeg is required"; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe is required"; exit 1; }

outdir="astro-static/scenes"
mkdir -p "$outdir"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Wikimedia Commons files individually verified as CC0 (see documentation).
# Exact URLs resolve the original uploaded media. These clips are not third-party
# hotlinked at runtime: they are transcoded and committed to this repository.
names=(
  "mountain-lake|https://upload.wikimedia.org/wikipedia/commons/7/71/Mikata_Five_Lakes_%28Video%29.webm"
  "soft-coast|https://upload.wikimedia.org/wikipedia/commons/5/5d/Ocean_in_Sommaroy.webm"
  "green-meadow|https://upload.wikimedia.org/wikipedia/commons/c/c9/The_wind_plays_with_grasses_by_a_stream_in_Nickel_Plate_Park.webm"
  "misty-forest|https://upload.wikimedia.org/wikipedia/commons/8/83/Overlooking_a_forest_creek_in_the_Tsimpsean_Peninsula.webm"
)
for item in "${names[@]}"; do
  name="${item%%|*}"
  url="${item#*|}"
  src="$tmp/$name.webm"
  video="$outdir/$name.mp4"
  poster="$outdir/$name.webp"

  echo "::group::Preparing $name"
  echo "Source: $url"
  curl --user-agent "EdgeOnePageScenery/1.0 (personal CC0 media processing)" --fail --location --retry 3 --retry-delay 3 --connect-timeout 20 --max-time 240 --silent --show-error "$url" -o "$src"
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
