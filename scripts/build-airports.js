/* Construit le jeu de données aéroports à partir d'OurAirports (domaine public).
   Sortie : public/data/airports.json — [code IATA, nom, ville, pays ISO, rang] */
const fs = require("fs");

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); field = ""; rows.push(row); row = []; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCSV(fs.readFileSync(process.argv[2], "utf8"));
const head = rows[0];
const ix = (n) => head.indexOf(n);
const I = {
  type: ix("type"), name: ix("name"), country: ix("iso_country"),
  city: ix("municipality"), sched: ix("scheduled_service"), iata: ix("iata_code"),
  kw: ix("keywords"), lat: ix("latitude_deg"), lon: ix("longitude_deg"),
};

const RANK = { large_airport: 0, medium_airport: 1, small_airport: 2 };

/* Nettoie les noms : « ... International Airport » est du bruit répété 3 000 fois. */
const clean = (n) => n
  .replace(/\s+International Airport$/i, "")
  .replace(/\s+Regional Airport$/i, "")
  .replace(/\s+Municipal Airport$/i, "")
  .replace(/\s+Airport$/i, "")
  .replace(/\s+Airfield$/i, "")
  .replace(/\s+Air Base$/i, "")
  .trim();

const FRC = JSON.parse(fs.readFileSync('fr-cities.json','utf8'));
/* « Paris (Roissy-en-France, Val-d'Oise) » -> « Paris » ; nom francisé si connu. */
const city = (m) => {
  const base = (m || '').split('(')[0].split(',')[0].trim();
  return FRC[base] || base;
};

/* Les mots-clés d'OurAirports portent les noms alternatifs (« Tokyo » pour
   Narita, « NYC » pour Newark). On ne garde que le latin, et seulement ce qui
   n'est pas déjà dans le nom ou la ville. */
const keywords = (raw, name, town, code) => {
  const known = (name + ' ' + town + ' ' + code).toLowerCase();
  const seenK = new Set();
  const kept = [];
  for (let w of (raw || '').split(',')) {
    w = w.trim();
    if (!w || w.length > 22) continue;
    if (!/^[\p{Script=Latin}0-9 .'’-]+$/u.test(w)) continue;
    const l = w.toLowerCase();
    if (seenK.has(l) || known.includes(l)) continue;
    seenK.add(l);
    kept.push(w);
    if (kept.length === 4) break;
  }
  return kept.join(' ');
};

const out = [];
const seen = new Set();
for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row.length < head.length) continue;
  const iata = (row[I.iata] || "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(iata) || seen.has(iata)) continue;
  if ((row[I.sched] || "").trim() !== "yes") continue;
  const rank = RANK[row[I.type]];
  if (rank === undefined) continue;
  seen.add(iata);
  const nm = clean(row[I.name]);
  const tw = city(row[I.city]);
  const kw = keywords(row[I.kw], nm, tw, iata);
  const la = Math.round(parseFloat(row[I.lat]) * 100) / 100;
  const lo = Math.round(parseFloat(row[I.lon]) * 100) / 100;
  /* Les coordonnées servent à situer le départ sur la carte du parcours. */
  out.push([iata, nm, tw, row[I.country], rank, kw || "", la, lo]);
}

out.sort((a, b) => a[4] - b[4] || a[2].localeCompare(b[2]));
fs.mkdirSync("out", { recursive: true });
fs.writeFileSync("out/airports.json", JSON.stringify(out));
console.log("aéroports :", out.length);
console.log("large :", out.filter((a) => a[4] === 0).length,
  "medium :", out.filter((a) => a[4] === 1).length,
  "small :", out.filter((a) => a[4] === 2).length);
console.log("pays distincts :", new Set(out.map((a) => a[3])).size);
console.log("octets :", fs.statSync("out/airports.json").size);
