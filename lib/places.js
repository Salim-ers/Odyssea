/* Recherche mondiale : aéroports et destinations.

   Le jeu de données (4 034 aéroports desservis, 234 pays — source
   OurAirports, domaine public) vit dans /public/data et n'est chargé qu'à
   la première ouverture d'un champ. Il ne pèse donc rien au chargement de
   la page, et une seule requête suffit pour toute la session.

   Format d'une entrée : [IATA, nom, ville, pays ISO, rang, alias, lat, lon]
   rang 0 = grand aéroport, 1 = moyen, 2 = petit — c'est l'ordre de tri.
   Les alias portent les noms alternatifs : « Tokyo » trouve Narita, « New
   York » trouve Newark. */

let cache = null;
let inflight = null;

export function loadPlaces() {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch("/data/airports.json")
    .then((r) => {
      if (!r.ok) throw new Error("airports " + r.status);
      return r.json();
    })
    .then((raw) => {
      cache = build(raw);
      return cache;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });
  return inflight;
}

export const peekPlaces = () => cache;

/* Noms de pays en français, sans table à maintenir. */
const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" });
  } catch {
    return null;
  }
})();
const countryName = (code) => {
  try {
    return regionNames?.of(code) || code;
  } catch {
    return code;
  }
};

export const norm = (s) =>
  (s || "").normalize("NFD").replace(new RegExp("[̀-ͯ]", "g"), "").toLowerCase().trim();

function build(raw) {
  const airports = raw.map(([code, name, city, cc, rank, alias, lat, lon]) => {
    const country = countryName(cc);
    return { code, name, city, cc, country, rank, lat, lon, hay: norm(`${code} ${name} ${city} ${country} ${alias || ""}`) };
  });

  /* Les destinations se déduisent des aéroports : un pays desservi est une
     destination, une ville dotée d'un aéroport majeur aussi. */
  const countries = new Map();
  const cities = new Map();
  for (const a of airports) {
    if (!countries.has(a.cc)) countries.set(a.cc, { kind: "country", name: a.country, cc: a.cc, n: 0, rank: 3 });
    countries.get(a.cc).n++;
    if (a.rank > 1 || !a.city) continue;
    const key = a.cc + "|" + norm(a.city);
    if (!cities.has(key)) cities.set(key, { kind: "city", name: a.city, cc: a.cc, country: a.country, rank: a.rank, codes: [] });
    const c = cities.get(key);
    c.codes.push(a.code);
    if (a.rank < c.rank) c.rank = a.rank;
  }

  const destinations = [
    ...[...countries.values()].map((c) => ({ ...c, sub: `${c.n} aéroport${c.n > 1 ? "s" : ""} desservi${c.n > 1 ? "s" : ""}` })),
    ...[...cities.values()].map((c) => ({ ...c, sub: `${c.country} · ${c.codes.slice(0, 3).join(" · ")}` })),
  ].map((d) => ({ ...d, hay: norm(`${d.name} ${d.country || ""} ${(d.codes || []).join(" ")}`) }));

  return { airports, destinations };
}

/* Recherche : préfixe d'abord, puis contenu ; les grands aéroports et les
   pays remontent à égalité de pertinence. */
export function search(list, q, limit = 40) {
  const n = norm(q);
  if (!n) return list.filter((x) => x.rank === 0).slice(0, limit);
  const out = [];
  for (const item of list) {
    const i = item.hay.indexOf(n);
    if (i < 0) continue;
    const exact = item.code ? norm(item.code) === n : norm(item.name) === n;
    out.push({ item, score: (exact ? -100 : 0) + (i === 0 ? 0 : 10) + i * 0.01 + item.rank });
    if (out.length > 900) break;
  }
  out.sort((a, b) => a.score - b.score);
  return out.slice(0, limit).map((x) => x.item);
}
