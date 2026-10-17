#!/usr/bin/env bash
# Lighthouse sweep of Royer's Frontend Mentor production pages (measurement branch only; never merged).
# Usage: run.sh <shard> <shards> <runs>. urls.txt lines are "<row> <url>"; one Lighthouse at a time on this runner.
set -u
SHARD=$1; SHARDS=$2; RUNS=$3
OUT=out; mkdir -p $OUT
CHROME_PATH=$(command -v google-chrome || command -v google-chrome-stable); export CHROME_PATH
n=0
while read -r ROW URL; do
  [ -z "${ROW:-}" ] && continue
  if [ $((n % SHARDS)) -eq "$SHARD" ]; then
    for RUN in $(seq 1 "$RUNS"); do
      for DEV in mobile desktop; do
        EXTRA=(); [ "$DEV" = desktop ] && EXTRA=(--preset=desktop)
        F=$OUT/$ROW--$DEV--$RUN.json
        lighthouse "$URL" --quiet --output=json --output-path="$F" --max-wait-for-load=45000 \
          --chrome-flags="--headless=new --no-sandbox --no-first-run" "${EXTRA[@]}" >/dev/null 2>&1
        echo "$ROW $DEV run$RUN rc=$? $URL"
        gzip -9 -f "$F" 2>/dev/null
      done
    done
  fi
  n=$((n+1))
done < .github/lh/urls.txt
