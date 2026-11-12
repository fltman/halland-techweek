---
name: publicera
description: Lägger ut en idé från workshopen på nätet via Railway och ger en publik länk. Använd när deltagaren vill publicera, lägga ut, dela, visa upp eller uppdatera sin app ("publicera", "lägg ut den", "jag vill ha en länk", /publicera).
---

# Publicera

1. Kontrollera att appen startar lokalt utan fel (`npm run dev` i idéns mapp). Publicera inte något som kraschar.
2. Kör från workshopmappens rot:

   ```bash
   ./verktyg/publicera.sh <namn>
   ```

   `<namn>` är mappens namn under `ideer/`. Första gången tar det någon minut eller två; säg det till deltagaren. Samma kommando används för att uppdatera en redan publicerad app.
3. Skriptet avslutar med raden `LÄNK: https://…`. Vänta några sekunder, öppna länken med `curl -sI` och kontrollera att den svarar 200 innan du lämnar över den.
4. Ge deltagaren länken på en egen rad och påminn om att lägga in den på arrangörernas plattform så att den får en QR-kod.

## Om det går fel
- "Inte inloggad" eller "railway saknas": be workshopledaren om hjälp – försök inte logga in själv.
- Bygget misslyckas: läs felet i utskriften, rätta i idéns mapp och kör skriptet igen.
- Länken svarar inte: kör `railway logs --service web` i idéns mapp. Vanligaste felet är att servern inte lyssnar på `process.env.PORT`.
- Skapa aldrig ett Railway-projekt för hand vid sidan av skriptet – då blir det dubbletter.
