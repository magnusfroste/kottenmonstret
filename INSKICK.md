# Inskick – Kotten och mönstret

**Titel:** Kotten och mönstret
**URL:** https://kottenmonstret.shipholm.dev/
**Kort beskrivning (max 500):** En rad brickor följer ett mönster. Peka på brickan som kommer sedan: samma former om och om igen, ett mer varje gång eller två mindre. Tre nivåer, tio uppgifter i varje.
**Kategorier:** Matematik · 1–3 · Öva · Alla enheter
**Lgr22:** MA.1-3.2.3
**Kortbild:** `public/kort.png` (1200×900, spelmoment: nivå 2, raden 2-3-4-5-6 kvadrater med tom pulserande ruta)
**Status:** pending – granskningsjobbet godkänner.

## Testbevis
- `node verify.mjs`: 240 uppgifter (3 nivåer × 8 frön × 10), 0 fel – varje uppgift har exakt ett alternativ som följer regeln, räknat om oberoende av generatorn.
- Hela spelet spelat: nivå 1 (10/10), nivå 2 (9/10, ett fel prövat: första felet = "Titta noga på raden igen." utan stjärnförlust, andra felet = rätt bricka pulserar och regeln sägs), nivå 3 till "Alla mönster klara! … 29 stjärnor".
- 37 mp3-uppspelningar under en full omgång (faktiska `Audio`-anrop, inte bara 200 på filen).
- 0 px scroll båda axlarna i 1024×768, 768×1024, 390×844, 1440×900 efter att startskärmen stängts.
- Svarsbrickor 109–176 px (minst 109 px på 390×844).
