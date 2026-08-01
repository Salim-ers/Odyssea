/* Lecture et suppression d'un voyage. */

import { currentUser } from "../../../../lib/auth";
import { getTrip, deleteTrip, dayCount } from "../../../../lib/trips";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Un voyage sans propriétaire est lisible par qui détient son identifiant —
   c'est ce qui permet de composer un voyage avant de créer son compte. Dès
   qu'il est rattaché à un compte, il devient privé. */
async function readable(trip) {
  if (!trip) return false;
  if (!trip.userId) return true;
  const user = await currentUser();
  return user?.id === trip.userId;
}

export async function GET(_request, { params }) {
  try {
    const trip = await getTrip(params.id);
    if (!(await readable(trip))) {
      return Response.json({ error: "Voyage introuvable." }, { status: 404 });
    }
    return Response.json({ trip: { ...trip, totalDays: dayCount(trip.brief) } });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Connectez-vous." }, { status: 401 });
  try {
    await deleteTrip(params.id, user.id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
