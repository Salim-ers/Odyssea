/* Inscription, connexion, déconnexion, session courante. */

import {
  createUser,
  authenticate,
  startSession,
  endSession,
  currentUser,
  validateCredentials,
} from "../../../lib/auth";
import { attachToUser } from "../../../lib/trips";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ user: await currentUser() });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête illisible." }, { status: 400 });
  }

  const action = String(body.action || "");

  if (action === "logout") {
    await endSession();
    return Response.json({ ok: true, user: null });
  }

  if (action !== "signup" && action !== "login") {
    return Response.json({ error: "Action inconnue." }, { status: 400 });
  }

  const errors = validateCredentials({
    email: body.email,
    password: body.password,
    ...(action === "signup" ? { name: body.name } : {}),
  });
  if (Object.keys(errors).length) return Response.json({ errors }, { status: 400 });

  try {
    const result =
      action === "signup"
        ? await createUser({ email: body.email, password: body.password, name: body.name })
        : await authenticate({ email: body.email, password: body.password });

    if (result.error) return Response.json({ error: result.error }, { status: 400 });

    await startSession(result.user.id);

    /* Un voyage composé avant l'inscription suit son auteur. */
    if (body.claimTripId) {
      await attachToUser(String(body.claimTripId), result.user.id).catch(() => {});
    }

    return Response.json({ ok: true, user: result.user });
  } catch (e) {
    return Response.json(
      { error: "Comptes indisponibles : " + e.message },
      { status: 500 }
    );
  }
}
