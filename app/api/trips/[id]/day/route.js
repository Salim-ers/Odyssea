/* Refaire une journée.

   Une journée qui ne convient pas ne doit pas obliger à tout recomposer : on
   ne réécrit qu'elle, en donnant au modèle la raison du rejet et l'interdiction
   de reprendre ce qu'il avait proposé.

   Un seul appel, sur une seule journée : c'est court, et la reprise ne remet
   en cause ni le plan ni le reste du programme. */

import { currentUser } from "../../../../../lib/auth";
import { getTrip, appendDays, dayCount, foldUsage } from "../../../../../lib/trips";
import { generateDays, isConfigured, explain, isRetryable } from "../../../../../lib/claude";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_REASON = 400;

export async function POST(request, { params }) {
  if (!isConfigured()) {
    return Response.json(
      { error: "Génération indisponible : ANTHROPIC_API_KEY n'est pas configurée." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  const trip = await getTrip(params.id).catch(() => null);
  if (!trip) return Response.json({ error: "Voyage introuvable." }, { status: 404 });
  if (trip.userId) {
    const user = await currentUser();
    if (user?.id !== trip.userId) {
      return Response.json({ error: "Voyage introuvable." }, { status: 404 });
    }
  }
  if (!trip.plan) {
    return Response.json({ error: "Ce voyage n'a pas encore de plan." }, { status: 409 });
  }

  const total = dayCount(trip.brief);
  const n = parseInt(body?.n, 10);
  if (!Number.isFinite(n) || n < 1 || n > total) {
    return Response.json({ error: "Journée inconnue." }, { status: 400 });
  }

  const reason = String(body?.reason || "").trim().slice(0, MAX_REASON);

  try {
    const { days, usage } = await generateDays(
      trip.brief,
      trip.plan,
      n,
      n,
      undefined,
      reason || undefined
    );
    const day = days.find((d) => d.n === n) || days[0];
    if (!day) return Response.json({ error: "Le modèle n'a rien renvoyé." }, { status: 502 });

    /* On force le numéro : le modèle pourrait le renuméroter et écraser une
       autre journée. */
    const fixed = { ...day, n };
    const spent = foldUsage(trip.usage, "days", usage);
    await appendDays(params.id, [fixed], total, spent);
    return Response.json({ day: fixed });
  } catch (e) {
    return Response.json(
      { error: explain(e), retryable: isRetryable(e) },
      { status: isRetryable(e) ? 503 : 502 }
    );
  }
}
