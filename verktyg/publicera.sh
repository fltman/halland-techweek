#!/bin/bash
# Publicerar ideer/<namn>/ på Railway och skriver ut den publika länken.
# Användning: ./verktyg/publicera.sh <namn>
# Första körningen skapar projekt + tjänst + domän; senare körningar uppdaterar bara.
set -euo pipefail
ROT="$(cd "$(dirname "$0")/.." && pwd)"

[ $# -eq 1 ] || { echo "Användning: ./verktyg/publicera.sh <namn>" >&2; exit 1; }
namn=$1
mapp="$ROT/ideer/$namn"
[ -f "$mapp/package.json" ] || { echo "Hittar ingen idé i ideer/$namn" >&2; exit 1; }

command -v railway >/dev/null || { echo "railway saknas – workshopledaren kör /forbered" >&2; exit 1; }
railway whoami >/dev/null 2>&1 || { echo "Inte inloggad på Railway – workshopledaren kör: railway login" >&2; exit 1; }

if [ -f "$ROT/.env" ]; then set -a; . "$ROT/.env"; set +a; fi

cd "$mapp"

if [ ! -f .rw-projekt ]; then
  echo "Skapar Railway-projektet htw-$namn …"
  railway init --name "htw-$namn" ${RAILWAY_WORKSPACE:+--workspace "$RAILWAY_WORKSPACE"} --json >/dev/null
  touch .rw-projekt
fi

if [ ! -f .rw-tjanst ]; then
  railway add --service web --json >/dev/null
  for nyckel in OPENROUTER_API_KEY AI_MODEL; do
    varde="${!nyckel:-}"
    if [ -n "$varde" ]; then
      printf '%s' "$varde" | railway variable set "$nyckel" --stdin --service web --skip-deploys --json >/dev/null
    fi
  done
  touch .rw-tjanst
fi

echo "Bygger och lägger ut (brukar ta en minut eller två) …"
railway up --ci --service web

if [ ! -s .rw-lank ]; then
  svar=$(railway domain --service web --json 2>&1) || true
  doman=$(printf '%s' "$svar" | grep -oE '[a-zA-Z0-9.-]+\.up\.railway\.app' | head -1 || true)
  if [ -z "$doman" ]; then
    echo "Kunde inte läsa ut domänen. Railway svarade:" >&2
    echo "$svar" >&2
    exit 1
  fi
  echo "https://$doman" > .rw-lank
fi

echo
echo "LÄNK: $(cat .rw-lank)"
