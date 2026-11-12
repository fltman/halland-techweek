---
name: forbered
description: Gör en ny station klar för workshopen – installerar Railway-verktyget, ser till att stationen är inloggad, ordnar .env och provpublicerar en testapp. Används av workshopledaren en gång per maskin, direkt efter att mappen hämtats från git ("förbered stationen", "sätt upp railway", /forbered).
---

# Förbered stationen

Det här körs av workshopledaren, inte av deltagarna. Här får du vara teknisk och kortfattad. Gå igenom stegen i ordning och hoppa över dem som redan är klara. Börja alltid med:

```bash
./verktyg/kolla.sh
```

Utskriften visar vad som saknas. Kör den igen efter varje åtgärd.

## 1. Node
Kräver Node 22 eller nyare. Saknas det: säg det och stanna – installera inte Node på eget bevåg, ledaren väljer hur.

## 2. Railway-verktyget
Saknas `railway`:

```bash
npm install -g @railway/cli
```

Misslyckas det på behörighet: försök inte med `sudo`. Visa felet och låt ledaren avgöra.

## 3. Inloggning
Inloggningen öppnar en webbläsare och måste göras av en människa. Be ledaren skriva detta i prompten:

```
! railway login
```

Kontrollera sedan med `railway whoami`. Stämmer inte kontot med det ledaren väntade sig (eget konto eller arrangörernas): `! railway logout` och logga in på nytt.

## 4. Workspace
Kör `railway list --json` och se vilka workspaces kontot har. Finns det fler än ett: fråga ledaren vilket workshopens appar ska hamna i. Det valet skrivs in som `RAILWAY_WORKSPACE` i `.env` (steg 5). Med ett enda workspace lämnas raden tom.

## 5. .env
Finns ingen `.env`:

```bash
cp .env.example .env
```

Du läser aldrig `.env` och tar aldrig emot nycklar i chatten. Be ledaren öppna filen själv (`! open -e .env`) och fylla i:

- `ANTHROPIC_API_KEY` – en nyckel från Anthropics konsol, skapad för workshopen, med utgiftstak, som raderas efteråt.
- `AI_MODEL` – valfritt. Lämnas den tom används mallens standard, `claude-opus-5-5`.
- `RAILWAY_WORKSPACE` – bara om steg 4 krävde det.

Utan nyckel fungerar allt utom AI i apparna. Det är ett giltigt val; fråga ledaren om det är avsikten i stället för att tjata.

`kolla.sh` visar om värdena är satta utan att du behöver läsa filen.

## 6. Provpublicering
När `kolla.sh` säger "Klart att köra", prova hela kedjan med en testapp. Ge den ett namn som pekar ut stationen så att tre stationer inte krockar, t.ex. `prov-` följt av datorns namn (`scutil --get LocalHostName`):

```bash
./verktyg/ny-ide.sh prov-<station>
./verktyg/publicera.sh prov-<station>
```

Öppna sedan länken med `curl -s` och kontrollera att den svarar 200 och innehåller sidan. Är AI påslaget: prova också

```bash
curl -s -X POST <länk>/api/ai -H 'Content-Type: application/json' -d '{"prompt":"Säg hej på svenska."}'
```

och kontrollera att svaret innehåller `text`. Ett fel här beror nästan alltid på en ogiltig nyckel eller ett felstavat modellnamn – felet syns med `railway logs --service web` i testappens mapp.

Går något steg i `publicera.sh` fel mot Railway: läs felet, kontrollera kommandots flaggor med `railway <kommando> --help` och rätta skriptet. Railways CLI ändras ofta, och skriptet ska fungera innan deltagarna kommer. Säg tydligt till ledaren vad du ändrade, så att rättningen kan skickas upp till git och hämtas på de andra stationerna.

## 7. Rapportera
Avsluta med en kort lista: konto och workspace, om AI är påslaget, testappens länk och hur lång tid publiceringen tog. Testappen får ligga kvar som kvitto; ledaren tar bort den efteråt i Railways webbgränssnitt tillsammans med workshopens övriga projekt.
