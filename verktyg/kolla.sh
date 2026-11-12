#!/bin/bash
# Körs en gång per maskin före workshopen. Kontrollerar allt som publiceringen behöver.
ROT="$(cd "$(dirname "$0")/.." && pwd)"
ok=1
rad() { printf '%-5s %s\n' "$1" "$2"; }

if command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 22 ]; then
  rad OK "node $(node --version)"
else
  rad FEL "node 22 eller nyare behövs"; ok=0
fi

if command -v railway >/dev/null; then
  rad OK "railway $(railway --version 2>/dev/null)"
  if who=$(railway whoami 2>/dev/null); then rad OK "inloggad: $who"; else rad FEL "inte inloggad – kör: railway login"; ok=0; fi
else
  rad FEL "railway saknas – kör: npm install -g @railway/cli"; ok=0
fi

if [ -f "$ROT/.env" ]; then
  set -a; . "$ROT/.env"; set +a
  [ -n "${OPENROUTER_API_KEY:-}" ] && rad OK "OPENROUTER_API_KEY satt" || rad OBS "OPENROUTER_API_KEY tom – appar med AI fungerar inte"
  [ -n "${AI_MODEL:-}" ] && rad OK "AI_MODEL=$AI_MODEL" || rad OBS "AI_MODEL tom – appar med AI fungerar inte"
else
  rad OBS ".env saknas – kopiera .env.example om apparna ska kunna använda AI"
fi

[ $ok -eq 1 ] && echo "Klart att köra." || { echo "Åtgärda FEL ovan."; exit 1; }
