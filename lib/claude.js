/* Génération des voyages.

   Un appel = une phase. Deux raisons : chaque requête reste sous la durée
   maximale d'une fonction serverless, et l'utilisateur voit une progression
   réelle plutôt qu'un écran figé.

   La recherche web est exécutée côté Anthropic : le modèle consulte de vraies
   pages pour les compagnies, les quartiers, les prix et les horaires, et cite
   ses sources. Rien n'est inventé de mémoire.

   La sortie est contrainte par un schéma JSON : la réponse est conforme par
   construction, il n'y a pas de réparation de JSON à faire ici. */

import Anthropic from "@anthropic-ai/sdk";
import { PLAN_SCHEMA, DAYS_SCHEMA, PRACTICAL_SCHEMA } from "./trip-schema";

export const MODEL = process.env.ODYSSEA_MODEL || "claude-opus-5";

let client = null;
function anthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");
  if (!client) client = new Anthropic({ apiKey, maxRetries: 2 });
  return client;
}

export const isConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

const webSearch = (maxUses) => ({
  type: "web_search_20260209",
  name: "web_search",
  max_uses: maxUses,
});

/* Une réponse peut s'arrêter sur `pause_turn` quand l'outil de recherche
   atteint sa limite d'itérations : on relance en renvoyant le tour tel quel,
   le serveur reprend où il s'était arrêté. */
const MAX_RESUMES = 4;

/* Les combinaisons d'options bêta évoluent. Plutôt que d'échouer si l'une
   d'elles est refusée, on retire la plus périphérique et on recommence. */
const DEGRADATIONS = ["fallbacks", "schema"];

const messageOf = (e) =>
  e?.error?.error?.message || e?.error?.message || e?.message || String(e || "");

/* Un 400 recouvre deux choses très différentes : une option que l'API refuse,
   qu'on peut retirer, et un problème de compte, qu'aucune dégradation ne
   réglera. Sans cette distinction, un solde vide déclenchait trois appels au
   lieu d'un. */
const isShapeError = (e) =>
  e?.status === 400 && !/credit balance|billing|api[_ ]key|quota|permission/i.test(messageOf(e));

/** Vrai si réessayer plus tard a une chance d'aboutir sans rien changer au code. */
export function isRetryable(e) {
  const m = messageOf(e);
  if (/credit balance|billing|quota/i.test(m)) return true;
  return e?.status === 429 || e?.status === 529 || (e?.status >= 500 && e?.status < 600);
}

/** L'erreur, dite en français, avec ce qu'il y a à faire. */
export function explain(e) {
  const m = messageOf(e);
  if (/credit balance/i.test(m)) {
    return "Le compte Anthropic n'a plus de crédits. Rechargez-le dans « Plans & Billing » sur console.anthropic.com, puis reprenez la composition : rien n'est perdu.";
  }
  if (/quota|rate.?limit/i.test(m) || e?.status === 429) {
    return "Trop de compositions lancées en même temps. Attendez une minute et reprenez : rien n'est perdu.";
  }
  if (e?.status === 401 || /api[_ ]key|authentication/i.test(m)) {
    return "La clé ANTHROPIC_API_KEY est refusée. Vérifiez-la dans les variables d'environnement, puis redéployez.";
  }
  if (e?.status === 529 || /overloaded/i.test(m)) {
    return "Le modèle est momentanément surchargé. Reprenez la composition dans un instant : rien n'est perdu.";
  }
  if (/déclinée/.test(m)) return m;
  return "La composition s'est interrompue : " + m;
}

async function run({ system, prompt, schema, searchUses, maxTokens }) {
  let dropped = [];
  let lastError = null;

  for (let attempt = 0; attempt <= DEGRADATIONS.length; attempt++) {
    const useFallbacks = !dropped.includes("fallbacks");
    const useSchema = !dropped.includes("schema");
    try {
      const text = await once({
        system,
        prompt,
        schema: useSchema ? schema : null,
        searchUses,
        maxTokens,
        useFallbacks,
      });
      return { text, degraded: dropped };
    } catch (err) {
      lastError = err;
      /* Seules les requêtes refusées pour cause de forme méritent un repli. */
      if (!isShapeError(err) || attempt === DEGRADATIONS.length) throw err;
      dropped = [...dropped, DEGRADATIONS[attempt]];
    }
  }
  throw lastError;
}

async function once({ system, prompt, schema, searchUses, maxTokens, useFallbacks }) {
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    tools: [webSearch(searchUses)],
    messages: [{ role: "user", content: prompt }],
  };
  if (schema) params.output_config.format = { type: "json_schema", schema };

  const betas = [];
  if (useFallbacks) {
    /* Les classificateurs de sûreté peuvent décliner une requête ; le repli
       serveur relance alors le même appel sur un autre modèle. */
    params.fallbacks = "default";
    betas.push("server-side-fallback-2026-07-01");
  }

  let message = await stream({ ...params, betas });

  for (let i = 0; i < MAX_RESUMES && message.stop_reason === "pause_turn"; i++) {
    message = await stream({
      ...params,
      betas,
      messages: [...params.messages, { role: "assistant", content: message.content }],
    });
  }

  if (message.stop_reason === "refusal") {
    const category = message.stop_details?.category;
    throw new Error(
      `La demande a été déclinée${category ? ` (${category})` : ""}. Reformulez la destination ou le style de voyage.`
    );
  }

  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("Réponse vide du modèle.");
  return text;
}

/* On diffuse toujours : ces requêtes ont un `max_tokens` élevé et une
   requête non diffusée dépasserait le délai HTTP du client. */
async function stream(params) {
  const { betas, ...rest } = params;
  const s = betas.length
    ? anthropic().beta.messages.stream({ ...rest, betas })
    : anthropic().messages.stream(rest);
  return s.finalMessage();
}

/** Extrait le JSON d'une réponse, que le schéma ait été appliqué ou non. */
function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Réponse illisible du modèle.");
    return JSON.parse(text.slice(start, end + 1));
  }
}

/* ---------- Le contexte partagé par les deux phases ---------- */

const frDate = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export function nightsOf(brief) {
  const ms = new Date(brief.ret) - new Date(brief.dep);
  return Math.max(1, Math.round(ms / 86400_000));
}

/** Les destinations demandées, sous forme de liste — même quand il n'y en a qu'une. */
export const destsOf = (brief) =>
  brief.dests?.length ? brief.dests : [brief.dest].filter(Boolean);

function briefText(brief) {
  const travellers = [
    `${brief.adults} adulte${brief.adults > 1 ? "s" : ""}`,
    brief.kids ? `${brief.kids} enfant${brief.kids > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" et ");

  const dests = destsOf(brief);
  const destLine =
    dests.length > 1
      ? `Destinations demandées, dans cet ordre : ${dests.join(" → ")}`
      : `Destination souhaitée : ${dests[0]}`;

  /* Ce qu'Odyssea doit organiser, et ce qui est déjà réservé : sans cette
     distinction le modèle propose des vols à qui en a déjà. */
  const scope = Object.entries({ vol: "les vols", hotel: "l'hébergement", act: "les activités" })
    .filter(([k]) => brief.include?.[k] !== false)
    .map(([k, v]) => (brief.booked?.[k] ? `${v} (déjà réservés — à ne pas reproposer)` : v))
    .join(", ");

  const imposed = Object.entries(brief.split || {})
    .filter(([, n]) => n > 0)
    .map(([d, n]) => `${d} : ${n} nuit${n > 1 ? "s" : ""}`)
    .join(", ");

  return [
    destLine,
    `Départ depuis : ${brief.from}`,
    `Dates : du ${frDate(brief.dep)} au ${frDate(brief.ret)} (${nightsOf(brief)} nuits)`,
    imposed ? `Nuits imposées par le voyageur : ${imposed} — le reste est à répartir librement` : null,
    `Voyageurs : ${travellers} — ${brief.group}`,
    brief.occasion ? `Occasion : ${brief.occasion}` : null,
    scope ? `Odyssea organise : ${scope}` : null,
    brief.stylePri ? `Style principal : ${brief.stylePri}` : null,
    brief.styleSec ? `Style secondaire : ${brief.styleSec}` : null,
    brief.pace ? `Rythme voulu : ${brief.pace}` : null,
    brief.lodging ? `Hébergement préféré : ${brief.lodging}` : null,
    brief.ground ? `Déplacement sur place : ${brief.ground}` : null,
    brief.budget ? `Budget visé : ${brief.budget}` : null,
    brief.food?.length ? `Alimentation : ${brief.food.join(", ")}` : null,
    brief.allerg ? `Allergies : ${brief.allerg}` : null,
    brief.care?.length ? `Contraintes à respecter à chaque journée : ${brief.care.join(", ")}` : null,
    brief.prefs?.length ? `Préférences : ${brief.prefs.join(", ")}` : null,
    brief.wish ? `Ce que le voyageur ne veut pas manquer : ${brief.wish}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

const HOUSE_RULES = `Tu composes de vrais voyages pour Odyssea. Tu écris en français, à la deuxième personne du pluriel.

Règles absolues :
- Cherche sur le web avant d'affirmer. Compagnies aériennes, quartiers, établissements, musées, tables, prix, horaires : tout doit correspondre à ce qui existe réellement aujourd'hui. N'invente jamais un nom de lieu, un prix ou un horaire.
- Un prix que tu n'as pas vu sur une page est une estimation : annonce-le comme tel.
- Les distances et les enchaînements doivent tenir debout. Compte les trajets. Ne place pas deux lieux distants de deux heures à trente minutes d'intervalle.
- Respecte scrupuleusement les restrictions alimentaires déclarées, sans jamais en inventer d'autres.
- Reste neutre et accueillant : aucune recommandation fondée sur une appartenance religieuse, politique ou communautaire.
- Adapte le rythme au groupe : un voyage avec de jeunes enfants n'est pas un voyage entre amis.
- Écris court. Une phrase qui dit quelque chose vaut mieux que trois qui tournent autour.`;

/* ---------- Phase 1 ---------- */

export async function generatePlan(brief) {
  const dests = destsOf(brief);
  const multi =
    dests.length > 1
      ? `\nCe voyage enchaîne plusieurs destinations. Passe par toutes celles qui sont demandées, dans un ordre qui minimise les trajets — corrige l'ordre donné s'il fait faire un détour, et dis-le dans le résumé. Chaque destination demandée doit apparaître dans les étapes. Vérifie que la liaison entre deux escales existe vraiment et compte son temps.`
      : "";

  const prompt = `Compose le plan de ce voyage.

${briefText(brief)}

Recherche d'abord : la saison réelle sur ces dates, les compagnies qui desservent cet axe, les quartiers où loger, les ordres de prix constatés. Puis découpe le séjour en étapes cohérentes avec le temps disponible — mieux vaut deux étapes vécues que cinq traversées.${multi}

Si une destination demandée est vague (« du soleil », « la montagne »), choisis la destination précise la plus pertinente pour ces dates et ce profil, et dis-le dans le résumé.`;

  const { text, degraded } = await run({
    system: HOUSE_RULES,
    prompt,
    schema: PLAN_SCHEMA,
    searchUses: 10,
    maxTokens: 24000,
  });
  return { plan: parseJson(text), degraded };
}

/* ---------- Phase 2 ---------- */

export async function generateDays(brief, plan, fromDay, toDay) {
  const dates = [];
  for (let n = fromDay; n <= toDay; n++) {
    const d = new Date(brief.dep + "T12:00:00");
    d.setDate(d.getDate() + (n - 1));
    dates.push(`Jour ${n} — ${d.toISOString().slice(0, 10)} (${frDate(d.toISOString().slice(0, 10))})`);
  }

  const prompt = `Voici le plan déjà arrêté pour ce voyage :

${briefText(brief)}

Étapes retenues :
${plan.stops.map((s) => `- ${s.name} (${s.region}) — ${s.nights} nuits — ${s.why}`).join("\n")}

Hébergement retenu :
${plan.stays.map((s) => `- ${s.stopName} : quartier ${s.area}`).join("\n")}

Rédige maintenant le détail, heure par heure, de ces journées et de celles-là seulement :
${dates.join("\n")}

Le jour 1 commence par le trajet depuis ${brief.from}. Le dernier jour du séjour (jour ${nightsOf(brief) + 1}) se termine par le retour. Entre les deux, respecte les étapes et leurs nuits.

Cherche les noms réels : musées, marchés, tables, points de vue, horaires d'ouverture et jours de fermeture. Vérifie qu'un lieu que tu places un lundi n'est pas fermé le lundi.`;

  const { text, degraded } = await run({
    system: HOUSE_RULES,
    prompt,
    schema: DAYS_SCHEMA,
    searchUses: 6,
    maxTokens: 24000,
  });
  const parsed = parseJson(text);
  return { days: parsed.days || [], degraded };
}

/* ---------- Phase 3 ---------- */

export async function generatePractical(brief, plan, days) {
  const programme = days
    .map((d) => `Jour ${d.n} (${d.stopName}) : ${d.items.map((i) => i.title).join(" · ")}`)
    .join("\n");

  const prompt = `Voici le voyage tel qu'il est composé :

${briefText(brief)}

Étapes :
${plan.stops.map((s) => `- ${s.name} — ${s.nights} nuits`).join("\n")}

Programme jour par jour :
${programme}

Produis maintenant le volet pratique : comment se déplacer sur place, les démarches à faire avant de partir, ce qu'il faut emporter, et surtout les pièges réels de cet itinéraire précis.

Pour les pièges, relis le programme et cherche ce qui coince vraiment : une marge trop courte avant un vol, deux journées de marche consécutives, un musée fermé le jour où tu l'as placé, un trajet sous-estimé. Chiffre-les. Si l'itinéraire est sain, dis-le plutôt que d'inventer un problème.

Les démarches administratives concernent un voyageur de nationalité française.`;

  const { text, degraded } = await run({
    system: HOUSE_RULES,
    prompt,
    schema: PRACTICAL_SCHEMA,
    searchUses: 6,
    maxTokens: 16000,
  });
  return { practical: parseJson(text), degraded };
}
