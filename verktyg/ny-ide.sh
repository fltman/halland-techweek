#!/bin/bash
# Skapar ideer/<namn>/ från mallen. Användning: ./verktyg/ny-ide.sh <namn>
set -euo pipefail
ROT="$(cd "$(dirname "$0")/.." && pwd)"

[ $# -ge 1 ] || { echo "Användning: ./verktyg/ny-ide.sh <namn>" >&2; exit 1; }

namn=$(printf '%s' "$*" | tr '[:upper:]' '[:lower:]' \
  | sed -e 's/[åäÅÄ]/a/g' -e 's/[öÖ]/o/g' -e 's/[éÉ]/e/g' -e 's/[^a-z0-9]/-/g' -e 's/--*/-/g' -e 's/^-//' -e 's/-$//' \
  | cut -c1-30)
[ -n "$namn" ] || { echo "Namnet blev tomt – använd bokstäver eller siffror." >&2; exit 1; }

mal="$ROT/ideer/$namn"
[ ! -e "$mal" ] || { echo "ideer/$namn finns redan – välj ett annat namn." >&2; exit 1; }

cp -R "$ROT/mall" "$mal"
(cd "$mal" && npm install --silent --no-audit --no-fund) || echo "OBS: npm install misslyckades – kör det igen i ideer/$namn innan appen startas." >&2
echo "Skapade ideer/$namn"
