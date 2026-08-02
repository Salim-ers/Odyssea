/* Accès aux données.

   Deux moteurs, une seule écriture SQL :
   — en production, Postgres (Neon serverless, en HTTP : fonctionne sur Vercel
     sans pool de connexions) dès que DATABASE_URL est défini ;
   — en développement, SQLite (node:sqlite, intégré à Node ≥ 22) dans
     .data/odyssea.db, pour que l'application tourne sans rien provisionner.

   Le SQL est écrit une fois, dans le sous-ensemble commun aux deux moteurs :
   identifiants et JSON en TEXT, dates en INTEGER (millisecondes epoch). Les
   marqueurs $1, $2… sont traduits en ? pour SQLite. */

import postgres from "postgres";

const url = process.env.DATABASE_URL;
export const isPostgres = Boolean(url);

let driver = null;

/* ---------- Postgres ---------- */
function postgresDriver() {
  /* Réglages dictés par l'exécution en fonction serverless :

     — `max: 1` : chaque instance de fonction ouvre une seule connexion. En
       ouvrir davantage épuiserait le pool côté base sans rien accélérer,
       puisqu'une instance ne traite qu'une requête à la fois.
     — `prepare: false` : obligatoire derrière un pooler en mode transaction
       (Supabase port 6543, PgBouncer). Ces poolers ne conservent pas les
       requêtes préparées entre deux transactions ; les laisser actives fait
       échouer une requête sur deux.
     — `ssl: "require"` : Supabase, Neon et la plupart des hébergeurs
       n'acceptent que le chiffré. */
  const sql = postgres(url, {
    max: 1,
    prepare: false,
    ssl: /sslmode=disable/.test(url) ? false : "require",
    idle_timeout: 20,
    connect_timeout: 15,
  });
  return {
    async query(text, params = []) {
      try {
        const rows = await sql.unsafe(text, params);
        return Array.from(rows);
      } catch (e) {
        throw new Error(explain(e));
      }
    },
  };
}

/* Les erreurs de connexion Postgres sont opaques. Celle-ci revient tellement
   souvent qu'elle mérite d'être nommée : l'hôte `db.<ref>.supabase.co` est la
   connexion directe de Supabase, qui ne résout qu'en IPv6. Les fonctions
   serverless n'ayant pas de sortie IPv6, la résolution échoue avant même
   d'ouvrir une connexion. */
function explain(e) {
  const code = e?.code || "";
  const direct = /^db\.[a-z0-9]+\.supabase\.co$/.test(e?.hostname || "");
  if (direct && (code === "ENOTFOUND" || code === "ENETUNREACH" || code === "ETIMEDOUT")) {
    return (
      "DATABASE_URL pointe vers la connexion directe de Supabase (db.…supabase.co), " +
      "qui n'est joignable qu'en IPv6 — inaccessible depuis une fonction serverless. " +
      "Prenez la chaîne « Transaction pooler » : hôte aws-….pooler.supabase.com, port 6543, " +
      "utilisateur postgres.<référence-du-projet>."
    );
  }
  if (code === "ENOTFOUND") return `Hôte introuvable (${e.hostname || "?"}). Vérifiez DATABASE_URL.`;
  if (code === "28P01") return "Mot de passe refusé par la base. Vérifiez la partie mot de passe de DATABASE_URL.";
  if (code === "3D000") return "Base de données inexistante. Vérifiez le nom en fin de DATABASE_URL.";
  return e?.message || String(e);
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
  /* Les sorties vers un partenaire. Le strict nécessaire pour savoir ce qui
     fonctionne : lequel, à quel endroit du parcours, depuis quel voyage. */
  `CREATE TABLE IF NOT EXISTS clicks (
     id TEXT PRIMARY KEY,
     partner TEXT NOT NULL,
     slot TEXT,
     trip_id TEXT,
     user_id TEXT,
     created_at BIGINT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS clicks_partner ON clicks (partner, created_at)`,
  /* Vitrine de l'accueil : un vrai voyage généré, mis en cache et réutilisé. */
  `CREATE TABLE IF NOT EXISTS showcase (
     slug TEXT PRIMARY KEY,
     trip_id TEXT NOT NULL,
     refreshed_at BIGINT NOT NULL
   )`,
];

/* Colonnes ajoutées après coup, sur des bases qui existent déjà.

   SQLite ne connaît pas ADD COLUMN IF NOT EXISTS : on tente, et on n'ignore
   que le seul échec attendu — la colonne est déjà là. Toute autre erreur
   remonte, sinon une migration ratée passerait inaperçue. */
const MIGRATIONS = [`ALTER TABLE trips ADD COLUMN usage_json TEXT`];

const alreadyApplied = (e) =>
  /duplicate column|already exists/i.test(String(e?.message || e));

let ready = null;

/** Crée les tables si besoin. Idempotent, appelé avant chaque accès. */
export function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      for (const stmt of SCHEMA) await query(stmt);
      for (const stmt of MIGRATIONS) {
        try {
          await query(stmt);
        } catch (e) {
          if (!alreadyApplied(e)) throw e;
        }
      }
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export const now = () => Date.now();
