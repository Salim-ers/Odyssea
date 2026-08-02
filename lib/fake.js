/* Le mode démonstration.

   Composer un voyage coûte quelques dollars. Mettre au point une interface en
   demande des dizaines. Ce module produit donc un voyage complet, à la forme
   exacte de ce que le modèle renvoie, sans appeler l'API — de quoi travailler
   l'affichage, les enchaînements et l'écran d'attente sans rien dépenser.

   Trois garde-fous, parce qu'un voyage inventé n'a rien à faire devant un
   vrai utilisateur :

   — il ne s'active que si ODYSSEA_FAKE est posé ;
   — il refuse de s'activer sur un déploiement de production, quoi qu'on
     mette dans la variable ;
   — tout ce qu'il produit porte `demo: true`, et l'interface l'affiche.

   Les coordonnées, elles, sont vraies : elles viennent du géocodage
   d'Open-Meteo, gratuit et sans clé. Une carte fausse ne servirait à rien. */

import { destsOf, nightsOf } from "./claude";

const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";

/** Le mode est-il actif ? Jamais en production, quelle que soit la variable. */
export function isFake() {
  if (!process.env.ODYSSEA_FAKE) return false;
  if (process.env.VERCEL_ENV === "production") return false;
  return true;
}

/* « fast » enchaîne tout ; sinon on respire, pour pouvoir regarder l'écran
   d'attente se remplir comme il le fera en vrai. */
const FAST = () => String(process.env.ODYSSEA_FAKE).toLowerCase() === "fast";
const pause = (ms) => new Promise((r) => setTimeout(r, FAST() ? 40 : ms));

/* Le faux flux : des recherches et des tokens, aux mêmes formes que ceux du
   modèle, pour que l'écran d'attente se comporte exactement pareil. */
async function play(onEvent, queries, tokens) {
  let out = 0;
  for (const q of queries) {
    await pause(700 + Math.random() * 700);
    onEvent?.({ t: "search", query: q });
    out += Math.round(tokens / (queries.length * 3));
    onEvent?.({ t: "tokens", output: out });
  }
  for (let i = 0; i < 4; i++) {
    await pause(600);
    out += Math.round((tokens - out) / 2);
    onEvent?.({ t: "tokens", output: out });
  }
}

/** Coordonnées réelles d'un lieu, ou null. */
async function locate(name) {
  try {
    const r = await fetch(
      `${GEOCODE}?name=${encodeURIComponent(name)}&count=1&language=fr&format=json`
    );
    const hit = (await r.json())?.results?.[0];
    return hit
      ? { lat: hit.latitude, lon: hit.longitude, country: hit.country, cc: hit.country_code }
      : null;
  } catch {
    return null;
  }
}

const fr = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/** Répartit les nuits entre les escales, en respectant ce qui est imposé. */
function spread(dests, nights, imposed) {
  const out = dests.map((d) => imposed?.[d] || 0);
  let left = nights - out.reduce((a, b) => a + b, 0);
  for (let i = 0; left > 0; i = (i + 1) % dests.length) {
    out[i] += 1;
    left -= 1;
  }
  return out;
}

/* ---------- Phase 1 ---------- */

export async function fakePlan(brief, onEvent) {
  const dests = destsOf(brief);
  const nights = nightsOf(brief);

  await play(
    onEvent,
    [
      `vols ${brief.from} ${dests[0]} ${fr(brief.dep)}`,
      `météo ${dests[0]} à cette période`,
      `où loger à ${dests[0]} quartiers`,
      ...(dests[1] ? [`liaison ${dests[0]} ${dests[1]} durée`] : []),
      `budget voyage ${dests[0]} par jour`,
    ],
    3600
  );

  const placed = await Promise.all(dests.map(locate));
  const parts = spread(dests, nights, brief.split);

  const stops = dests.map((name, i) => ({
    name,
    region: placed[i]?.country || "—",
    nights: parts[i],
    why: `Démonstration : ${name} tient ${parts[i]} nuit${parts[i] > 1 ? "s" : ""} dans ce format.`,
    lat: placed[i]?.lat ?? 0,
    lon: placed[i]?.lon ?? 0,
  }));

  return {
    demo: true,
    destination: {
      name: dests.join(" · "),
      country: placed[0]?.country || dests[0],
      countryCode: (placed[0]?.cc || "").toUpperCase(),
      tagline: `Voyage de démonstration — ${dests.join(" et ")}`,
      summary:
        "Ce voyage n'a pas été composé par le modèle : il sert à mettre au point l'affichage sans consommer de crédits. Les lieux et les prix ne veulent rien dire ; seules les coordonnées de la carte sont réelles.",
    },
    season: {
      verdict: "Période correcte",
      detail: `Du ${fr(brief.dep)} au ${fr(brief.ret)}, soit ${nights} nuits. Valeur de démonstration.`,
      score: 72,
    },
    stops,
    flights: {
      summary: `Trajet de démonstration depuis ${brief.from}.`,
      options: [1, 2, 3].map((n) => ({
        airline: `Compagnie ${n}`,
        route: `${brief.from} → ${dests[0]}`,
        duration: `${2 + n} h ${n}0`,
        stops: n === 1 ? "Direct" : `${n - 1} escale`,
        priceEur: 150 + n * 60,
        note: "Valeur de démonstration, sans rapport avec un tarif réel.",
      })),
      searchUrl: "https://www.google.com/travel/flights",
    },
    stays: stops.map((s) => ({
      stopName: s.name,
      area: `Quartier central, ${s.name}`,
      why: "Quartier de démonstration.",
      priceEurPerNight: 120,
      examples: ["Adresse A", "Adresse B"],
      searchUrl: "https://www.booking.com",
    })),
    budget: {
      lines: [
        { label: "Vols aller-retour", amountEur: 420, confidence: "estimé" },
        { label: `Hébergement · ${nights} nuits`, amountEur: 120 * nights, confidence: "estimé" },
        { label: "Transports sur place", amountEur: 90, confidence: "estimé" },
        { label: "Repas", amountEur: 60 * nights, confidence: "estimé" },
        { label: "Visites et activités", amountEur: 140, confidence: "estimé" },
      ],
      totalEur: 420 + 120 * nights + 90 + 60 * nights + 140,
    },
    advice: [
      { title: "Mode démonstration", detail: "Aucun appel au modèle n'a été fait pour ce voyage." },
      { title: "Ce qui est vrai", detail: "Les coordonnées des escales, donc la carte et les distances." },
    ],
    sources: [{ title: "Aucune source : voyage de démonstration", url: "https://example.org" }],
  };
}

/* ---------- Phase 2 ---------- */

const KINDS = ["transfer", "sight", "food", "activity", "rest"];

export async function fakeDays(brief, plan, fromDay, toDay, onEvent) {
  await play(
    onEvent,
    [`programme ${plan.stops[0]?.name} jour ${fromDay}`, `horaires ouverture ${plan.stops[0]?.name}`],
    700 * (toDay - fromDay + 1)
  );

  const days = [];
  for (let n = fromDay; n <= toDay; n++) {
    const d = new Date(brief.dep + "T12:00:00");
    d.setDate(d.getDate() + (n - 1));
    /* L'escale du jour suit la répartition des nuits, comme en vrai. */
    let acc = 0;
    let stop = plan.stops[plan.stops.length - 1];
    for (const s of plan.stops) {
      acc += s.nights;
      if (n - 1 <= acc) {
        stop = s;
        break;
      }
    }
    days.push({
      n,
      date: d.toISOString().slice(0, 10),
      stopName: n === 1 ? "Transport" : stop.name,
      title: `Journée ${n} — démonstration`,
      items: Array.from({ length: 5 }, (_, i) => ({
        time: ["09:00", "11:00", "13:00", "16:00", "19:30"][i],
        kind: KINDS[(n + i) % KINDS.length],
        title: `Étape ${i + 1} de la journée ${n}`,
        detail: "Contenu de démonstration : ni le lieu ni l'horaire ne sont réels.",
        durationMin: [60, 90, 75, 120, 105][i],
        costEur: [0, 12, 25, 8, 30][i],
        why: i === 1 ? "Placée ici pour montrer le bloc « pourquoi »." : "",
        bookingUrl: i === 4 ? "https://example.org" : "",
      })),
    });
  }
  return days;
}

/* ---------- Phase 3, en deux passes ---------- */

export async function fakePrepA(brief, plan, onEvent) {
  await play(onEvent, ["formalités entrée", "vaccins recommandés", "eSIM couverture"], 2800);
  const pays = plan.destination.country;
  return {
    formalities: {
      summary: `Démonstration : formalités pour ${pays}.`,
      documents: [
        { label: "Pièce d'identité", level: "obligatoire", detail: "Exemple de document exigé.", validity: "Valide au retour", who: "Tous", url: "https://www.diplomatie.gouv.fr" },
        { label: "Assurance voyage", level: "recommandé", detail: "Exemple de document conseillé.", validity: "", who: "Chacun", url: "" },
        { label: "Permis international", level: "selon le cas", detail: "Exemple de document conditionnel.", validity: "", who: "Le conducteur", url: "" },
      ],
      sources: [{ title: "Aucune source : démonstration", url: "https://example.org" }],
    },
    health: {
      summary: "Démonstration : aucun risque particulier.",
      vaccines: [
        { name: "Calendrier vaccinal", level: "recommandé", detail: "Exemple d'entrée." },
        { name: "Autre vaccin", level: "selon le cas", detail: "Exemple d'entrée conditionnelle." },
      ],
      kit: ["Crème solaire", "Pansements", "Antalgique", "Anti-nauséeux"],
      emergency: [
        { label: "Urgences", number: "112" },
        { label: "Police", number: "17" },
        { label: "Ambassade de France", number: "+00 000 000 000" },
      ],
      facilities: [{ name: "Hôpital de démonstration", city: plan.stops[0]?.name || "—", detail: "Exemple d'établissement." }],
      safety: [
        { title: "Point de vigilance", detail: "Exemple de conseil de sécurité." },
        { title: "Second point", detail: "Exemple de second conseil." },
      ],
    },
    connectivity: {
      summary: "Démonstration : couverture correcte.",
      coverage: "Exemple de description de couverture réseau.",
      esim: [
        { provider: "Fournisseur A", plan: "5 Go · 30 jours", priceEur: 14, detail: "Exemple d'offre." },
        { provider: "Fournisseur B", plan: "Illimité · 7 jours", priceEur: 26, detail: "Exemple d'offre." },
      ],
      plug: { types: "C et E", voltage: "230 V · 50 Hz", adapter: "Exemple d'indication d'adaptateur." },
    },
  };
}

export async function fakePrepB(brief, plan, onEvent) {
  await play(onEvent, ["taux de change", "que mettre dans sa valise"], 3000);
  const nights = nightsOf(brief);
  return {
    money: {
      currency: { name: "Monnaie locale", code: "XXX", rate: "Valeur de démonstration." },
      payment: [
        { title: "Carte bancaire", detail: "Exemple d'indication de paiement." },
        { title: "Sans contact", detail: "Exemple de seconde indication." },
      ],
      cash: [
        { title: "Retrait", detail: "Exemple d'indication sur les espèces." },
        { title: "Petites coupures", detail: "Exemple de seconde indication." },
      ],
      daily: { frugalEur: 40, comfortEur: 70, generousEur: 120, note: "Valeurs de démonstration, hors hébergement." },
    },
    packing: [
      { group: "Vêtements", items: [
        { label: "Veste légère", why: "Exemple de raison liée à la météo.", essential: true },
        { label: "Tenue confortable", why: "Exemple de seconde raison.", essential: false },
      ] },
      { group: "Chaussures", items: [
        { label: "Chaussures de marche", why: "Exemple de raison liée au programme.", essential: true },
      ] },
      { group: "Tech", items: [
        { label: "Batterie externe", why: "Exemple de raison liée à la durée des journées.", essential: true },
        { label: "Adaptateur", why: "Exemple de raison liée aux prises.", essential: false },
      ] },
      { group: "Documents", items: [
        { label: "Pièce d'identité", why: "Exemple de raison administrative.", essential: true },
      ] },
    ],
    bookings: [
      { label: "Vols aller-retour", kind: "flight", when: "dès maintenant", why: "Exemple de justification.", place: plan.stops[0]?.name || "" },
      { label: `Hébergement · ${nights} nuits`, kind: "stay", when: "dès maintenant", why: "Exemple de justification.", place: plan.stops[0]?.name || "" },
      { label: "Transfert aéroport", kind: "transfer", when: "un mois avant", why: "Exemple de justification.", place: plan.stops[0]?.name || "" },
      { label: "Activité principale", kind: "activity", when: "un mois avant", why: "Exemple de justification.", place: plan.stops[0]?.name || "" },
      { label: "Carte eSIM", kind: "esim", when: "sur place", why: "Exemple de justification.", place: "" },
    ],
    transport: {
      verdict: "Démonstration : transports en commun.",
      mode: "Transports en commun",
      priceEur: 8,
      apps: ["Application A", "Application B"],
    },
    watchouts: [
      { severity: "modéré", title: "Piège de démonstration", detail: "Exemple de difficulté chiffrée.", fix: "Exemple de correctif." },
      { severity: "fort", title: "Second piège", detail: "Exemple de seconde difficulté.", fix: "Exemple de second correctif." },
    ],
  };
}

/** Un relevé nul : le mode démonstration ne coûte rien, et le dit. */
export const FAKE_USAGE = {
  calls: 0,
  input: 0,
  output: 0,
  cacheWrite: 0,
  cacheRead: 0,
  searches: 0,
  costUsd: 0,
};
