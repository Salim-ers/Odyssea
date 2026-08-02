/* Retrouver une adresse, et l'adresse d'une position.

   Nominatim est le service de recherche d'OpenStreetMap : il connaît les rues
   et les numéros, ce que le géocodage d'Open-Meteo — conçu pour les
   localités — ne sait pas faire. Il est gratuit et sans clé, mais son usage
   public impose une requête par seconde au plus : d'où le délai avant
   d'interroger, et le cache par libellé.

   Rien n'est envoyé à Odyssea : la recherche part du navigateur vers
   OpenStreetMap, et seule l'adresse retenue entre dans le brief. */

const BASE = process.env.NEXT_PUBLIC_NOMINATIM_URL || "https://nominatim.openstreetmap.org";

const cache = new Map();

const clean = (s) => String(s || "").trim();

/** Adresses correspondant à une saisie libre. */
export async function findAddress(text, { signal, limit = 5 } = {}) {
  const q = clean(text);
  if (q.length < 4) return [];
  if (cache.has(q)) return cache.get(q);

  const url = `${BASE}/search?${new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "1",
    limit: String(limit),
    "accept-language": "fr",
  })}`;

  try {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    const rows = await res.json();
    const out = rows.map(shape).filter(Boolean);
    cache.set(q, out);
    return out;
  } catch {
    /* Service indisponible : le champ reste utilisable en saisie libre. */
    return [];
  }
}

/** L'adresse d'un point, pour la géolocalisation du navigateur. */
export async function reverse(lat, lon, { signal } = {}) {
  const url = `${BASE}/reverse?${new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
    "accept-language": "fr",
  })}`;
  try {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    return shape(await res.json());
  } catch {
    /* On garde au moins les coordonnées : elles suffisent à tracer la route. */
    return { label: "Ma position", lat, lon };
  }
}

/* Nominatim renvoie un libellé complet, souvent trop long pour un champ. On
   garde la partie utile : numéro, rue, ville. */
function shape(row) {
  if (!row) return null;
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const a = row.address || {};
  const street = [a.house_number, a.road].filter(Boolean).join(" ");
  const city = a.city || a.town || a.village || a.municipality || a.county || "";
  const short = [street, city].filter(Boolean).join(", ");

  return {
    label: short || clean(row.display_name).split(",").slice(0, 2).join(","),
    full: row.display_name,
    lat,
    lon,
  };
}

/** La position du navigateur, si l'utilisateur l'accorde.

   `PositionOptions.timeout` ne compte que l'acquisition du signal : tant que
   la demande d'autorisation reste affichée sans réponse, aucun des deux
   rappels n'est appelé. Sans garde de notre côté, l'écran resterait suspendu
   sur « Localisation… » indéfiniment. On tranche donc nous-mêmes. */
const CONSENT_WAIT = 15000;

export function locate() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return reject(new Error("Votre navigateur ne sait pas vous localiser."));
    }

    let settled = false;
    const done = (fn) => (arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      fn(arg);
    };

    const guard = setTimeout(
      done(() =>
        reject(
          new Error(
            "Pas de réponse à la demande de localisation. Saisissez votre adresse à la place."
          )
        )
      ),
      CONSENT_WAIT
    );

    navigator.geolocation.getCurrentPosition(
      done((pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })),
      done((err) =>
        reject(
          new Error(
            err?.code === 1
              ? "Localisation refusée. Saisissez votre adresse à la place."
              : "Position indisponible. Saisissez votre adresse à la place."
          )
        )
      ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}
