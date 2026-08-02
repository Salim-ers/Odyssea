/* Mise en forme du relevé de consommation.

   Le chiffre affiché est celui que l'API a renvoyé, pas une estimation : il
   vient de `usage` sur chaque réponse, additionné sur tous les appels du
   voyage. Il est donc vérifiable ligne à ligne sur la facture Anthropic.

   L'affichage se coupe avec NEXT_PUBLIC_ODYSSEA_HIDE_COST=1, si un jour vous
   ne voulez pas montrer ce coût aux voyageurs. */

export const showCost = () => process.env.NEXT_PUBLIC_ODYSSEA_HIDE_COST !== "1";

/* Les compositions coûtent quelques dollars : deux décimales suffisent à
   suivre, et trois évitent d'afficher « 0,00 $ » sur une phase courte. */
export const usd = (n) =>
  typeof n === "number" && Number.isFinite(n)
    ? (n < 0.01 ? n.toFixed(3) : n.toFixed(2)).replace(".", ",") + " $"
    : "—";

export const tokens = (n) =>
  typeof n === "number" && Number.isFinite(n)
    ? n >= 1000
      ? Math.round(n / 1000).toLocaleString("fr-FR") + " k"
      : String(n)
    : "—";

/** Le détail d'un relevé, sans le coût — utile quand il est déjà affiché. */
export function detail(u) {
  if (!u) return null;
  const parts = [
    `${tokens((u.input || 0) + (u.cacheRead || 0) + (u.cacheWrite || 0))} en entrée`,
    `${tokens(u.output)} en sortie`,
  ];
  if (u.searches) parts.push(`${u.searches} recherche${u.searches > 1 ? "s" : ""}`);
  if (u.calls) parts.push(`${u.calls} appel${u.calls > 1 ? "s" : ""}`);
  return parts.join(" · ");
}

/** Une ligne courte : ce qui a été consommé, dit simplement. */
export function summary(u) {
  return u ? `${usd(u.costUsd)} · ${detail(u)}` : null;
}

export const PHASE_LABELS = {
  plan: "Destination et saison",
  days: "Journées",
  /* La préparation s écrit en deux passes ; l utilisateur n a pas à lire
     leurs noms de code. */
  prepA: "Préparation — formalités, santé, connexion",
  prepB: "Préparation — argent, valise, réservations",
  practical: "Préparation",
};
