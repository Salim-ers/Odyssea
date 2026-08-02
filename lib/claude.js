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
import { PLAN_SCHEMA, DAYS_SCHEMA, PREP_A_SCHEMA, PREP_B_SCHEMA } from "./trip-schema";
import { PROFILE } from "./profile";

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

/* ---------- Ce que chaque composition consomme ----------

   Le coût n'est pas estimé : il est lu dans `usage`, que l'API renvoie avec
   chaque réponse, et additionné sur tous les appels d'un voyage — reprises et
   tours d'outils compris.

   Les tarifs sont ici pour être vérifiables et modifiables sans toucher au
   reste, en dollars par million de tokens. Ceux d'Opus 5 au 1ᵉʳ août 2026 ;
   une variable d'environnement les remplace si la grille change. */
const num = (v, dflt) => (Number.isFinite(Number(v)) ? Number(v) : dflt);

export const PRICING = {
  input: num(process.env.ODYSSEA_PRICE_IN, 5),
  output: num(process.env.ODYSSEA_PRICE_OUT, 25),
  /* Écrire dans le cache coûte 1,25 × l'entrée, le relire 0,1 ×. */
  cacheWrite: num(process.env.ODYSSEA_PRICE_CACHE_WRITE, 6.25),
  cacheRead: num(process.env.ODYSSEA_PRICE_CACHE_READ, 0.5),
  /* Recherche web, en dollars pour mille requêtes. */
  searchPerThousand: num(process.env.ODYSSEA_PRICE_SEARCH, 10),
};

export const EMPTY_USAGE = {
  calls: 0,
  input: 0,
  output: 0,
  cacheWrite: 0,
  cacheRead: 0,
  searches: 0,
  costUsd: 0,
};

/** Le relevé d'un appel, ramené à notre forme. */
function readUsage(u) {
  if (!u) return { ...EMPTY_USAGE, calls: 1 };
  return {
    calls: 1,
    input: u.input_tokens || 0,
    output: u.output_tokens || 0,
    cacheWrite: u.cache_creation_input_tokens || 0,
    cacheRead: u.cache_read_input_tokens || 0,
    searches: u.server_tool_use?.web_search_requests || 0,
    costUsd: 0,
  };
}

/** Le coût d'un relevé, en dollars. */
export function costOf(u) {
  if (!u) return 0;
  return (
    ((u.input || 0) * PRICING.input +
      (u.output || 0) * PRICING.output +
      (u.cacheWrite || 0) * PRICING.cacheWrite +
      (u.cacheRead || 0) * PRICING.cacheRead) /
      1e6 +
    ((u.searches || 0) * PRICING.searchPerThousand) / 1000
  );
}

/** Additionne deux relevés, et recalcule le coût du total. */
export function addUsage(a, b) {
  const sum = {
    calls: (a?.calls || 0) + (b?.calls || 0),
    input: (a?.input || 0) + (b?.input || 0),
    output: (a?.output || 0) + (b?.output || 0),
    cacheWrite: (a?.cacheWrite || 0) + (b?.cacheWrite || 0),
    cacheRead: (a?.cacheRead || 0) + (b?.cacheRead || 0),
    searches: (a?.searches || 0) + (b?.searches || 0),
  };
  return { ...sum, costUsd: costOf(sum) };
}

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

async function run({ system, prompt, schema, searchUses, maxTokens, onEvent }) {
  let dropped = [];
  let lastError = null;

  for (let attempt = 0; attempt <= DEGRADATIONS.length; attempt++) {
    const useFallbacks = !dropped.includes("fallbacks");
    const useSchema = !dropped.includes("schema");
    try {
      const { text, usage } = await once({
        system,
        prompt,
        schema: useSchema ? schema : null,
        searchUses,
        maxTokens,
        useFallbacks,
        onEvent,
      });
      return { text, degraded: dropped, usage };
    } catch (err) {
      lastError = err;
      /* Seules les requêtes refusées pour cause de forme méritent un repli. */
      if (!isShapeError(err) || attempt === DEGRADATIONS.length) throw err;
      dropped = [...dropped, DEGRADATIONS[attempt]];
    }
  }
  throw lastError;
}

async function once({ system, prompt, schema, searchUses, maxTokens, useFallbacks, onEvent }) {
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    thinking: { type: "adaptive" },
    output_config: { effort: PROFILE.effort },
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

  /* Un tour peut en appeler plusieurs : chacun est facturé, donc chacun est
     compté. */
  let usage = { ...EMPTY_USAGE };
  let message = await stream({ ...params, betas }, onEvent);
  usage = addUsage(usage, readUsage(message.usage));

  for (let i = 0; i < MAX_RESUMES && message.stop_reason === "pause_turn"; i++) {
    message = await stream(
      {
        ...params,
        betas,
        messages: [...params.messages, { role: "assistant", content: message.content }],
      },
      onEvent
    );
    usage = addUsage(usage, readUsage(message.usage));
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
  return { text, usage };
}

/* On diffuse toujours : ces requêtes ont un `max_tokens` élevé et une
   requête non diffusée dépasserait le délai HTTP du client.

   Puisqu'on diffuse, on écoute : le flux dit à quel moment une recherche part,
   sur quelle requête, et combien de tokens ont été écrits. C'est de là que
   vient l'avancement réel affiché à l'utilisateur — il n'y a rien à simuler. */
async function stream(params, onEvent) {
  const { betas, ...rest } = params;
  const s = betas.length
    ? anthropic().beta.messages.stream({ ...rest, betas })
    : anthropic().messages.stream(rest);
  if (onEvent) watch(s, onEvent);
  return s.finalMessage();
}

function watch(s, onEvent) {
  /* La requête de recherche arrive par fragments de JSON : on l'assemble, et
     on ne la lit qu'une fois le bloc terminé. */
  let partial = null;
  s.on("streamEvent", (e) => {
    try {
      if (e.type === "content_block_start" && e.content_block?.type === "server_tool_use") {
        partial = "";
      } else if (e.type === "content_block_delta" && e.delta?.type === "input_json_delta") {
        if (partial !== null) partial += e.delta.partial_json || "";
      } else if (e.type === "content_block_stop" && partial !== null) {
        const m = partial.match(/"query"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (m) onEvent({ t: "search", query: JSON.parse(`"${m[1]}"`) });
        partial = null;
      } else if (e.type === "message_delta" && e.usage?.output_tokens != null) {
        onEvent({ t: "tokens", output: e.usage.output_tokens });
      }
    } catch {
      /* Le suivi ne doit jamais faire échouer une composition. */
    }
  });
}

/* Ordre de grandeur de ce que chaque phase écrit. Sert d'échelle à
   l'avancement : ce n'est pas une promesse, seulement un dénominateur. */
export const EXPECTED_OUTPUT = { plan: 3800, days: 750, prepA: 3000, prepB: 3200 };

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

export async function generatePlan(brief, onEvent) {
  const dests = destsOf(brief);
  const multi =
    dests.length > 1
      ? `\nCe voyage enchaîne plusieurs destinations. Passe par toutes celles qui sont demandées, dans un ordre qui minimise les trajets — corrige l'ordre donné s'il fait faire un détour, et dis-le dans le résumé. Chaque destination demandée doit apparaître dans les étapes. Vérifie que la liaison entre deux escales existe vraiment et compte son temps.`
      : "";

  const prompt = `Compose le plan de ce voyage.

${briefText(brief)}

Recherche d'abord : la saison réelle sur ces dates, les compagnies qui desservent cet axe, les quartiers où loger, les ordres de prix constatés. Puis découpe le séjour en étapes cohérentes avec le temps disponible — mieux vaut deux étapes vécues que cinq traversées.${multi}

Si une destination demandée est vague (« du soleil », « la montagne »), choisis la destination précise la plus pertinente pour ces dates et ce profil, et dis-le dans le résumé.`;

  const { text, degraded, usage } = await run({
    system: HOUSE_RULES,
    prompt,
    schema: PLAN_SCHEMA,
    searchUses: PROFILE.searches.plan,
    maxTokens: 24000,
    onEvent,
  });
  return { plan: parseJson(text), degraded, usage };
}

/* ---------- Phase 2 ---------- */

/* Ce que la phase 1 a déjà consulté.

   Sans cette liste, chaque phase repart de zéro et refait les mêmes
   recherches — les plus coûteuses, puisque leurs résultats gonflent ensuite
   tout le contexte. La rappeler ne réduit en rien la vérification : elle la
   dirige vers ce qui manque. */
const knownSources = (plan) =>
  plan?.sources?.length
    ? `\nPages déjà consultées à l'étape précédente, dont le contenu est acquis :\n${plan.sources
        .map((s) => `- ${s.title} (${s.url})`)
        .join("\n")}\nNe les recherche pas de nouveau. Ne cherche que ce qu'elles ne couvrent pas.\n`
    : "";

export async function generateDays(brief, plan, fromDay, toDay, onEvent) {
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

${knownSources(plan)}
Rédige maintenant le détail, heure par heure, de ces journées et de celles-là seulement :
${dates.join("\n")}

Le jour 1 commence par le trajet depuis ${brief.from}. Le dernier jour du séjour (jour ${nightsOf(brief) + 1}) se termine par le retour. Entre les deux, respecte les étapes et leurs nuits.

Cherche les noms réels : musées, marchés, tables, points de vue, horaires d'ouverture et jours de fermeture. Vérifie qu'un lieu que tu places un lundi n'est pas fermé le lundi.`;

  const { text, degraded, usage } = await run({
    system: HOUSE_RULES,
    prompt,
    schema: DAYS_SCHEMA,
    searchUses: PROFILE.searches.days,
    maxTokens: 24000,
    onEvent,
  });
  const parsed = parseJson(text);
  return { days: parsed.days || [], degraded, usage };
}

/* ---------- Phase 3, en deux passes ----------

   Les six volets de la préparation ne tiennent pas dans un seul appel : la
   requête dépasse la durée maximale d'une fonction serverless et se fait
   couper avant d'avoir rien écrit. Pire, chaque reprise la relançait en
   entier, donc elle ne pouvait jamais aboutir et consommait à chaque essai.

   Deux passes, écrites l'une après l'autre et fusionnées. La coupure suit le
   sens : d'abord ce qui conditionne le départ, ensuite ce qui se prépare. */

function prepContext(brief, plan, days) {
  const programme = days
    .map((d) => `Jour ${d.n} (${d.stopName}) : ${d.items.map((i) => i.title).join(" · ")}`)
    .join("\n");

  return `Voici le voyage tel qu'il est composé :

${briefText(brief)}

Étapes :
${plan.stops.map((s) => `- ${s.name} (${s.region}) — ${s.nights} nuits`).join("\n")}

Programme jour par jour :
${programme}
${knownSources(plan)}
Tout ce que tu écris doit être propre à ce pays, à ces dates et à cet équipage. Ce qui vaudrait pour n'importe quelle destination n'a pas sa place : ni « prévoyez une trousse à pharmacie », ni « vérifiez la validité de votre passeport » sans dire combien de mois sont exigés.`;
}

/** Première passe : entrer dans le pays, s'y soigner, y être joignable. */
export async function generatePrepA(brief, plan, days, onEvent) {
  const kids = brief.kids > 0;
  const drives = /voiture/i.test(brief.ground || "");

  const prompt = `${prepContext(brief, plan, days)}

Traite maintenant trois volets, et ceux-là seulement : les formalités, la santé et la sécurité, la connexion.

Formalités : pour un ressortissant français.${kids ? " Il y a un ou plusieurs mineurs : dis ce qui leur est propre — document personnel, autorisation de sortie du territoire, livret de famille." : ""}${drives ? " Le voyageur conduira : traite le permis international." : ""} Cherche les pages officielles et cite-les — c'est le seul volet où une information périmée a des conséquences réelles.

Santé : distingue ce qui est exigé à l'entrée de ce qui est simplement conseillé. Donne les vrais numéros d'urgence du pays et des établissements qui existent, proches des étapes.

Connexion : des offres eSIM réellement vendues pour ce pays, et le type de prise électrique — il change d'un pays à l'autre et personne n'y pense.`;

  const { text, degraded, usage } = await run({
    system: HOUSE_RULES,
    prompt,
    schema: PREP_A_SCHEMA,
    searchUses: PROFILE.searches.practical,
    maxTokens: 12000,
    onEvent,
  });
  return { prep: parseJson(text), degraded, usage };
}

/** Seconde passe : l'argent, la valise, les réservations, les pièges. */
export async function generatePrepB(brief, plan, days, onEvent) {
  const kids = brief.kids > 0;

  const prompt = `${prepContext(brief, plan, days)}

Traite maintenant quatre volets, et ceux-là seulement : l'argent, la valise, les réservations, et le déplacement sur place — puis les pièges de l'itinéraire.

Argent : la monnaie, l'ordre de grandeur du change relevé pendant ta recherche, et trois niveaux de budget journalier hors hébergement, cohérents avec le niveau ${brief.budget || "confort"} demandé.

Valise : déduis-la de la météo attendue à ces dates, de la durée, des activités du programme${kids ? ", de la présence d'enfants" : ""} et des usages vestimentaires locaux. Chaque objet porte la raison précise de sa présence.

Réservations : ce qu'il faut réserver et quand, en commençant par ce qui part le plus vite.

Pièges : relis le programme et cherche ce qui coince vraiment — une marge trop courte avant un vol, deux journées de marche consécutives, un lieu fermé le jour où il est placé, un trajet sous-estimé. Chiffre-les. Si l'itinéraire est sain, dis-le plutôt que d'inventer un problème.`;

  const { text, degraded, usage } = await run({
    system: HOUSE_RULES,
    prompt,
    schema: PREP_B_SCHEMA,
    searchUses: PROFILE.searches.practical,
    maxTokens: 14000,
    onEvent,
  });
  return { prep: parseJson(text), degraded, usage };
}

/** La préparation est complète quand ses deux passes sont écrites. */
export const prepComplete = (p) => Boolean(p?.formalities && p?.packing);
