/* Kotten och mönstret – vad kommer sedan?
   Statisk app, inga beroenden. Tränar Lgr22 MA.1-3.2.3:
   "Enkla mönster i talföljder och enkla geometriska mönster samt hur de
   konstrueras, beskrivs och uttrycks."

   Spelbilden bär inga ord som barnet måste läsa: frågan är en rad brickor med
   en pulserande tom ruta, och svaret är tre brickor. Regeln sägs och skrivs
   efter svaret ("Ett mer varje gång.") – det är beskrivningen som är målet. */
(function () {
  "use strict";

  var MAX_ANTAL = 10, PER_NIVA = 10, ANTAL_NIVAER = 3;

  var startEl = document.getElementById("startskarm");
  var spelEl = document.getElementById("spel");
  var radEl = document.getElementById("rad");
  var svarEl = document.getElementById("svar");
  var prickarEl = document.getElementById("prickar");
  var stjarnorEl = document.getElementById("stjarnor");
  var fragaEl = document.getElementById("fraga");
  var kottenEl = document.getElementById("kotten");
  var overlay = document.getElementById("overlay");
  var ljudKnapp = document.getElementById("ljud");

  var S = {
    skarm: "start", niva: 1, lista: [], idx: 0, stjarnor: 0,
    nivaStjarnor: 0, fel: 0, lastFel: null, visaRatt: false,
    last: false, fro: (Date.now() % 100000) + 1
  };
  var ljudPa = true, ljudkontext = null;

  /* ------------------------------------------------------------------ *
   * Kotten – egen SVG, fem uttryck, samma figur som i familjen          *
   * ------------------------------------------------------------------ */
  function kottenInner(uttryck) {
    var F = "#b07d4b", M = "#8a5f36", O = "#2b2118", mun, ogen = "", extra = "";
    if (uttryck === "hejar") mun = '<path d="M22 36 q8 8 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>';
    else if (uttryck === "firar") {
      mun = '<path d="M21 34 q9 12 18 0" fill="#fff"/><path d="M21 34 q9 12 18 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>';
      extra = '<path d="M10 12 l3 6M50 12 l-3 6M30 6 v5" stroke="#e8a33d" stroke-width="2.2" stroke-linecap="round" fill="none"/>';
    } else if (uttryck === "tanker") {
      mun = '<path d="M24 37 h11" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
      ogen = '<circle cx="47" cy="22" r="4" fill="none" stroke="' + M + '" stroke-width="1.6" opacity=".5"/>';
    } else if (uttryck === "funderar") mun = '<path d="M22 38 q8 -6 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>';
    else mun = '<path d="M22 34 q8 8 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>';
    var oga = '<circle cx="23" cy="24" r="5.2" fill="#fff"/><circle cx="37" cy="24" r="5.2" fill="#fff"/>' +
      '<circle cx="24" cy="24.6" r="2.5" fill="' + O + '"/><circle cx="36" cy="24.6" r="2.5" fill="' + O + '"/>';
    return extra +
      '<path d="M30 6 q9 4 12 12 q9 12 4 24 q-4 12 -16 14 q-12 -2 -16 -14 q-5 -12 4 -24 q3 -8 12 -12z" fill="' + F + '"/>' +
      '<path d="M19 20 q11 -5 22 0M16 30 q14 -5 28 0M16 40 q14 -4 28 0" stroke="' + M + '" style="fill:none" stroke-width="1.7" opacity=".85" stroke-linecap="round"/>' +
      oga + ogen + mun;
  }
  function kottenSvg(uttryck, klass) {
    return '<svg class="' + (klass || "kotten-svg") + '" viewBox="0 0 60 60" aria-hidden="true">' + kottenInner(uttryck) + '</svg>';
  }
  function kottenByt(uttryck) { if (kottenEl) kottenEl.innerHTML = kottenSvg(uttryck); }

  /* ------------------------------------------------------------------ *
   * Ljud: mp3 först, talsyntes som reserv                               *
   * ------------------------------------------------------------------ */
  function ljud(frekvens, langd, typ) {
    if (!ljudPa) return;
    try {
      if (!ljudkontext) ljudkontext = new (window.AudioContext || window.webkitAudioContext)();
      var o = ljudkontext.createOscillator(), g = ljudkontext.createGain();
      o.type = typ || "sine"; o.frequency.value = frekvens;
      g.gain.value = 0.001; o.connect(g); g.connect(ljudkontext.destination);
      var t = ljudkontext.currentTime;
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + langd);
      o.start(t); o.stop(t + langd + 0.02);
    } catch (e) { }
  }
  function sag(text) {
    if (!ljudPa || !text) return;
    try {
      if (window.__rost) { var a = window.__rost(text); if (a) return; }
      if ("speechSynthesis" in window) {
        var u = new SpeechSynthesisUtterance(text);
        u.lang = "sv-SE"; u.rate = 0.94; u.volume = 0.9;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      }
    } catch (e) { }
  }
  function tysta() { try { window.__rostStopp && window.__rostStopp(); } catch (e) { } try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { } }
  function spar(namn, varde) { try { if (window.skolappar && window.skolappar.event) window.skolappar.event(namn, varde); } catch (e) { } }

  /* ------------------------------------------------------------------ *
   * Brickorna: former ritade i kod                                      *
   * ------------------------------------------------------------------ */
  var FORM_FARG = { triangel: "#e2725b", cirkel: "#3f8fa8", kvadrat: "#e0a437", stjarna: "#7f9b52" };

  function formSvg(form, storlek) {
    var f = FORM_FARG[form] || "#888", inre;
    if (form === "triangel") inre = '<path d="M50 8 L92 84 H8 Z" fill="' + f + '"/>';
    else if (form === "cirkel") inre = '<circle cx="50" cy="50" r="42" fill="' + f + '"/>';
    else if (form === "kvadrat") inre = '<rect x="10" y="10" width="80" height="80" rx="14" fill="' + f + '"/>';
    else inre = '<path d="M50 6 L62 38 L96 38 L68 58 L79 92 L50 71 L21 92 L32 58 L4 38 L38 38 Z" fill="' + f + '"/>';
    return '<svg class="form" viewBox="0 0 100 100" aria-hidden="true" style="width:' + storlek + 'px;height:' + storlek + 'px">' + inre + '</svg>';
  }

  /* Ett antal lika stora former i ett rutnät inuti brickan. */
  function brickaInnehall(b, liten) {
    var n = Math.max(1, Math.min(MAX_ANTAL, b.antal)), kol = n <= 4 ? 2 : 3;
    var rader = Math.ceil(n / kol);
    var h = '<div class="former" style="grid-template-columns:repeat(' + kol + ',1fr);grid-template-rows:repeat(' + rader + ',1fr)">';
    for (var i = 0; i < n; i++) h += '<span class="cell">' + formSvg(b.form, liten ? 22 : 30) + '</span>';
    return h + '</div>';
  }

  function brickaHtml(b, klass, attribut) {
    return '<div class="bricka ' + (klass || "") + '" ' + (attribut || "") + '>' + brickaInnehall(b) + '</div>';
  }

  /* Sagda meningar som hela strängar – varje rad blir en mp3-fil.
     Inga meningar byggs ihop vid körning, då matchar de ingen fil. */
  var NIVA_ROST = {
    1: "Nivå ett. Vad kommer sedan?",
    2: "Nivå två. Två steg i taget. Vad kommer sedan?",
    3: "Nivå tre. Nu växlar formen också. Vad kommer sedan?"
  };
  var NIVA_KLAR_ROST = {
    1: "Nivå ett klar! Nu blir mönstren svårare.",
    2: "Nivå två klar! Nu växlar formerna också."
  };
  var SLUT_ROST = "Alla mönster klara! Du hittade alla mönster. Visa stjärnorna hemma!";

  /* ------------------------------------------------------------------ *
   * Spelet                                                              *
   * ------------------------------------------------------------------ */
  function startaNiva(n) {
    S.niva = n;
    S.lista = window.MONSTER.uppgifter(n, PER_NIVA, S.fro + n * 101);
    S.idx = 0; S.nivaStjarnor = 0; S.fel = 0; S.lastFel = null; S.visaRatt = false;
    S.skarm = "spel";
    startEl.hidden = true; spelEl.hidden = false; overlay.hidden = true;
    kottenByt("glad");
    rita();
    sag(NIVA_ROST[n] || NIVA_ROST[1]);
    fragaEl.textContent = "Vad kommer sedan?";
    spar("level", n);
    spar("round_start", n);
  }

  function aktuell() { return S.lista[S.idx]; }

  function rita() {
    var u = aktuell();
    if (!u) return;
    // raden: de visade brickorna + en tom pulserande ruta
    var h = "", i;
    for (i = 0; i < u.sekvens.length; i++) h += brickaHtml(u.sekvens[i], "visad");
    var rattBricka = S.visaRatt ? '<div class="bricka visad ratt-svar">' + brickaInnehall(u.svar) + '<span class="kryss" aria-hidden="true">✓</span></div>'
      : '<div class="bricka tom' + (S.visaRatt ? "" : " puls") + '" id="tomruta" aria-label="här ska nästa bricka ligga"><span class="fragetecken" aria-hidden="true">?</span></div>';
    h += rattBricka;
    radEl.innerHTML = h;
    radEl.style.setProperty("--antal", u.sekvens.length + 1);

    // svarsbrickorna
    var s = "";
    for (i = 0; i < u.val.length; i++) {
      var b = u.val[i];
      var klass = "val" + (S.visaRatt && window.MONSTER.lika(b, u.svar) ? " ratt" : "") +
        (S.lastFel === i ? " fel" : "");
      s += '<button class="bricka val" data-i="' + i + '" aria-label="bricka ' + (i + 1) + '">' + brickaInnehall(b) + '</button>';
      void klass;
    }
    svarEl.innerHTML = s;
    var knappar = svarEl.querySelectorAll("button.val");
    for (i = 0; i < knappar.length; i++) {
      (function (knapp) {
        knapp.addEventListener("click", function () { svara(parseInt(knapp.getAttribute("data-i"), 10)); });
      })(knappar[i]);
    }
    // rätt/fel-klass sätts efter att knapparna finns
    if (S.visaRatt) {
      for (i = 0; i < knappar.length; i++) {
        var bb = u.val[i];
        if (window.MONSTER.lika(bb, u.svar)) knappar[i].classList.add("ratt");
      }
    } else if (S.lastFel !== null) {
      knappar[S.lastFel] && knappar[S.lastFel].classList.add("fel");
    }

    ritaPrickar();
    ritaStjarnor();
  }

  function ritaPrickar() {
    var h = "", i;
    for (i = 0; i < PER_NIVA; i++) h += '<i class="' + (i < S.idx ? "klar" : i === S.idx ? "nu" : "") + '"></i>';
    prickarEl.innerHTML = h;
  }
  function ritaStjarnor() {
    stjarnorEl.innerHTML = '<span class="stjarna-ikon" aria-hidden="true">★</span><span class="stjarna-tal">' + S.stjarnor + "</span>";
  }

  function svara(i) {
    var u = aktuell();
    if (!u || S.visaRatt) return;
    var b = u.val[i];
    if (window.MONSTER.lika(b, u.svar)) {
      var forsta = S.fel === 0;
      if (forsta) { S.stjarnor++; S.nivaStjarnor++; }
      S.visaRatt = true;
      kottenByt("firar");
      ljud(660, 0.12); setTimeout(function () { ljud(880, 0.16); }, 130);
      fragaEl.textContent = u.regeltext;
      sag(u.regeltext);
      rita();
      S.idx++;
      spar("round_done", Math.round((S.idx / PER_NIVA) * 100));
      setTimeout(function () {
        if (S.idx >= PER_NIVA) nivaKlar();
        else { S.fel = 0; S.lastFel = null; S.visaRatt = false; kottenByt("glad"); rita(); }
      }, 1500);
    } else {
      S.fel++;
      S.lastFel = i;
      kottenByt(S.fel >= 2 ? "tanker" : "funderar");
      ljud(210, 0.16, "triangle");
      if (S.fel >= 2) {
        S.visaRatt = true;
        fragaEl.textContent = u.regeltext;
        sag(u.regeltext);
        spar("hint");
        rita();
        S.idx++;
        setTimeout(function () {
          if (S.idx >= PER_NIVA) nivaKlar();
          else { S.fel = 0; S.lastFel = null; S.visaRatt = false; kottenByt("glad"); rita(); }
        }, 1800);
      } else {
        fragaEl.textContent = "Titta noga på raden igen.";
        sag("Titta noga på raden igen.");
        rita();
      }
    }
  }

  function nivaKlar() {
    if (S.niva < ANTAL_NIVAER) {
      visaOverlay("firar", "Nivå " + S.niva + " klar!", S.nivaStjarnor + " av " + PER_NIVA + " stjärnor. Nu blir mönstren svårare.", "Nästa nivå", function () {
        startaNiva(S.niva + 1);
      });
      sag(NIVA_KLAR_ROST[S.niva] || NIVA_KLAR_ROST[1]);
    } else {
      S.last = true;
      visaOverlay("firar", "Alla mönster klara!", "Du hittade alla mönster och fick " + S.stjarnor + " stjärnor. Visa dem hemma!", "Spela igen", function () {
        S.fro = (Date.now() % 100000) + 1;
        S.stjarnor = 0;
        startaNiva(1);
      });
      sag(SLUT_ROST);
      spar("round_done", 100);
    }
  }

  function visaOverlay(uttryck, titel, text, knapptext, fn) {
    overlay.hidden = false;
    document.getElementById("ov-bild").innerHTML = kottenSvg(uttryck, "kotten-stor");
    document.getElementById("ov-titel").textContent = titel;
    document.getElementById("ov-text").textContent = text;
    var b = document.getElementById("ov-nasta");
    b.textContent = knapptext;
    b.onclick = function () { overlay.hidden = true; fn(); };
    var om = document.getElementById("ov-om");
    om.hidden = !S.last;
    om.onclick = function () { overlay.hidden = true; S.stjarnor = 0; S.fro = (Date.now() % 100000) + 1; startaNiva(1); };
    b.focus && b.focus();
  }

  /* ------------------------------------------------------------------ *
   * Kontroller                                                          *
   * ------------------------------------------------------------------ */
  var ljudIkoner = {
    pa: '<path d="M4 9h3l4-3v12l-4-3H4z"/><path d="M15 8a5 5 0 0 1 0 8M17.5 5.5a8.5 8.5 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    av: '<path d="M4 9h3l4-3v12l-4-3H4z"/><path d="M15 9l6 6M21 9l-6 6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>'
  };
  function ritaLjud() { document.getElementById("ljudikon").innerHTML = ljudPa ? ljudIkoner.pa : ljudIkoner.av; }
  ljudKnapp.addEventListener("click", function () {
    ljudPa = !ljudPa;
    if (!ljudPa) tysta();
    ritaLjud();
    if (!ljudPa) spar("sound_off");
  });
  document.getElementById("hjalp").addEventListener("click", function () {
    var u = aktuell();
    if (!u) return;
    if (S.visaRatt) sag(u.regeltext); else sag(u.fragetext);
    spar("hint");
  });

  document.getElementById("spela").addEventListener("click", function () {
    try {
      if (!ljudkontext) ljudkontext = new (window.AudioContext || window.webkitAudioContext)();
      if (ljudkontext.state === "suspended") ljudkontext.resume();
      if (window.__rostStart) window.__rostStart();
    } catch (e) { }
    startaNiva(1);
  });

  ritaLjud();
  kottenByt("glad");

  /* Test- och granskningshandtag */
  window.__game = {
    S: S,
    startaNiva: startaNiva,
    svara: svara,
    rita: rita,
    aktuell: aktuell
  };
})();