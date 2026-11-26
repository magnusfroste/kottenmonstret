# Inskick – Kotten och mönstret

**Titel:** Kotten och mönstret
**URL:** https://kottenmonstret.shipholm.dev/
**Kort beskrivning (max 500):** En rad brickor följer ett mönster. Peka på brickan som kommer sedan: ett mer varje gång, ett mindre, eller samma former igen. Tre nivåer med talföljder.
**Kategorier:** Matte · FK–2 · Öva · Alla enheter
**Lgr22:** MA.1-3.2.3
**Kortbild:** `public/kort.png` (1200×900, spelmoment: nivå 2, raden 2-3-4-5-6 kvadrater med tom pulserande ruta)
**Katalograd:** `018564e5-f090-45a3-97c8-6552257ee1e0` (pending), bild `/images/4787441b332d2551c511a5ebddb0f433.png`
**Status:** pending – granskningsjobbet godkänner.
**Nära släkt:** *Mönsterbanan* (approved, MA.1-3.2.3) upprepar färger; den här appen ändrar antalet i varje bricka (talföljd) och beskriver regeln med ord. Repetition finns bara som första steg i nivå 1.

## Testbevis
- `node verify.mjs`: 240 uppgifter (3 nivåer × 8 frön × 10), 0 fel – varje uppgift har exakt ett alternativ som följer regeln, räknat om oberoende av generatorn.
- Hela spelet spelat två gånger: första omgången 29/30 stjärnor (ett fel prövat i nivå 2: första felet = "Titta noga på raden igen." utan stjärnförlust, andra felet = rätt bricka pulserar och regeln sägs); efter ombalanseringen nivå 1 omspelad 10/10 på driftsatt URL med 6 mp3-uppspelningar och 0 px scroll.
- 37 mp3-uppspelningar under en full omgång (faktiska `Audio`-anrop, inte bara 200 på filen).
- 0 px scroll båda axlarna i 1024×768, 768×1024, 390×844, 1440×900 efter att startskärmen stängts.
- Svarsbrickor 109–176 px (minst 109 px på 390×844).
