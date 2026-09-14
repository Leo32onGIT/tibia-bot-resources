#!/usr/bin/env bash
# Fetch the creature sprites the channel demos need into assets/img/creatures/.
#
# WHY THIS EXISTS
#   The bot points its Discord embed thumbnails straight at tibiawiki.com.br.
#   Those render inside Discord only because Discord re-hosts them through
#   media.discordapp.net — Discord's servers do the fetching, not the reader's
#   browser. A browser loading violentbot.xyz would have to fetch them itself,
#   and TibiaWiki geoblocks / 403s that. So the sprites have to be served from
#   this repo.
#
# WHERE TO RUN IT
#   Anywhere that can actually reach tibiawiki.com.br — the VPS the bot runs on
#   is the obvious candidate, since the bot fetches these every day. Commit the
#   results; GitHub Pages then serves them from the same origin as the site.
#
# USAGE
#   bash tools/fetch-sprites.sh            # only what is missing
#   bash tools/fetch-sprites.sh --force    # re-download everything
#
# The list in tools/sprites.txt is generated from assets/js/demo.js, so it
# cannot drift from what the page actually asks for.

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

LIST="tools/sprites.txt"
OUT="assets/img/creatures"
BASE="https://www.tibiawiki.com.br/wiki/Special:Redirect/file"
UA="violentbot.xyz sprite vendoring (https://github.com/Leo32onGIT/tibia-bot-resources)"

[ -f "$LIST" ] || { echo "missing $LIST"; exit 1; }
mkdir -p "$OUT"

force=0
[ "${1:-}" = "--force" ] && force=1

ok=0; skip=0; fail=0; failed=""

while IFS= read -r name; do
  [ -z "$name" ] && continue
  dest="$OUT/$name.gif"

  if [ "$force" -eq 0 ] && [ -s "$dest" ]; then
    skip=$((skip + 1))
    continue
  fi

  code=$(curl -sS -L --max-time 30 -A "$UA" -o "$dest.tmp" -w "%{http_code}" "$BASE/$name.gif" 2>/dev/null)

  # A 403/404 still writes a body, so check the magic bytes rather than trusting
  # the status alone — an HTML error page saved as .gif is worse than no file.
  if [ "$code" = "200" ] && head -c 3 "$dest.tmp" 2>/dev/null | grep -q "GIF"; then
    mv "$dest.tmp" "$dest"
    ok=$((ok + 1))
    printf '  ok    %s\n' "$name"
  else
    rm -f "$dest.tmp"
    fail=$((fail + 1))
    failed="$failed $name"
    printf '  FAIL  %s (http %s)\n' "$name" "$code"
  fi

  # TibiaWiki is a fansite wiki, not an API. Go gently.
  sleep 0.4
done < "$LIST"

echo
echo "downloaded $ok, already present $skip, failed $fail"
if [ -n "$failed" ]; then
  echo "failed:$failed"
  echo
  echo "A name that 404s is probably spelled differently on the wiki."
  echo "Check the page title and fix the entry in assets/js/demo.js, then"
  echo "regenerate the list and re-run."
  exit 1
fi
