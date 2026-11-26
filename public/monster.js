/* Mönstergeneratorn — ren data, kontrollerad av verify.mjs.
 *
 * Ett mönster är en rad brickor. Varje bricka har en form och ett antal
 * (antalet ritas som lika många former i brickan). Barnet ser fem brickor
 * och pekar på den sjätte bland tre alternativ.
 *
 * Tre regler används, och bara dessa:
 *   rep     – samma former om och om igen i en fast period (2 eller 3)
 *   rakna   – antalet ändras lika mycket varje steg (+1, +2, +3, −1, −2, −3)
 *   vaxande – formen är densamma, antalet ökar med ett varje steg
 *
 * Genererandet är deterministiskt ur ett frö, så verify.mjs kan spela upp
 * exakt samma uppgifter som appen visar och räkna om svaret själv.
 */
(function (rot) {
  "use strict";

  var FORMER = ["triangel", "cirkel", "kvadrat", "stjarna"];
  var MAX_ANTAL = 10;

  var REGLER = {
    rep: "Samma former om och om igen.",
    ett_mer: "Ett mer varje gång.",
    ett_mindre: "Ett mindre varje gång.",
    tvaa_mer: "Två mer varje gång.",
    tvaa_mindre: "Två mindre varje gång.",
    vaxer: "Samma form, men ett mer varje gång.",
    vaxlar: "Formen växlar och ett mer varje gång."
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function valj(rng, lista) { return lista[Math.floor(rng() * lista.length)]; }
  function heltal(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }

  function bricka(form, antal) { return { form: form, antal: antal }; }

  function lika(a, b) { return a.form === b.form && a.antal === b.antal; }

  /* --- de tre reglerna ------------------------------------------------- */

  function gorRep(rng, period) {
    var former = FORMER.slice(), i, val = [];
    for (i = former.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1)), t = former[i];
      former[i] = former[j]; former[j] = t;
    }
    var mönster = former.slice(0, period);
    for (i = 0; i < 5; i++) val.push(bricka(mönster[i % period], 1));
    return { sekvens: val, svar: bricka(mönster[5 % period], 1), regel: "rep", period: period };
  }

  function gorRakna(rng, steg) {
    /* startvärdet måste hålla hela raden, även den sjätte brickan, inom 1..10 */
    /* så många rutor som ryms: steg 2 och 3 klarar inte fem synliga rutor i 1..10 */
    var visade = 5, giltiga = [], s, k;
    while (visade >= 3) {
      giltiga = [];
      for (s = 1; s <= MAX_ANTAL; s++) {
        var ok = true;
        for (k = 0; k <= visade; k++) {
          var v = s + steg * k;
          if (v < 1 || v > MAX_ANTAL) ok = false;
        }
        if (ok) giltiga.push(s);
      }
      if (giltiga.length) break;
      visade--;
    }
    var start = valj(rng, giltiga);
    var form = valj(rng, FORMER), i, val = [];
    for (i = 0; i < visade; i++) val.push(bricka(form, start + steg * i));
    var regel = steg === 1 ? "ett_mer" : steg === -1 ? "ett_mindre"
      : steg === 2 ? "tvaa_mer" : "tvaa_mindre";
    return { sekvens: val, svar: bricka(form, start + steg * visade), regel: regel, steg: steg };
  }

  function gorVaxande(rng) {
    var form = valj(rng, FORMER), start = heltal(rng, 1, MAX_ANTAL - 5), i, val = [];
    for (i = 0; i < 5; i++) val.push(bricka(form, start + i));
    return { sekvens: val, svar: bricka(form, start + 5), regel: "vaxer", steg: 1 };
  }

  /* nivå 3: två saker ändras samtidigt – formen växlar och antalet ökar med ett */
  function gorVaxlar(rng) {
    var f1 = valj(rng, FORMER);
    var f2 = valj(rng, FORMER.filter(function (f) { return f !== f1; }));
    var start = heltal(rng, 1, MAX_ANTAL - 5), i, val = [];
    for (i = 0; i < 5; i++) val.push(bricka(i % 2 ? f2 : f1, start + i));
    return { sekvens: val, svar: bricka(f2, start + 5), regel: "vaxlar", steg: 1 };
  }

  /* --- distraktorer ---------------------------------------------------- */

  function distraktorer(rng, upg) {
    var ratt = upg.svar, ut = [], kandidat, försök = 0;
    while (ut.length < 2 && försök < 200) {
      försök++;
      if (upg.regel === "rep") {
        var former = FORMER.filter(function (f) { return f !== ratt.form; });
        kandidat = bricka(valj(rng, former), ratt.antal);
      } else {
        var delta = valj(rng, [1, -1, 2, -2].filter(function (d) { return d !== upg.steg; }));
        kandidat = bricka(ratt.form, ratt.antal + delta);
      }
      if (kandidat.antal < 1 || kandidat.antal > MAX_ANTAL) continue;
      if (lika(kandidat, ratt)) continue;
      if (ut.some(function (b) { return lika(b, kandidat); })) continue;
      ut.push(kandidat);
    }
    /* rep har alltid minst tre former; räkneserier kan ta slut på tal – fyll på */
    var extra = FORMER.slice();
    while (ut.length < 2) {
      kandidat = bricka(ratt.form, heltal(rng, 1, MAX_ANTAL));
      if (!lika(kandidat, ratt) && !ut.some(function (b) { return lika(b, kandidat); })) ut.push(kandidat);
    }
    void extra;
    return ut;
  }

  function blanda(rng, lista) {
    var a = lista.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(rng() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function medVal(rng, upg) {
    var val = blanda(rng, [upg.svar].concat(distraktorer(rng, upg)));
    upg.val = val;
    upg.svarIndex = val.findIndex(function (b) { return lika(b, upg.svar); });
    return upg;
  }

  /* --- nivåerna -------------------------------------------------------- */

  var NIVAA = {
    1: ["vaxer", "ett_mer", "vaxer", "rep2"],
    2: ["ett_mer", "ett_mindre", "tvaa_mer", "tvaa_mindre"],
    3: ["vaxlar", "tvaa_mer", "tvaa_mindre", "vaxer", "rep3", "vaxlar"]
  };

  function enUppgift(rng, sort) {
    var u;
    if (sort === "rep2") u = gorRep(rng, 2);
    else if (sort === "rep3") u = gorRep(rng, 3);
    else if (sort === "vaxer") u = gorVaxande(rng);
    else if (sort === "ett_mer") u = gorRakna(rng, 1);
    else if (sort === "ett_mindre") u = gorRakna(rng, -1);
    else if (sort === "tvaa_mer") u = gorRakna(rng, 2);
    else if (sort === "tvaa_mindre") u = gorRakna(rng, -2);
    else u = gorVaxlar(rng);
    u.typ = sort;
    u.fragetext = "Vad kommer sedan?";
    u.regeltext = REGLER[u.regel];
    return medVal(rng, u);
  }

  /* antal uppgifter per nivå × nivåer = 30 stjärnor */
  function uppgifter(niva, antal, fro) {
    var rng = mulberry32(fro || 1), sortlista = NIVAA[niva] || NIVAA[1];
    /* blanda en kö av sorterna så att varje nivå garanterat blandar dem,
       i stället för att slumpen kan ge tio likadana uppgifter i rad */
    var ko = [], ut = [], i;
    while (ko.length < antal) ko = ko.concat(blanda(rng, sortlista.slice()));
    for (i = 0; i < antal; i++) ut.push(enUppgift(rng, ko[i]));
    return ut;
  }

  var api = {
    FORMER: FORMER,
    REGLER: REGLER,
    NIVAA: NIVAA,
    MAX_ANTAL: MAX_ANTAL,
    uppgifter: uppgifter,
    gorRakna: gorRakna,
    lika: lika
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  rot.MONSTER = api;
})(typeof window !== "undefined" ? window : globalThis);