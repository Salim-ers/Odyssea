/* Génération, une phase par requête.

   Découper ainsi tient chaque appel sous la durée maximale d'une fonction
   serverless, et permet de reprendre une génération interrompue sans
   recommencer ce qui est déjà écrit. */

import { currentUser } from "../../../../../lib/auth";
import {
  getTrip,
  savePlan,
  appendDays,
  savePractical,
  failTrip,
  dayCount,
} from "../../../../../lib/trips";
import {
  generatePlan,
  generateDays,
  generatePractical,
  isConfigured,
} from "../../../../../lib/claude";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Journées produites par appel : assez pour avancer vite, assez peu pour tenir. */
const BATCH = 4;

export async function POST(request, { params }) {
  if (!isConfigured()) {
    return Response.json(
      { error: "Génération indisponible : ANTHROPIC_API_KEY n'est pas configurée." },
      { status: 503 }
    );
  }

  const trip = await getTrip(params.id).catch(() => null);
  if (!trip) return Response.json({ error: "Voyage introuvable." }, { status: 404 });
  if (trip.userId) {
    const user = await currentUser();
    if (user?.id !== trip.userId) {
      return Response.json({ error: "Voyage introuvable." }, { status: 404 });
    }
  }

  const total = dayCount(trip.brief);

  try {
    /* Phase 1 — le plan. */
    if (!trip.plan) {
      const { plan, degraded } = await generatePlan(trip.brief);
      await savePlan(params.id, plan);
      return Response.json({
        phase: "plan",
        done: false,
        progress: { written: 0, total },
        degraded,
      });
    }

    /* Phase 2 — les journées, par lots, dans l'ordre. */
    const written = new Set(trip.days.map((d) => d.n));
    let from = 1;
    while (from <= total && written.has(from)) from++;

    if (from <= total) {
      const to = Math.min(total, from + BATCH - 1);
      const { days, degraded } = await generateDays(trip.brief, trip.plan, from, to);
      const result = await appendDays(params.id, days, total);
      return Response.json({
        phase: "days",
        done: false,
        progress: { written: result.days.length, total },
        range: [from, to],
        degraded,
      });
    }

    /* Phase 3 — le volet pratique, une fois le programme connu. */
    if (!trip.practical) {
      const { practical, degraded } = await generatePractical(trip.brief, trip.plan, trip.days);
      await savePractical(params.id, practical);
      return Response.json({
        phase: "practical",
        done: true,
        progress: { written: total, total },
        degraded,
      });
    }

    return Response.json({ phase: "done", done: true, progress: { written: total, total } });
  } catch (e) {
    await failTrip(params.id, e.message).catch(() => {});
    const status = e?.status === 429 ? 429 : 502;
    return Response.json({ error: e.message }, { status });
  }
}
