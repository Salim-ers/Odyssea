/* Stockage des voyages.

   Un voyage se construit en plusieurs appels : on écrit le plan d'abord, puis
   les journées par lots. Chaque écriture est indépendante, donc une
   génération interrompue reprend là où elle s'est arrêtée au lieu de tout
   recommencer. */

import { randomUUID } from "node:crypto";
import { query, one, ensureSchema, now } from "./db";
import { nightsOf } from "./claude";

const parse = (v, fallback) => {
  if (v == null) return fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

const hydrate = (row) =>
  row && {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    brief: parse(row.brief, {}),
    plan: parse(row.plan, null),
    days: parse(row.days, []),
    practical: parse(row.practical, null),
    error: row.error || null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };

/** Nombre total de journées, retour compris. */
export const dayCount = (brief) => nightsOf(brief) + 1;

export async function createTrip({ userId, brief }) {
  await ensureSchema();
  const id = randomUUID();
  const t = now();
  await query(
    `INSERT INTO trips (id, user_id, status, brief, plan, days, error, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NULL, $5, NULL, $6, $7)`,
    [id, userId || null, "pending", JSON.stringify(brief), JSON.stringify([]), t, t]
  );
  return id;
}

export async function getTrip(id) {
  await ensureSchema();
  return hydrate(await one(`SELECT * FROM trips WHERE id = $1`, [id]));
}

export async function listTrips(userId) {
  await ensureSchema();
  const rows = await query(
    `SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(hydrate);
}

export async function savePlan(id, plan) {
  await ensureSchema();
  await query(`UPDATE trips SET plan = $1, status = $2, error = NULL, updated_at = $3 WHERE id = $4`, [
    JSON.stringify(plan),
    "planning",
    now(),
    id,
  ]);
}

/** Ajoute un lot de journées. Le voyage n'est prêt qu'après le volet pratique. */
export async function appendDays(id, batch, total) {
  await ensureSchema();
  const trip = await getTrip(id);
  if (!trip) return null;

  const byNumber = new Map(trip.days.map((d) => [d.n, d]));
  for (const day of batch) byNumber.set(day.n, day);
  const days = [...byNumber.values()].sort((a, b) => a.n - b.n);

  await query(`UPDATE trips SET days = $1, status = $2, error = NULL, updated_at = $3 WHERE id = $4`, [
    JSON.stringify(days),
    "building",
    now(),
    id,
  ]);
  return { days, complete: days.length >= total };
}

export async function savePractical(id, practical) {
  await ensureSchema();
  await query(
    `UPDATE trips SET practical = $1, status = $2, error = NULL, updated_at = $3 WHERE id = $4`,
    [JSON.stringify(practical), "ready", now(), id]
  );
}

export async function failTrip(id, message) {
  await ensureSchema();
  await query(`UPDATE trips SET status = $1, error = $2, updated_at = $3 WHERE id = $4`, [
    "failed",
    String(message).slice(0, 500),
    now(),
    id,
  ]);
}

export async function attachToUser(id, userId) {
  await ensureSchema();
  await query(`UPDATE trips SET user_id = $1, updated_at = $2 WHERE id = $3 AND user_id IS NULL`, [
    userId,
    now(),
    id,
  ]);
}

export async function deleteTrip(id, userId) {
  await ensureSchema();
  await query(`DELETE FROM trips WHERE id = $1 AND user_id = $2`, [id, userId]);
}

/* ---------- Vitrine de l'accueil ---------- */

const SHOWCASE_TTL = 7 * 86400_000;

/* La vitrine prend le voyage explicitement désigné ; à défaut, le dernier
   composé. L'accueil se remplit donc dès la première composition, sans
   qu'il y ait quoi que ce soit à administrer. */
export async function getShowcase(slug) {
  await ensureSchema();
  const row = await one(`SELECT trip_id, refreshed_at FROM showcase WHERE slug = $1`, [slug]);
  if (row) {
    const trip = await getTrip(row.trip_id);
    if (trip?.status === "ready") {
      return { trip, stale: now() - Number(row.refreshed_at) > SHOWCASE_TTL };
    }
  }
  const latest = await one(
    `SELECT * FROM trips WHERE status = 'ready' ORDER BY created_at DESC LIMIT 1`
  );
  if (!latest) return null;
  return { trip: await getTrip(latest.id), stale: false };
}

export async function setShowcase(slug, tripId) {
  await ensureSchema();
  await query(
    `INSERT INTO showcase (slug, trip_id, refreshed_at) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET trip_id = $2, refreshed_at = $3`,
    [slug, tripId, now()]
  );
}
