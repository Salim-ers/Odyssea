/* Comptes et sessions.

   Mots de passe : scrypt (dérivation lente, paramètres OWASP) avec un sel
   propre à chaque compte ; comparaison à temps constant. Aucun mot de passe,
   ni aucun de ses dérivés réversibles, n'est stocké.

   Sessions : jeton aléatoire de 256 bits posé dans un cookie httpOnly,
   inaccessible au JavaScript de la page, donc insensible au vol par XSS.
   Le jeton est stocké haché : une fuite de la base ne permet pas d'usurper
   une session en cours. */

import { randomBytes, scrypt, timingSafeEqual, createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { query, one, ensureSchema, now } from "./db";

const COOKIE = "odyssea_session";
const SESSION_DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

const derive = (password, salt) =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT.keylen, SCRYPT, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function verifyPassword(password, stored) {
  const [scheme, saltB64, keyB64] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const hashToken = (t) => createHash("sha256").update(t).digest("hex");

/* ---------- Validation ---------- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateCredentials({ email, password, name }) {
  const errors = {};
  if (!EMAIL_RE.test(String(email || "").trim())) errors.email = "Adresse e-mail invalide.";
  if (String(password || "").length < 10)
    errors.password = "Le mot de passe doit faire au moins 10 caractères.";
  if (name !== undefined && String(name || "").trim().length < 2)
    errors.name = "Indiquez un prénom ou un nom.";
  return errors;
}

/* ---------- Comptes ---------- */

export async function createUser({ email, password, name }) {
  await ensureSchema();
  const normalized = String(email).trim().toLowerCase();
  const existing = await one(`SELECT id FROM users WHERE email = $1`, [normalized]);
  if (existing) return { error: "Un compte existe déjà avec cette adresse." };

  const user = {
    id: randomUUID(),
    email: normalized,
    name: String(name).trim(),
    password_hash: await hashPassword(password),
    created_at: now(),
  };
  await query(
    `INSERT INTO users (id, email, name, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)`,
    [user.id, user.email, user.name, user.password_hash, user.created_at]
  );
  return { user: { id: user.id, email: user.email, name: user.name } };
}

export async function authenticate({ email, password }) {
  await ensureSchema();
  const normalized = String(email).trim().toLowerCase();
  const row = await one(`SELECT id, email, name, password_hash FROM users WHERE email = $1`, [
    normalized,
  ]);
  /* On dérive même sans compte trouvé : le temps de réponse ne révèle pas
     si l'adresse existe. */
  const ok = await verifyPassword(password, row?.password_hash || "scrypt$AA==$AA==");
  if (!row || !ok) return { error: "Adresse e-mail ou mot de passe incorrect." };
  return { user: { id: row.id, email: row.email, name: row.name } };
}

/* ---------- Sessions ---------- */

export async function startSession(userId) {
  await ensureSchema();
  const token = randomBytes(32).toString("base64url");
  const expires = now() + SESSION_DAYS * 86400_000;
  await query(
    `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)`,
    [hashToken(token), userId, now(), expires]
  );
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  return token;
}

export async function endSession() {
  const token = cookies().get(COOKIE)?.value;
  if (token) {
    await ensureSchema();
    await query(`DELETE FROM sessions WHERE token = $1`, [hashToken(token)]);
  }
  cookies().delete(COOKIE);
}

/** L'utilisateur connecté, ou null. Purge les sessions expirées au passage. */
export async function currentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    await ensureSchema();
    const row = await one(
      `SELECT u.id, u.email, u.name, s.expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = $1`,
      [hashToken(token)]
    );
    if (!row) return null;
    if (Number(row.expires_at) < now()) {
      await query(`DELETE FROM sessions WHERE token = $1`, [hashToken(token)]);
      return null;
    }
    return { id: row.id, email: row.email, name: row.name };
  } catch {
    /* Base indisponible : on ne casse pas la page, l'utilisateur est
       simplement considéré comme déconnecté. */
    return null;
  }
}
