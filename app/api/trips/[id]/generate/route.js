/* Génération, une phase par requête, diffusée pendant qu'elle se fait.

   Découper en phases tient chaque appel sous la durée maximale d'une fonction
   serverless, et permet de reprendre une génération interrompue sans
   recommencer ce qui est déjà écrit.

   Diffuser en NDJSON règle l'autre moitié du problème : l'avancement affiché
   était quantifié par phase, donc figé pendant les deux ou trois minutes que
   dure une recherche. Il est maintenant calculé ici, à partir de ce que le
   flux du modèle rapporte réellement — les recherches parties et les tokens
   écrits. Rien n'est simulé, et le calcul reste au même endroit que les faits
   qui le nourrissent. */

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
  EXPECTED_OUTPUT,
} from "../../../../../lib/claude";
import { PROFILE } from "../../../../../lib/profile";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Journées produites par appel : le réglage le fixe. */
const BATCH = PROFILE.batch;

/* Poids de chaque phase dans l'avancement total. Les journées pèsent le plus
   parce qu'elles prennent le plus de temps — c'est ce que l'utilisateur
   attend, pas une répartition symbolique. */
const WEIGHT = { plan: 0.24, days: 0.56, practical: 0.2 };

const clamp = (n) => Math.max(0, Math.min(1, n));

/* L'avancement d'une phase : d'abord ses recherches, puis ce qu'elle écrit.
   Les deux sont mesurés ; la pondération dit seulement lequel domine quand. */
function phaseProgress({ searches, maxSearches, output, expected }) {
  const found = maxSearches ? clamp(searches / maxSearches) : 1;
  const written = expected ? clamp(output / expected) : 0;
  return clamp(found * 0.45 + written * 0.55);
}

export async function POST(_request, { params }) {
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (o) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(o) + "\n"));
        } catch {
          closed = true;
        }
      };
      const finish = () => {
        if (closed) return;
        closed = true;
        controller.close();
      };

      try {
        if (!isConfigured()) {
          send({
            t: "error",
            message: "Génération indisponible : ANTHROPIC_API_KEY n'est pas configurée.",
            retryable: false,
          });
          return finish();
        }

        const trip = await getTrip(params.id).catch(() => null);
        if (!trip) {
          send({ t: "error", message: "Voyage introuvable.", retryable: false });
          return finish();
        }
        if (trip.userId) {
          const user = await currentUser();
          if (user?.id !== trip.userId) {
            send({ t: "error", message: "Voyage introuvable.", retryable: false });
            return finish();
          }
        }

        const total = dayCount(trip.brief);
        const written = new Set(trip.days.map((d) => d.n));
        let from = 1;
        while (from <= total && written.has(from)) from++;

        const batches = Math.ceil(total / BATCH);
        const batchIndex = Math.min(batches - 1, Math.floor((from - 1) / BATCH));

        /* La part déjà acquise avant cette phase : c'est elle qui empêche
           l'avancement de repartir de zéro à chaque requête. */
        const base = !trip.plan
          ? 0
          : from <= total
            ? WEIGHT.plan + (batchIndex / batches) * WEIGHT.days
            : WEIGHT.plan + WEIGHT.days;

        const phase = !trip.plan ? "plan" : from <= total ? "days" : "practical";
        const span = WEIGHT[phase] * (phase === "days" ? 1 / batches : 1);

        send({ t: "phase", phase, base, span, written: trip.days.length, total });

        /* Le flux du modèle nourrit l'avancement en direct. */
        let searches = 0;
        let output = 0;
        const maxSearches = PROFILE.searches[phase];
        const expected =
          phase === "days"
            ? EXPECTED_OUTPUT.days * Math.min(BATCH, total - from + 1)
            : EXPECTED_OUTPUT[phase];

        const onEvent = (e) => {
          if (e.t === "search") {
            searches += 1;
            send({ t: "search", query: e.query, n: searches, max: maxSearches });
          } else if (e.t === "tokens") {
            output = e.output;
          }
          const value = base + span * phaseProgress({ searches, maxSearches, output, expected });
          send({ t: "progress", value: clamp(value) });
        };

        if (phase === "plan") {
          const { plan, degraded, usage } = await generatePlan(trip.brief, onEvent);
          const spent = foldUsage(trip.usage, "plan", usage);
          await savePlan(params.id, plan, spent);
          send({
            t: "phase-done",
            phase: "plan",
            value: WEIGHT.plan,
            degraded,
            usage: spent?.total || null,
            destination: plan?.destination?.name || null,
            stops: (plan?.stops || []).map((s) => s.name),
          });
        } else if (phase === "days") {
          const to = Math.min(total, from + BATCH - 1);
          const { days, degraded, usage } = await generateDays(
            trip.brief,
            trip.plan,
            from,
            to,
            onEvent
          );
          const spent = foldUsage(trip.usage, "days", usage);
          const result = await appendDays(params.id, days, total, spent);
          send({
            t: "phase-done",
            phase: "days",
            value: base + span,
            written: result.days.length,
            total,
            range: [from, to],
            degraded,
            usage: spent?.total || null,
          });
        } else if (!trip.practical) {
          const { practical, degraded, usage } = await generatePractical(
            trip.brief,
            trip.plan,
            trip.days,
            onEvent
          );
          const spent = foldUsage(trip.usage, "practical", usage);
          await savePractical(params.id, practical, spent);
          send({
            t: "phase-done",
            phase: "practical",
            value: 1,
            degraded,
            usage: spent?.total || null,
          });
        }

        /* Le voyage est-il complet ? On le relit plutôt que de le déduire :
           c'est la base qui fait foi, pas notre trace en mémoire. */
        const after = await getTrip(params.id).catch(() => null);
        const complete = Boolean(after?.plan && after.days.length >= total && after.practical);
        send({ t: complete ? "done" : "continue", value: complete ? 1 : undefined });
        return finish();
      } catch (e) {
        const message = explain(e);
        const retryable = isRetryable(e);
        /* Un solde vide ou un modèle surchargé n'est pas un voyage raté : on
           le laisse en l'état pour qu'il reprenne là où il s'est arrêté. */
        if (!retryable) await failTrip(params.id, message).catch(() => {});
        send({ t: "error", message, retryable });
        return finish();
      }
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
      /* Sans cela, un proxy peut retenir le flux et rendre la diffusion
         inutile — c'est exactement ce qu'on cherche à éviter. */
      "x-accel-buffering": "no",
    },
  });
}
