/* La sortie vers un partenaire.

   Tous les liens commerciaux passent par ici. Trois raisons :

   — le clic est compté, avec son partenaire, son emplacement et le voyage
     d'où il part, ce qui est la seule façon de savoir ce qui fonctionne ;
   — l'identifiant d'affiliation reste côté serveur, donc hors du HTML ;
   — la destination n'est jamais fournie par l'appelant : elle est reconstruite
     à partir du registre. Une redirection ouverte est donc impossible par
     construction, et non par filtrage. */

import { randomUUID } from "node:crypto";
import { deepLink, partner } from "../../../lib/partners";
import { query, ensureSchema, now } from "../../../lib/db";
import { currentUser } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const home = (request) => new URL("/", request.url);

export async function GET(request) {
  const p = request.nextUrl.searchParams;
  const id = p.get("p");

  if (!partner(id)) return Response.redirect(home(request), 302);

  const target = deepLink(id, {
    place: p.get("place"),
    from: p.get("from"),
    to: p.get("to"),
    dep: p.get("dep"),
    ret: p.get("ret"),
    adults: p.get("adults"),
    kids: p.get("kids"),
    country: p.get("country"),
    query: p.get("query"),
  });
  if (!target) return Response.redirect(home(request), 302);

  /* Le comptage ne doit jamais retenir l'utilisateur : s'il échoue, on part
     quand même. Un clic perdu vaut mieux qu'une réservation perdue. */
  try {
    await ensureSchema();
    const user = await currentUser().catch(() => null);
    await query(
      `INSERT INTO clicks (id, partner, slot, trip_id, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), id, p.get("at") || null, p.get("trip") || null, user?.id || null, now()]
    );
  } catch {
    /* Volontairement muet. */
  }

  return Response.redirect(target, 302);
}
