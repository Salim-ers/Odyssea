/* Accès aux données.

   Deux moteurs, une seule écriture SQL :
   — en production, Postgres (Neon serverless, en HTTP : fonctionne sur Vercel
     sans pool de connexions) dès que DATABASE_URL est défini ;
   — en développement, SQLite (node:sqlite, intégré à Node ≥ 22) dans
     .data/odyssea.db, pour que l'application tourne sans rien provisionner.

   Le SQL est écrit une fois, dans le sous-ensemble commun aux deux moteurs :
   identifiants et JSON en TEXT, dates en INTEGER (millisecondes epoch). Les
   marqueurs $1, $2… sont traduits en ? pour SQLite. */

import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
export const isPostgres = Boolean(url);

let driver = null;

/* ---------- Postgres ---------- */
function postgresDriver() {
  const sql = neon(url);
  return {
    async query(text, params) {
      const rows = await sql.query(text, params);
      return rows;
    },
  };
}

/* ---------- SQLite (développement) ---------- */
async function sqliteDriver() {
  const { DatabaseSync } = await import("node:sqlite");
  const fs = await import("node:fs");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "odyssea.db"));
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

  /* $1, $2… → ? ; ON CONFLICT et RETURNING existent dans les deux moteurs. */
  const translate = (text) => text.replace(/\$(\d+)/g, "?");

  return {
    async query(text, params = []) {
      const stmt = db.prepare(translate(text));
      const args = params.map((v) =>
        v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v
      );
      if (/^\s*(select|with)/i.test(text) || /returning/i.test(text)) {
        return stmt.all(...args);
      }
      stmt.run(...args);
      return [];
    },
  };
}

function get() {
  if (!driver) driver = isPostgres ? Promise.resolve(postgresDriver()) : sqliteDriver();
  return driver;
}

/** Exécute une requête et renvoie toutes les lignes. */
export async function query(text, params = []) {
  const d = await get();
  return d.query(text, params);
}

/** Exécute une requête et renvoie la première ligne, ou null. */
export async function one(text, params = []) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}

/* ---------- Schéma ---------- */

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     password_hash TEXT NOT NULL,
     created_at BIGINT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     created_at BIGINT NOT NULL,
     expires_at BIGINT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS trips (
     id TEXT PRIMARY KEY,
     user_id TEXT,
     status TEXT NOT NULL,
     brief TEXT NOT NULL,
     plan TEXT,
     days TEXT,
     practical TEXT,
     error TEXT,
     created_at BIGINT NOT NULL,
     updated_at BIGINT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS trips_user ON trips (user_id, created_at)`,
  /* Vitrine de l'accueil : un vrai voyage généré, mis en cache et réutilisé. */
  `CREATE TABLE IF NOT EXISTS showcase (
     slug TEXT PRIMARY KEY,
     trip_id TEXT NOT NULL,
     refreshed_at BIGINT NOT NULL
   )`,
];

let ready = null;

/** Crée les tables si besoin. Idempotent, appelé avant chaque accès. */
export function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      for (const stmt of SCHEMA) await query(stmt);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export const now = () => Date.now();
