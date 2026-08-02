/* Le registre des partenaires.

   Un seul endroit décrit chaque service : ce qu'il vend, les pays où il opère,
   l'identifiant d'affiliation qui le rémunère, et la façon de construire un
   lien profond vers la bonne recherche. Les écrans ne connaissent aucune URL —
   ils demandent « un hébergement à Lisbonne du 3 au 9 octobre » et le registre
   répond.

   Ce découplage a trois raisons. Ajouter un partenaire ne touche qu'à ce
   fichier. Un partenaire absent d'un pays n'y est jamais proposé. Et le jour
   où une vraie API remplace un lien profond, seule la fonction `url` change.

   Les identifiants viennent de l'environnement : ils ne sont pas dans le
   dépôt, et un partenaire sans identifiant reste utilisable — le lien part
   sans commission plutôt que de disparaître. */

const env = (name) => process.env[name] || process.env[`NEXT_PUBLIC_${name}`] || "";

const q = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

/** Catégories, dans l'ordre où elles apparaissent dans un voyage. */
export const KINDS = {
  flight: "Vol",
  stay: "Hébergement",
  transfer: "Transfert",
  car: "Location de voiture",
  train: "Train et bus",
  ride: "VTC et taxi",
  activity: "Activité",
  esim: "Carte eSIM",
  gear: "Équipement",
};

/* `countries` liste les codes ISO où le service opère. « * » vaut partout.
   `only` restreint au contraire à une liste — c'est le cas des VTC, dont la
   présence dépend de la ville autant que du pays. */
export const PARTNERS = [
  {
    id: "booking",
    name: "Booking.com",
    kind: "stay",
    countries: "*",
    idEnv: "AFF_BOOKING_AID",
    url: ({ place, dep, ret, adults = 2, kids = 0, aid }) =>
      `https://www.booking.com/searchresults.fr.html?${q({
        ss: place,
        checkin: dep,
        checkout: ret,
        group_adults: adults,
        group_children: kids,
        aid,
      })}`,
  },
  {
    id: "airbnb",
    name: "Airbnb",
    kind: "stay",
    countries: "*",
    idEnv: "AFF_AIRBNB_ID",
    url: ({ place, dep, ret, adults = 2, kids = 0, aid }) =>
      `https://www.airbnb.fr/s/${encodeURIComponent(place || "")}/homes?${q({
        checkin: dep,
        checkout: ret,
        adults,
        children: kids,
        af: aid,
      })}`,
  },
  {
    id: "skyscanner",
    name: "Skyscanner",
    kind: "flight",
    countries: "*",
    idEnv: "AFF_SKYSCANNER_ID",
    url: ({ from, to, dep, ret, adults = 2, aid }) =>
      `https://www.skyscanner.fr/transport/vols/${(from || "").toLowerCase()}/${(to || "").toLowerCase()}/${short(dep)}/${short(ret)}/?${q({
        adults,
        associateid: aid,
      })}`,
  },
  {
    id: "google-flights",
    name: "Google Flights",
    kind: "flight",
    countries: "*",
    url: ({ from, to, dep, ret }) =>
      `https://www.google.com/travel/flights?${q({
        q: `Vols ${from} vers ${to} le ${dep} retour ${ret}`,
      })}`,
  },
  {
    id: "getyourguide",
    name: "GetYourGuide",
    kind: "activity",
    countries: "*",
    idEnv: "AFF_GYG_ID",
    url: ({ place, query, aid }) =>
      `https://www.getyourguide.fr/s/?${q({ q: query || place, partner_id: aid })}`,
  },
  {
    id: "viator",
    name: "Viator",
    kind: "activity",
    countries: "*",
    idEnv: "AFF_VIATOR_ID",
    url: ({ place, query, aid }) =>
      `https://www.viator.com/fr-FR/searchResults/all?${q({ text: query || place, pid: aid })}`,
  },
  {
    id: "discovercars",
    name: "Discover Cars",
    kind: "car",
    countries: "*",
    idEnv: "AFF_DISCOVERCARS_ID",
    url: ({ place, dep, ret, aid }) =>
      `https://www.discovercars.com/fr?${q({ pickup: place, from: dep, to: ret, a_aid: aid })}`,
  },
  {
    id: "rentalcars",
    name: "Rentalcars",
    kind: "car",
    countries: "*",
    idEnv: "AFF_RENTALCARS_ID",
    url: ({ place, aid }) =>
      `https://www.rentalcars.com/fr/search?${q({ location: place, affiliateCode: aid })}`,
  },
  {
    id: "welcomepickups",
    name: "Welcome Pickups",
    kind: "transfer",
    countries: "*",
    idEnv: "AFF_WELCOME_ID",
    url: ({ place, aid }) =>
      `https://www.welcomepickups.com/fr/${encodeURIComponent(slug(place))}/?${q({ ref: aid })}`,
  },
  {
    id: "trainline",
    name: "Trainline",
    kind: "train",
    /* Trainline couvre l'Europe : le proposer au Maroc n'aurait pas de sens. */
    only: ["FR", "GB", "ES", "IT", "DE", "BE", "NL", "CH", "AT", "PT", "IE", "SE", "DK", "CZ", "PL"],
    idEnv: "AFF_TRAINLINE_ID",
    url: ({ from, to, dep, aid }) =>
      `https://www.thetrainline.com/fr/reserver/train?${q({ origin: from, destination: to, outwardDate: dep, ref: aid })}`,
  },
  {
    id: "omio",
    name: "Omio",
    kind: "train",
    only: ["FR", "GB", "ES", "IT", "DE", "BE", "NL", "CH", "AT", "PT", "GR", "PL", "CZ", "US"],
    idEnv: "AFF_OMIO_ID",
    url: ({ from, to, dep, aid }) =>
      `https://www.omio.fr/search?${q({ departure: from, arrival: to, date: dep, partner: aid })}`,
  },
  {
    id: "uber",
    name: "Uber",
    kind: "ride",
    only: ["FR", "GB", "ES", "IT", "DE", "PT", "US", "CA", "MX", "BR", "ZA", "MA", "EG", "JP", "AU", "NZ", "IN", "AE"],
    url: () => "https://m.uber.com/",
  },
  {
    id: "bolt",
    name: "Bolt",
    kind: "ride",
    only: ["FR", "PT", "ES", "PL", "RO", "EE", "LV", "LT", "ZA", "NG", "KE", "MA", "TN", "GH", "SE", "FI"],
    url: () => "https://bolt.eu/fr/",
  },
  {
    id: "grab",
    name: "Grab",
    kind: "ride",
    only: ["MY", "SG", "TH", "ID", "VN", "PH", "KH", "MM"],
    url: () => "https://www.grab.com/",
  },
  {
    id: "airalo",
    name: "Airalo",
    kind: "esim",
    countries: "*",
    idEnv: "AFF_AIRALO_ID",
    url: ({ country, aid }) =>
      `https://www.airalo.com/fr/${encodeURIComponent(slug(country))}-esim?${q({ utm_source: aid })}`,
  },
  {
    id: "holafly",
    name: "Holafly",
    kind: "esim",
    countries: "*",
    idEnv: "AFF_HOLAFLY_ID",
    url: ({ country, aid }) =>
      `https://esim.holafly.com/fr/esim-${encodeURIComponent(slug(country))}/?${q({ ref: aid })}`,
  },
  {
    id: "amazon",
    name: "Amazon",
    kind: "gear",
    countries: "*",
    idEnv: "AFF_AMAZON_TAG",
    url: ({ query, aid }) =>
      `https://www.amazon.fr/s?${q({ k: query, tag: aid })}`,
  },
  {
    id: "decathlon",
    name: "Decathlon",
    kind: "gear",
    countries: "*",
    idEnv: "AFF_DECATHLON_ID",
    url: ({ query, aid }) =>
      `https://www.decathlon.fr/search?${q({ Ntt: query, utm_source: aid })}`,
  },
];

const slug = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** AAMMJJ, la forme attendue par Skyscanner. */
const short = (iso) => (iso ? iso.slice(2).replace(/-/g, "") : "");

const byId = new Map(PARTNERS.map((p) => [p.id, p]));
export const partner = (id) => byId.get(id) || null;

/** Les partenaires d'une catégorie disponibles dans un pays donné. */
export function partnersFor(kind, countryCode) {
  const cc = String(countryCode || "").toUpperCase();
  return PARTNERS.filter((p) => {
    if (p.kind !== kind) return false;
    if (p.only) return cc ? p.only.includes(cc) : false;
    return true;
  });
}

/** L'URL réelle chez le partenaire, identifiant d'affiliation inclus. */
export function deepLink(id, params = {}) {
  const p = partner(id);
  if (!p) return null;
  const aid = p.idEnv ? env(p.idEnv) : "";
  try {
    return p.url({ ...params, aid: aid || undefined });
  } catch {
    return null;
  }
}

/* Le lien que voient les écrans : il passe par notre redirection, qui compte
   le clic puis renvoie chez le partenaire. Aucune URL externe n'est construite
   côté navigateur, donc aucune redirection ouverte n'est possible — le
   serveur ne redirige que vers ce que le registre sait fabriquer. */
export function goLink(id, params = {}, context = {}) {
  const keep = {};
  for (const k of ["place", "from", "to", "dep", "ret", "adults", "kids", "country", "query"]) {
    if (params[k] !== undefined && params[k] !== null && params[k] !== "") keep[k] = params[k];
  }
  return `/api/go?${q({ p: id, ...keep, trip: context.tripId, at: context.slot })}`;
}
