/* Le parcours de composition.

   Le principe : on ne pose que les questions qui ont encore un sens.

   Ce que la barre de recherche a déjà arrêté — destinations, dates,
   équipage, périmètre — n'est pas redemandé ; le parcours le rappelle en
   bandeau, modifiable d'un clic. Et une question qui ne s'applique pas au
   voyage en cours n'apparaît pas : pas de répartition des nuits pour une
   seule destination, pas de type d'hébergement si Odyssea n'organise pas
   l'hébergement.

   Aucune destination, aucun prix, aucun lieu n'est écrit ici — tout cela
   vient de la génération. */

/** Ce que la barre de recherche peut fixer. Le parcours ne le repose pas. */
export const FIXABLE = ["dest", "dates", "trav", "scope"];

const has = (ob, key) => Boolean(ob.fixed?.[key]);

/* L'ordre est celui de la conversation : on cadre le voyage, puis le vécu,
   puis les contraintes, et on finit par ce qui compte pour vous. */
export const QUESTIONS = [
  {
    id: "dest",
    hint: "Une ville, un pays, ou plusieurs — on enchaîne",
    applies: (ob) => !has(ob, "dest"),
  },
  {
    id: "dates",
    hint: "Même approximatives — on affinera",
    applies: (ob) => !has(ob, "dates"),
  },
  {
    id: "trav",
    hint: "Le rythme change selon l'équipage",
    applies: (ob) => !has(ob, "trav"),
  },
  {
    id: "origin",
    hint: "Pour tracer la route depuis chez vous",
    /* Sans vol ni train à organiser, le trajet domicile-aéroport n a pas
       d objet : on ne demande pas une adresse pour rien. */
    applies: (ob) => ob.include?.vol !== false,
  },
  {
    id: "split",
    hint: "Ou laissez Odyssea équilibrer",
    /* Ne se pose qu'à partir de deux escales : avant, il n'y a rien à répartir. */
    applies: (ob) => (ob.dests?.length || 0) > 1,
  },
  {
    id: "style",
    hint: "Un principal, un secondaire si vous voulez",
  },
  {
    id: "pace",
    hint: "Le nombre de choses par jour, et l'heure du réveil",
  },
  {
    id: "budget",
    hint: "Une fourchette suffit, on s'y tient",
  },
  {
    id: "lodging",
    hint: "Le lieu où l'on rentre le soir",
    applies: (ob) => ob.include?.hotel !== false,
  },
  {
    id: "ground",
    hint: "Ce qui décide vraiment de l'itinéraire",
  },
  {
    id: "booked",
    hint: "Odyssea complète autour de l'existant",
  },
  {
    id: "food",
    hint: "Vos règles, jamais négociées",
  },
  {
    id: "care",
    hint: "Ce dont il faut tenir compte, sans le dire deux fois",
  },
  {
    id: "wish",
    hint: "Le supplément d'âme de l'itinéraire",
  },
];

/** Les questions réellement posées pour ce brief, dans l'ordre. */
export const questionsFor = (ob) => QUESTIONS.filter((q) => !q.applies || q.applies(ob));

export const STYLE_CARDS = [
  ["Détente", "Peu de trajets, du temps long, des lieux calmes.", "sun"],
  ["Culture & patrimoine", "Musées, quartiers historiques, architecture.", "landmark"],
  ["Aventure", "Reliefs, marche, lever tôt, sortir des routes.", "compass"],
  ["Gastronomie", "Marchés, tables locales, une cuisine par jour.", "food"],
  ["Nature", "Grands espaces, littoral, forêts, faune.", "leaf"],
  ["Photo", "Lumières du matin, spots cadrés, golden hours.", "cam"],
];

export const PACE_CARDS = [
  ["Lent", "Deux ou trois choses par jour, du temps pour flâner.", "1"],
  ["Équilibré", "Un temps fort le matin, un l'après-midi, la soirée libre.", "2"],
  ["Dense", "On remplit les journées, quitte à se lever tôt.", "3"],
];

export const LODGING_CARDS = [
  ["Hôtel", "Service, petit-déjeuner, on pose ses valises.", "bed"],
  ["Appartement", "De l'espace et une cuisine, pour rester plusieurs nuits.", "home"],
  ["Maison d'hôtes", "Petites adresses, accueil personnel, conseils du lieu.", "leaf"],
  ["Peu importe", "Le meilleur rapport qualité-prix à chaque étape.", "spark"],
];

export const GROUND_CARDS = [
  ["Voiture de location", "Liberté totale, y compris hors des villes.", "car"],
  ["Transports en commun", "Trains et bus : pas de conduite, pas de parking.", "train"],
  ["Chauffeur ou taxis", "On se laisse conduire, sans s'occuper du reste.", "compass"],
  ["Qu'Odyssea décide", "Le mode le plus adapté à chaque étape.", "spark"],
];

/* Des contraintes concrètes, pas des catégories de personnes : ce qui compte
   ici est l'effet sur l'itinéraire. */
export const CARE_CHIPS = [
  "Peu de marche",
  "Accès sans escalier",
  "Poussette",
  "Sieste en milieu de journée",
  "Éviter la chaleur",
  "Éviter l'altitude",
  "Pas de vol intérieur",
  "Mal des transports",
];

export const FOOD_CHIPS = [
  "Aucune restriction",
  "Végétarien",
  "Végan",
  "Sans gluten",
  "Sans porc",
  "Sans alcool",
  "Sans épices fortes",
  "Sans fruits de mer",
];

export const WISH_CHIPS = [
  "Éviter la foule",
  "Vivre local",
  "Les incontournables",
  "Lever tôt",
  "Rythme lent",
  "En voir un maximum",
  "Beaucoup marcher",
  "Se baigner",
];

/** Budget : la fourchette dépend du nombre de voyageurs, pas d'un couple. */
export const BUDGET_TIERS = [
  ["Éco", 900, 2],
  ["Confort", 1750, 3],
  ["Premium", 2750, 4],
  ["Luxe", null, 5],
];
