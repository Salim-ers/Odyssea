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
  foldUsage,
} from "../../../../../lib/trips";
import {
  generatePlan,
  generateDays,
  generatePractical,
  isConfigured,
  explain,
  isRetryable,
} from "../../../../../lib/claude";
import { PROFILE } from "../../../../../lib/profile";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Journées produites par appel : assez pour avancer vite, assez peu pour tenir
    sous la durée maximale d une fonction serverless. Le réglage le fixe. */
const BATCH = PROFILE.batch;

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
      const { plan, degraded, usage } = await generatePlan(trip.brief);
      const spent = foldUsage(trip.usage, "plan", usage);
      await savePlan(params.id, plan, spent);
      return Response.json({
        phase: "plan",
        done: false,
        progress: { written: 0, total },
        degraded,
        usage: spent?.total || null,
      });
    }

    /* Phase 2 — les journées, par lots, dans l'ordre. */
    const written = new Set(trip.days.map((d) => d.n));
    let from = 1;
    while (from <= total && written.has(from)) from++;

    if (from <= total) {
      const to = Math.min(total, from + BATCH - 1);
      const { days, degraded, usage } = await generateDays(trip.brief, trip.plan, from, to);
      const spent = foldUsage(trip.usage, "days", usage);
      const result = await appendDays(params.id, days, total, spent);
      return Response.json({
        phase: "days",
        done: false,
        progress: { written: result.days.length, total },
        range: [from, to],
        degraded,
        usage: spent?.total || null,
      });
    }

    /* Phase 3 — le volet pratique, une fois le programme connu. */
    if (!trip.practical) {
      const { practical, degraded, usage } = await generatePractical(trip.brief, trip.plan, trip.days);
      const spent = foldUsage(trip.usage, "practical", usage);
      await savePractical(params.id, practical, spent);
      return Response.json({
        phase: "practical",
        done: true,
        progress: { written: total, total },
        degraded,
        usage: spent?.total || null,
      });
    }

    return Response.json({
      phase: "done",
      done: true,
      progress: { written: total, total },
      usage: trip.usage?.total || null,
    });
  } catch (e) {
    const message = explain(e);
    const retryable = isRetryable(e);
    /* Un solde vide ou un modèle surchargé n'est pas un voyage raté : on le
       laisse en l'état pour qu'il puisse reprendre là où il s'est arrêté.
       Le marquer « échoué » condamnait tout le travail déjà écrit. */
    if (!retryable) await failTrip(params.id, message).catch(() => {});
    return Response.json({ error: message, retryable }, { status: retryable ? 503 : 502 });
  }
}
