# Halland Tech Week – kreativ workshop

[![Support me on Patreon](https://img.shields.io/badge/Patreon-Support%20my%20work-FF424D?style=flat&logo=patreon&logoColor=white)](https://www.patreon.com/AndersBjarby)

En workshopmapp för Claude Code där deltagare bygger sin idé som en liten webbapp och får ut den på nätet via [Railway](https://railway.com) – utan att själva röra vare sig kod eller terminal.

## Sätt upp en station

Kräver [Claude Code](https://claude.com/claude-code) och Node 22 eller nyare.

```bash
git clone https://github.com/fltman/halland-techweek.git
cd halland-techweek
claude
```

Skriv sedan `/forbered`. Claude installerar Railway-verktyget, ber dig logga in, hjälper dig med `.env` och provpublicerar en testapp så att du vet att hela kedjan fungerar innan deltagarna kommer.

## Under workshopen

Deltagaren sätter sig vid stationen och berättar sin idé. Tre skills gör jobbet:

| Skill | Vad den gör |
| --- | --- |
| `/forbered` | Gör stationen klar. Körs av workshopledaren, en gång per maskin. |
| `/ny-ide` | Skapar en egen mapp för idén under `ideer/` och får igång den lokalt. |
| `/publicera` | Lägger ut appen på Railway och ger en publik länk. Körs igen för att uppdatera. |

Deltagaren behöver inte kunna namnen – det räcker att säga "jag har en idé" och "lägg ut den".

Lathund för deltagarna: https://claude.ai/artifact/PdGJ4aGytwNeoHZ8qyvqMX (källan är `lathund.html`).

## Så hänger det ihop

- `CLAUDE.md` – hur Claude ska bete sig mot deltagarna: enkelt språk, små steg, mobilen först.
- `mall/` – startpunkten för varje idé: en liten Node-server utan beroenden som visar `public/` och erbjuder AI via `/api/ai`, så att API-nyckeln aldrig hamnar i webbläsaren.
- `verktyg/` – skripten bakom skillsen. `kolla.sh` visar om stationen är redo.
- `ideer/` – en mapp per idé. Varje idé blir ett eget Railway-projekt med namnet `htw-<namn>`.
- `.env` – OpenRouter-nyckel och modell, delas av alla idéer på stationen. Checkas aldrig in.

## Efteråt

Radera OpenRouter-nyckeln och ta bort `htw-`-projekten i Railway, annars fortsätter de att kosta.

## Licens

MIT – se [LICENSE](LICENSE).
