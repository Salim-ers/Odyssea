/* Météo réelle pour les étapes d'un voyage. */

import { getTrip } from "../../../lib/trips";
import { currentUser } from "../../../lib/auth";
import { weatherFor } from "../../../lib/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("trip");
  if (!id) return Response.json({ error: "Voyage manquant." }, { status: 400 });

  let trip;
  try {
    trip = await getTrip(id);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
  if (!trip?.plan) return Response.json({ error: "Voyage introuvable." }, { status: 404 });
  if (trip.userId) {
    const user = await currentUser();
    if (user?.id !== trip.userId) {
      return Response.json({ error: "Voyage introuvable." }, { status: 404 });
    }
  }

  const { dep, ret } = trip.brief;
  const stops = (trip.plan.stops || []).filter(
    (s) => Number.isFinite(s.lat) && Number.isFinite(s.lon)
  );
  if (!stops.length) return Response.json({ stops: [] });

  try {
    const results = await Promise.all(
      stops.map(async (s) => ({
        name: s.name,
        days: await weatherFor({ lat: s.lat, lon: s.lon, start: dep, end: ret }),
      }))
    );
    return Response.json({ stops: results });
  } catch (e) {
    return Response.json({ error: "Météo indisponible : " + e.message }, { status: 502 });
  }
}
