/* Catégories d'étape : une couleur et une icône, partagées par l'itinéraire
   de l'accueil et celui du voyage. */

export const KINDS = {
  transfer: { label: "Trajet", icon: "plane", c: "#5D82A8" },
  hotel: { label: "Hébergement", icon: "bed", c: "#0B3266" },
  sight: { label: "Visite", icon: "compass", c: "#E0813C" },
  food: { label: "Table", icon: "food", c: "#C9932F" },
  activity: { label: "Activité", icon: "spark", c: "#2E7D5B" },
  beach: { label: "Plage", icon: "sun", c: "#307A88" },
  rest: { label: "Pause", icon: "moon", c: "#8A93A5" },
};

export const kindOf = (k) => KINDS[k] || KINDS.sight;
