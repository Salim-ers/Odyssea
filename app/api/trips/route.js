/* Création et liste des voyages. */

import { currentUser } from "../../../lib/auth";
import { createTrip, listTrips, dayCount } from "../../../lib/trips";
import { isConfigured } from "../../../lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRIEF_LIMITS = { dest: 120, from: 120, allerg: 300, wish: 300 };
const MAX_STOPS = 5;

function cleanBrief(raw) {
  const s = (v, max) => String(v ?? "").trim().slice(0, max);
  const list = (v) =>
    Array.isArray(v) ? v.slice(0, 12).map((x) => String(x).slice(0, 60)) : [];
  const int = (v, min, max, dflt) => {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? dflt : Math.max(min, Math.min(max, n));
  };
  const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : null);

  const dep = date(raw.dep);
  const ret = date(raw.ret);

  /* Une seule destination reste une liste d'une entrée : le reste du code
     n'a ainsi qu'une forme à connaître. */
  const dests = [
    ...new Set(
      (Array.isArray(raw.dests) ? raw.dests : [raw.dest])
        .map((d) => s(d, BRIEF_LIMITS.dest))
        .filter(Boolean)
    ),
  ].slice(0, MAX_STOPS);

  if (!dests.length) return { error: "Indiquez une destination." };
  if (!dep || !ret) return { error: "Indiquez des dates valides." };
  if (new Date(ret) <= new Date(dep)) return { error: "Le retour doit suivre le départ." };

  const nights = Math.round((new Date(ret) - new Date(dep)) / 86400_000);
  if (nights > 30) return { error: "Odyssea compose des voyages jusqu'à 30 nuits." };
  if (nights < dests.length) {
    return { error: `${dests.length} escales demandent au moins ${dests.length} nuits.` };
  }

  /* Les nuits imposées par escale, si elles ont été précisées. Une valeur qui
     déborde du séjour est ignorée plutôt que de contraindre l'impossible. */
  const split = {};
  for (const d of dests) {
    const n = int(raw.split?.[d], 0, nights, 0);
    if (n > 0) split[d] = n;
  }
  const imposed = Object.values(split).reduce((a, b) => a + b, 0);

  return {
    brief: {
      dests,
      /* Conservé pour l'affichage court : titres de page, listes, métadonnées. */
      dest: dests.join(" · "),
      from: s(raw.from, BRIEF_LIMITS.from) || "Paris — CDG",
      dep,
      ret,
      split: imposed <= nights ? split : {},
      adults: int(raw.adults, 1, 12, 2),
      kids: int(raw.kids, 0, 8, 0),
      group: s(raw.group, 20) || "Couple",
      occasion: s(raw.occasion, 60) || null,
      include: {
        vol: raw.include?.vol !== false,
        hotel: raw.include?.hotel !== false,
        act: raw.include?.act !== false,
      },
      booked: {
        vol: raw.booked?.vol === "oui",
        hotel: raw.booked?.hotel === "oui",
        act: raw.booked?.act === "oui",
      },
      stylePri: s(raw.stylePri, 60) || null,
      styleSec: s(raw.styleSec, 60) || null,
      pace: s(raw.pace, 30) || null,
      lodging: s(raw.lodging, 40) || null,
      ground: s(raw.ground, 40) || null,
      budget: s(raw.budget, 30) || null,
      food: list(raw.food),
      allerg: s(raw.allerg, BRIEF_LIMITS.allerg) || null,
      care: list(raw.care),
      prefs: list(raw.prefs),
      wish: s(raw.wish, BRIEF_LIMITS.wish) || null,
    },
  };
}

export async function POST(request) {
  if (!isConfigured()) {
    return Response.json(
      { error: "Génération indisponible : ANTHROPIC_API_KEY n'est pas configurée." },
      { status: 503 }
    );
  }
  let raw;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  const { brief, error } = cleanBrief(raw);
  if (error) return Response.json({ error }, { status: 400 });

  try {
    const user = await currentUser();
    const id = await createTrip({ userId: user?.id, brief });
    return Response.json({ id, totalDays: dayCount(brief) }, { status: 201 });
  } catch (e) {
    return Response.json({ error: "Base de données indisponible : " + e.message }, { status: 500 });
  }
}

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ trips: [] });
  try {
    const trips = await listTrips(user.id);
    return Response.json({
      trips: trips.map((t) => ({
        id: t.id,
        status: t.status,
        dest: t.brief.dest,
        dep: t.brief.dep,
        ret: t.brief.ret,
        title: t.plan?.destination?.name || t.brief.dest,
        tagline: t.plan?.destination?.tagline || null,
        createdAt: t.createdAt,
      })),
    });
  } catch (e) {
    return Response.json({ trips: [], error: e.message });
  }
}
