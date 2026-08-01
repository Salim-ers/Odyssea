/* Le réglage de composition : ce qu'on accepte de dépenser pour un voyage.

   Il faut savoir d'où vient le coût pour choisir. Presque tout tient au
   nombre de recherches web. Chaque recherche verse ses résultats dans le
   contexte, et le contexte entier est renvoyé au tour suivant : la deuxième
   recherche paie la première, la troisième paie les deux précédentes. Le coût
   croît donc comme le carré du nombre de recherches, pas comme son double.
   Passer de dix recherches à cinq ne divise pas la note par deux mais par
   quatre environ.

   Les tokens de raisonnement viennent ensuite : ils sont facturés en sortie,
   cinq fois le prix de l'entrée. `effort` les commande directement.

   Le nombre de journées par appel joue au troisième rang : moins d'appels,
   c'est moins de fois le même contexte de départ, et moins de boucles de
   recherche. Mais un lot trop gros allonge la requête, et une fonction
   serverless s'arrête à cinq minutes.

   ODYSSEA_PROFILE choisit le réglage. Par défaut « complet » : on ne réduit
   pas la qualité d'un voyage sans que ce soit demandé. */

export const PROFILES = {
  /* Pour éprouver l'application, ou quand le volume compte plus que le détail. */
  econome: {
    label: "Économe",
    searches: { plan: 5, days: 3, practical: 3 },
    effort: "medium",
    batch: 6,
  },
  /* Le meilleur rapport : on garde la recherche là où elle décide de tout —
     la destination et la saison — et on la resserre ailleurs. */
  equilibre: {
    label: "Équilibré",
    searches: { plan: 8, days: 4, practical: 4 },
    effort: "high",
    batch: 5,
  },
  /* Tout ce que le modèle peut vérifier. */
  complet: {
    label: "Complet",
    searches: { plan: 10, days: 6, practical: 6 },
    effort: "high",
    batch: 4,
  },
};

const chosen = String(process.env.ODYSSEA_PROFILE || "").toLowerCase();

export const PROFILE = PROFILES[chosen] || PROFILES.complet;
