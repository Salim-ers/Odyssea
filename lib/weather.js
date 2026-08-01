/* Météo réelle, via Open-Meteo : gratuit, sans clé, sans inscription.

   Deux régimes selon l'horizon :
   — sous 16 jours, la prévision du modèle ;
   — au-delà, les normales climatiques calculées sur les cinq dernières années
     à la même période. On ne présente jamais une normale comme une prévision. */

const FORECAST = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

/* Les deux points d'accès ne servent pas les mêmes variables.

   `precipitation_probability_max` est une sortie de modèle : elle n'existe
   que dans la prévision. L'archive, elle, ne connaît que ce qui est tombé —
   `precipitation_sum`, en millimètres. Demander la probabilité à l'archive
   renvoyait donc une colonne vide, et la météo affichait « — » sur chaque
   journée au-delà de seize jours. On demande à chacun ce qu'il a. */
const DAILY_FORECAST =
  "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset";
const DAILY_ARCHIVE =
  "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum";

/* Codes WMO regroupés en ce dont on a besoin pour choisir une icône. */
export function conditionOf(code) {
  if (code === 0 || code === 1) return { icon: "sun", label: "Ensoleillé" };
  if (code === 2) return { icon: "sun", label: "Éclaircies" };
  if (code === 3) return { icon: "cloud", label: "Couvert" };
  if (code >= 45 && code <= 48) return { icon: "cloud", label: "Brouillard" };
  if (code >= 51 && code <= 67) return { icon: "rain", label: "Pluie" };
  if (code >= 71 && code <= 77) return { icon: "cloud", label: "Neige" };
  if (code >= 80 && code <= 82) return { icon: "rain", label: "Averses" };
  if (code >= 95) return { icon: "rain", label: "Orages" };
  return { icon: "cloud", label: "Variable" };
}

async function fetchJson(url) {
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json();
}

const iso = (d) => d.toISOString().slice(0, 10);
const addYears = (isoDate, n) => {
  const d = new Date(isoDate + "T12:00:00");
  d.setFullYear(d.getFullYear() + n);
  return iso(d);
};

/** Prévision jour par jour entre deux dates, pour une position donnée. */
export async function forecast({ lat, lon, start, end }) {
  const url = `${FORECAST}?latitude=${lat}&longitude=${lon}&daily=${DAILY_FORECAST}&timezone=auto&start_date=${start}&end_date=${end}`;
  const data = await fetchJson(url);
  const d = data.daily || {};
  return (d.time || []).map((date, i) => ({
    date,
    kind: "forecast",
    code: d.weather_code?.[i] ?? null,
    tmax: Math.round(d.temperature_2m_max?.[i] ?? 0),
    tmin: Math.round(d.temperature_2m_min?.[i] ?? 0),
    rain: d.precipitation_probability_max?.[i] ?? null,
    rainMm: null,
    sunrise: d.sunrise?.[i]?.slice(11, 16) ?? null,
    sunset: d.sunset?.[i]?.slice(11, 16) ?? null,
  }));
}

/** Normales des cinq dernières années sur la même fenêtre de dates.

   Une seule requête couvrant les cinq années, et non cinq requêtes d'une
   semaine. Avec deux escales, l'ancienne méthode lançait dix appels d'un coup
   et le service libre d'Open-Meteo en refusait une partie : une escale
   entière ressortait alors sans aucune donnée. Un intervalle continu coûte
   plus d'octets mais un seul appel, et on ne garde que les dates utiles. */
export async function normals({ lat, lon, start, end }) {
  const wanted = new Set();
  for (let d = new Date(start + "T12:00:00"); iso(d) <= end; d.setDate(d.getDate() + 1)) {
    wanted.add(iso(d).slice(5)); /* MM-JJ */
  }

  const run = await fetchJson(
    `${ARCHIVE}?latitude=${lat}&longitude=${lon}&daily=${DAILY_ARCHIVE}&timezone=auto` +
      `&start_date=${addYears(start, -5)}&end_date=${addYears(end, -1)}`
  ).catch(() => null);

  const buckets = new Map();
  const d = run?.daily;
  if (d?.time) {
    d.time.forEach((date, i) => {
      const key = date.slice(5); /* MM-JJ : on agrège la même date, tous millésimes confondus */
      if (!wanted.has(key)) return;
      const b = buckets.get(key) || { tmax: [], tmin: [], mm: [], codes: [] };
      if (d.temperature_2m_max?.[i] != null) b.tmax.push(d.temperature_2m_max[i]);
      if (d.temperature_2m_min?.[i] != null) b.tmin.push(d.temperature_2m_min[i]);
      if (d.precipitation_sum?.[i] != null) b.mm.push(d.precipitation_sum[i]);
      if (d.weather_code?.[i] != null) b.codes.push(d.weather_code[i]);
      buckets.set(key, b);
    });
  }

  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const out = [];
  for (let d = new Date(start + "T12:00:00"); iso(d) <= end; d.setDate(d.getDate() + 1)) {
    const date = iso(d);
    const b = buckets.get(date.slice(5));
    if (!b || !b.tmax.length) {
      out.push({ date, kind: "unknown", code: null, tmax: null, tmin: null, rain: null, rainMm: null });
      continue;
    }
    /* Le code retenu est le plus fréquent des cinq années. */
    const tally = new Map();
    for (const c of b.codes) tally.set(c, (tally.get(c) || 0) + 1);
    const code = [...tally.entries()].sort((a, b2) => b2[1] - a[1])[0]?.[0] ?? null;
    out.push({
      date,
      kind: "normal",
      code,
      tmax: Math.round(mean(b.tmax)),
      tmin: Math.round(mean(b.tmin)),
      /* Une moyenne de cumuls : on la donne en millimètres, jamais en
         probabilité — ce n en est pas une. */
      rain: null,
      rainMm: b.mm.length ? Math.round(mean(b.mm) * 10) / 10 : null,
    });
  }
  return out;
}

/** Prévision si elle existe, normales au-delà. */
export async function weatherFor({ lat, lon, start, end }) {
  const horizon = iso(new Date(Date.now() + 15 * 86400_000));
  if (start > horizon) return normals({ lat, lon, start, end });
  if (end <= horizon) return forecast({ lat, lon, start, end });

  const [near, far] = await Promise.all([
    forecast({ lat, lon, start, end: horizon }),
    normals({ lat, lon, start: iso(new Date(Date.parse(horizon) + 86400_000)), end }),
  ]);
  return [...near, ...far];
}
