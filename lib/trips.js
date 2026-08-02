/* Stockage des voyages.

   Un voyage se construit en plusieurs appels : on écrit le plan d'abord, puis
   les journées par lots. Chaque écriture est indépendante, donc une
   génération interrompue reprend là où elle s'est arrêtée au lieu de tout
   recommencer. */

import { randomUUID } from "node:crypto";
import { query, one, ensureSchema, now } from "./db";
import { nightsOf, addUsage } from "./claude";

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
    /* Ce que la composition a réellement consommé, phase par phase. Absent
       des voyages composés avant la mise en place du relevé. */
    usage: parse(row.usage_json, null),
    error: row.error || null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };

/* Le relevé s'accumule : chaque phase ajoute le sien au total du voyage, et
   garde son propre détail pour qu'on sache laquelle coûte quoi. */
export function foldUsage(previous, phase, add) {
  if (!add) return previous || null;
  const phases = { ...(previous?.phases || {}) };
  phases[phase] = addUsage(phases[phase], add);
  return { total: addUsage(previous?.total, add), phases };
}

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

export async function savePlan(id, plan, usage) {
  await ensureSchema();
  await query(
    `UPDATE trips SET plan = $1, usage_json = $2, status = $3, error = NULL, updated_at = $4 WHERE id = $5`,
    [JSON.stringify(plan), usage ? JSON.stringify(usage) : null, "planning", now(), id]
  );
}

/** Ajoute un lot de journées. Le voyage n'est prêt qu'après le volet pratique. */
export async function appendDays(id, batch, total, usage) {
  await ensureSchema();
  const trip = await getTrip(id);
  if (!trip) return null;

  const byNumber = new Map(trip.days.map((d) => [d.n, d]));
  for (const day of batch) byNumber.set(day.n, day);
  const days = [...byNumber.values()].sort((a, b) => a.n - b.n);

  await query(
    `UPDATE trips SET days = $1, usage_json = $2, status = $3, error = NULL, updated_at = $4 WHERE id = $5`,
    [JSON.stringify(days), usage ? JSON.stringify(usage) : null, "building", now(), id]
  );
  return { days, complete: days.length >= total };
}

/* La préparation s écrit en deux passes : la seconde complète la première
   au lieu de la remplacer. Le voyage n est « prêt » qu une fois les deux là. */
export async function savePractical(id, part, usage, ready) {
  await ensureSchema();
  const before = await getTrip(id);
  const practical = { ...(before?.practical || {}), ...part };
  await query(
    `UPDATE trips SET practical = $1, usage_json = $2, status = $3, error = NULL, updated_at = $4 WHERE id = $5`,
    [JSON.stringify(practical), usage ? JSON.stringify(usage) : null, ready ? "ready" : "building", now(), id]
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

/* La vitrine ne montre qu'un voyage explicitement désigné.

   Elle prenait auparavant le dernier composé, ce qui exposait sur l'accueil
   le premier essai venu — y compris un brouillon. C'est une page d'accueil :
   ce qu'elle montre se choisit. Tant que rien n'est désigné, l'exemple tient
   sa place. */
export async function getShowcase(slug) {
  await ensureSchema();
  const row = await one(`SELECT trip_id, refreshed_at FROM showcase WHERE slug = $1`, [slug]);
  if (!row) return null;
  const trip = await getTrip(row.trip_id);
  if (trip?.status !== "ready") return null;
  return { trip, stale: now() - Number(row.refreshed_at) > SHOWCASE_TTL };
}

export async function setShowcase(slug, tripId) {
  await ensureSchema();
  await query(
    `INSERT INTO showcase (slug, trip_id, refreshed_at) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET trip_id = $2, refreshed_at = $3`,
    [slug, tripId, now()]
  );
}
