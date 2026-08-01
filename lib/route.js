/* Les tronçons d'un itinéraire, avec leur vraie géométrie.

   Deux natures de trajet, qui ne se calculent pas de la même façon :

   — sur route, on demande le tracé réel à un moteur de routage. On obtient
     alors la géométrie exacte, la distance et la durée — pas une ligne droite
     entre deux points ;
   — en l'air, aucun moteur ne sert : on trace l'orthodromie, qui est
     réellement la route suivie par un avion, et on estime la durée à partir
     d'une vitesse de croisière et du temps de montée et de descente.

   Le choix entre les deux se fait sur la distance à vol d'oiseau : au-delà
   d'un seuil, personne ne fait le trajet en voiture, et le moteur de routage
   refuserait de toute façon de traverser une mer.

   Le moteur est remplaçable par variable d'environnement : le service public
   d'OSRM n'a aucune garantie de disponibilité et convient pour commencer, pas
   pour tenir une charge. */

const OSRM = process.env.NEXT_PUBLIC_OSRM_URL || "https://router.project-osrm.org";

/** Au-delà, on considère que le trajet se fait en avion. */
const ROAD_LIMIT_KM = 700;

const R = 6371; /* rayon terrestre moyen, en kilomètres */
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** Distance orthodromique entre deux points, en kilomètres. */
export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* L'orthodromie, échantillonnée. Sur une carte de Mercator elle se courbe —
   c'est bien le chemin que suit un avion, et non la ligne droite qu'on serait
   tenté de tracer. */
function greatCircle(a, b, steps = 64) {
  const φ1 = rad(a.lat), λ1 = rad(a.lon);
  const φ2 = rad(b.lat), λ2 = rad(b.lon);
  const d = haversine(a, b) / R;
  if (d < 1e-9) return [[a.lat, a.lon], [b.lat, b.lon]];

  const out = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    out.push([deg(Math.atan2(z, Math.hypot(x, y))), deg(Math.atan2(y, x))]);
  }
  return out;
}

/* Vitesse de croisière et temps perdu au décollage, à l'atterrissage et au
   roulage. Une estimation assumée : on l'annonce comme telle. */
const CRUISE_KMH = 820;
const GROUND_MIN = 45;

const airLeg = (a, b) => {
  const km = haversine(a, b);
  return {
    mode: "air",
    from: a,
    to: b,
    line: greatCircle(a, b),
    km: Math.round(km),
    minutes: Math.round((km / CRUISE_KMH) * 60 + GROUND_MIN),
    estimated: true,
  };
};

/** Le tracé routier réel entre deux points, ou null si le moteur ne répond pas. */
async function roadLeg(a, b, signal) {
  const url =
    `${OSRM}/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}` +
    `?overview=full&geometries=geojson&alternatives=false&steps=false`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const r = data?.routes?.[0];
    if (!r?.geometry?.coordinates?.length) return null;
    return {
      mode: "road",
      from: a,
      to: b,
      /* GeoJSON donne [lon, lat] ; les cartes attendent [lat, lon]. */
      line: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      km: Math.round(r.distance / 1000),
      minutes: Math.round(r.duration / 60),
      estimated: false,
    };
  } catch {
    return null;
  }
}

/** Les tronçons entre les étapes, dans l'ordre du voyage. */
export async function legsFor(points, { signal } = {}) {
  const usable = (points || []).filter(
    (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon)
  );
  const legs = [];
  for (let i = 0; i < usable.length - 1; i++) {
    const a = usable[i];
    const b = usable[i + 1];
    const straight = haversine(a, b);
    /* Au-delà du seuil, inutile d'interroger le moteur : la réponse serait
       absurde ou absente. */
    const leg = straight > ROAD_LIMIT_KM ? null : await roadLeg(a, b, signal);
    legs.push(leg || airLeg(a, b));
  }
  return legs;
}

/** « 2 h 35 », « 45 min ». */
export const humanTime = (min) => {
  if (!Number.isFinite(min) || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""}` : `${m} min`;
};

export const humanKm = (km) =>
  Number.isFinite(km) ? `${km.toLocaleString("fr-FR")} km` : "—";
