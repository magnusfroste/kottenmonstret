/* verify.mjs — räknar om varje genererad uppgift själv och kräver att
 * svarsbrickan är den enda som följer regeln.
 *
 *   node verify.mjs
 *
 * Kontrollerar per uppgift:
 *   rep     – hitta perioden (2 eller 3) ur de fem visade brickorna och kräv
 *             att svaret är nästa bricka i samma period
 *   rakna   – alla grannskillnader är lika stora och svaret = sista + steget
 *   vaxande – antalet ökar med exakt ett varje steg, formen är densamma
 * Därtill: exakt tre alternativ, exakt ett rätt, antal 1..10, känd form.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const dir = path.dirname(new URL(import.meta.url).pathname);
const M = require(path.join(dir, "public/monster.js"));

const fel = [];
const stat = {};
let antalUppgifter = 0;

function kolla(u, niva, i) {
  const namn = `nivå ${niva} uppgift ${i + 1} (${u.typ})`;
  const sek = u.sekvens;

  if (u.regel === "rep" && sek.length !== 5) fel.push(`${namn}: sekvensen har ${sek.length} brickor, ska vara 5`);
  if (u.regel !== "rep" && sek.length !== 4 && sek.length !== 5) fel.push(`${namn}: sekvensen har ${sek.length} brickor, ska vara 4 eller 5`);
  for (const b of sek.concat([u.svar], u.val || [])) {
    if (!M.FORMER.includes(b.form)) fel.push(`${namn}: okänd form ${b.form}`);
    if (!Number.isInteger(b.antal) || b.antal < 1 || b.antal > M.MAX_ANTAL)
      fel.push(`${namn}: antal ${b.antal} utanför 1..${M.MAX_ANTAL}`);
  }

  // alternativen
  if (!Array.isArray(u.val) || u.val.length !== 3) fel.push(`${namn}: ${u.val ? u.val.length : 0} alternativ, ska vara 3`);
  else {
    const rätta = u.val.filter((b) => M.lika(b, u.svar));
    if (rätta.length !== 1) fel.push(`${namn}: ${rätta.length} alternativ är rätt, ska vara 1`);
    const unika = new Set(u.val.map((b) => b.form + ":" + b.antal));
    if (unika.size !== 3) fel.push(`${namn}: dubbelt alternativ`);
    if (u.val[u.svarIndex] === undefined || !M.lika(u.val[u.svarIndex], u.svar))
      fel.push(`${namn}: svarIndex pekar inte på rätt bricka`);
  }

  // regeln, oberoende uträknad
  if (u.regel === "rep") {
    let period = 0;
    for (const p of [2, 3]) {
      let ok = true;
      for (let k = p; k < sek.length; k++) if (!M.lika(sek[k], sek[k - p])) ok = false;
      if (ok) { period = p; break; }
    }
    if (!period) { fel.push(`${namn}: ingen period 2 eller 3 i raden`); return; }
    if (u.period && u.period !== period) fel.push(`${namn}: period ${u.period} men raden visar ${period}`);
    const förväntad = sek[sek.length % period];
    if (!M.lika(u.svar, förväntad)) fel.push(`${namn}: svaret följer inte perioden`);
  } else {
    const antal = sek.map((b) => b.antal);
    const steg = antal[1] - antal[0];
    for (let k = 1; k < antal.length; k++)
      if (antal[k] - antal[k - 1] !== steg) fel.push(`${namn}: skillnaden är inte konstant`);
    if (steg === 0) fel.push(`${namn}: steget är 0`);
    if ((u.regel === "vaxer" || u.regel === "vaxlar") && steg !== 1) fel.push(`${namn}: växande rad med steg ${steg}`);
    if (u.regel !== "vaxer" && u.regel !== "vaxlar" && Math.abs(steg) > 2) fel.push(`${namn}: steget ${steg} är större än 2`);
    const förväntad = antal[antal.length - 1] + steg;
    if (u.svar.antal !== förväntad) fel.push(`${namn}: svaret ${u.svar.antal}, väntat ${förväntad}`);
    if (u.regel === "vaxlar") {
      // formen växlar med period 2 och svaret fortsätter växlingen
      for (let k = 2; k < sek.length; k++)
        if (sek[k].form !== sek[k - 2].form) fel.push(`${namn}: formen växlar inte med period 2`);
      if (sek[0].form === sek[1].form) fel.push(`${namn}: samma form två gånger i en växlande rad`);
      const väntadForm = sek[(sek.length) % 2].form;
      if (u.svar.form !== väntadForm) fel.push(`${namn}: svarets form fortsätter inte växlingen`);
    } else if (u.svar.form !== sek[0].form) fel.push(`${namn}: formen byts i en räkneserie`);
    // regeltexten måste stämma med steget
    const väntadRegel = steg === 1 ? "ett_mer" : steg === -1 ? "ett_mindre"
      : steg === 2 ? "tvaa_mer" : "tvaa_mindre";
    if (u.regel !== "vaxer" && u.regel !== "vaxlar" && u.regel !== väntadRegel)
      fel.push(`${namn}: regel ${u.regel} men steget är ${steg}`);
  }
  if (!u.regeltext || !M.REGLER[u.regel]) fel.push(`${namn}: saknar regeltext`);
  stat[u.typ] = (stat[u.typ] || 0) + 1;
  antalUppgifter++;
}

for (const niva of [1, 2, 3]) {
  for (const fro of [1, 2, 3, 7, 42, 99, 1234, 777777]) {
    const lista = M.uppgifter(niva, 10, fro);
    if (lista.length !== 10) fel.push(`nivå ${niva} frö ${fro}: ${lista.length} uppgifter`);
    lista.forEach((u, i) => kolla(u, niva, i));
  }
}

// nivåerna ska skilja sig: nivå 1 bara repetition, nivå 3 aldrig bara rep2
{
  const n1 = M.uppgifter(1, 10, 5).map((u) => u.typ);
  if (!n1.some((t) => t === "vaxer" || t === "ett_mer")) fel.push("nivå 1 saknar räkneserie");
  if (n1.filter((t) => t.startsWith("rep")).length > n1.length / 2) fel.push("nivå 1 är mest repetition");
  const n3 = M.uppgifter(3, 20, 5).map((u) => u.typ);
  if (!n3.some((t) => t === "vaxlar")) fel.push("nivå 3 saknar växlande rad");
  if (n3.filter((t) => t.startsWith("rep")).length > n3.length / 2) fel.push("nivå 3 är mest repetition");
  const n2 = M.uppgifter(2, 10, 5).map((u) => u.typ);
  if (n2.some((t) => t.startsWith("rep"))) fel.push("nivå 2 innehåller repetition");
  if (n2.some((t) => t === "vaxer")) fel.push("nivå 2 är för lik nivå 1");
}

// kanonisk lista för kortbild och dokumentation
const exempel = M.uppgifter(2, 3, 12).map((u) => ({
  rad: u.sekvens.map((b) => `${b.antal} ${b.form}`).join(" , "),
  svar: `${u.svar.antal} ${u.svar.form}`,
  regel: u.regeltext
}));
fs.writeFileSync(path.join(dir, "exempel.json"), JSON.stringify(exempel, null, 2) + "\n");

console.log(`Uppgifter kontrollerade: ${antalUppgifter}`);
console.log("Fördelning:", JSON.stringify(stat));
if (fel.length) {
  console.error(`\n${fel.length} fel:`);
  fel.slice(0, 20).forEach((f) => console.error(" - " + f));
  process.exit(1);
}
console.log("0 fel – varje uppgift har exakt ett svar som följer regeln.");