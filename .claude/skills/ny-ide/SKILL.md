---
name: ny-ide
description: Startar en ny idé i workshopen – skapar en egen mapp från mallen och får igång den lokalt. Använd när en deltagare vill börja på något nytt ("jag har en idé", "ny app", "börja om med en annan idé", /ny-ide).
---

# Ny idé

1. Om deltagaren inte redan berättat: fråga vad idén är, i en mening. Fråga inget mer.
2. Hitta på ett kort namn för idén (ett eller två ord, t.ex. `fikaroulette`) och skapa mappen från workshopmappens rot:

   ```bash
   ./verktyg/ny-ide.sh <namn>
   ```

   Skriptet skriver ut den färdiga mappens namn (det städar bort å/ä/ö och mellanslag). Finns namnet redan säger det ifrån – välj då ett annat.
3. Bygg en första version direkt i `ideer/<namn>/public/`. Sikta på något deltagaren kan klicka på inom ett par minuter; finslipa sedan.
4. Starta appen i bakgrunden och ge deltagaren adressen som skrivs ut:

   ```bash
   cd ideer/<namn> && npm run dev
   ```

5. Berätta kort vad du byggt och fråga vad som ska ändras. När deltagaren är nöjd nog att visa upp det: använd skillen `publicera`.

Använd AI i appen bara om idén behöver det. I så fall anropar sidan `/api/ai` – exempel finns överst i `server.js`.
