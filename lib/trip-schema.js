/* Forme d'un voyage Odyssea.

   Ces schémas sont envoyés à l'API comme contrainte de sortie : la réponse
   est garantie conforme, on n'a donc rien à réparer côté serveur.

   Contraintes du format : pas de schéma récursif, pas de bornes numériques
   ni de longueurs de chaîne, et `additionalProperties: false` sur chaque
   objet. Les limites (nombre d'étapes, de journées…) sont exprimées dans les
   descriptions, que le modèle suit. */

const obj = (properties, required) => ({
  type: "object",
  properties,
  required: required ?? Object.keys(properties),
  additionalProperties: false,
});

const str = (description) => ({ type: "string", description });
const num = (description) => ({ type: "number", description });
const arr = (items, description) => ({ type: "array", items, description });

/** Catégories d'étape — le code couleur de l'itinéraire s'y adosse. */
export const KIND_VALUES = ["transfer", "hotel", "sight", "food", "activity", "beach", "rest"];

const source = obj({
  title: str("Titre de la page consultée"),
  url: str("URL exacte de la source"),
});

/* ---------- Phase 1 : le plan ---------- */

export const PLAN_SCHEMA = obj({
  destination: obj({
    name: str("Nom de la destination tel qu'on l'écrit en français"),
    country: str("Pays, en français"),
    tagline: str("Une phrase, 12 mots maximum, sur l'esprit de ce voyage"),
    summary: str("Deux à trois phrases : à quoi ressemble concrètement ce voyage"),
  }),
  season: obj({
    verdict: str("« Excellente période », « Période correcte » ou « Période difficile »"),
    detail: str("Deux phrases : climat réel attendu sur ces dates, affluence, prix"),
    score: num("Note de 0 à 100 de l'adéquation des dates à cette destination"),
  }),
  stops: arr(
    obj({
      name: str("Ville ou lieu de l'étape"),
      region: str("Région ou province"),
      nights: num("Nombre de nuits sur place"),
      why: str("Une phrase : pourquoi cette étape mérite ces nuits"),
      lat: num("Latitude décimale"),
      lon: num("Longitude décimale"),
    })
  , "De 1 à 5 étapes, dans l'ordre du voyage. Somme des nuits = durée du séjour moins les nuits en transport."),
  flights: obj({
    summary: str("Une phrase : à quoi ressemble le trajet aller (durée totale, escales)"),
    options: arr(
      obj({
        airline: str("Compagnie réellement présente sur cet axe"),
        route: str("Itinéraire, par exemple « CDG → DOH → KUL »"),
        duration: str("Durée totale porte à porte, par exemple « 16 h 25 »"),
        stops: str("« Direct » ou « 1 escale · DOH 1 h 50 »"),
        priceEur: num("Prix aller-retour estimé par personne, en euros"),
        note: str("Un point concret : bagage, horaire d'arrivée, fiabilité"),
      })
    , "2 à 4 compagnies qui opèrent réellement cet axe, ordonnées de la plus pertinente à la moins pertinente"),
    searchUrl: str("URL de recherche Google Flights pré-remplie pour cet axe et ces dates"),
  }),
  stays: arr(
    obj({
      stopName: str("Nom de l'étape concernée, identique à stops[].name"),
      area: str("Quartier précis où loger"),
      why: str("Une phrase : ce que ce quartier apporte pour ce voyage"),
      priceEurPerNight: num("Prix moyen constaté pour une nuit, en euros"),
      examples: arr(str("Nom d'un établissement réel de ce quartier"), "1 à 3 établissements réels"),
      searchUrl: str("URL de recherche Booking.com pré-remplie pour ce quartier et ces dates"),
    })
  , "Un objet par étape, dans le même ordre que stops"),
  budget: obj({
    lines: arr(
      obj({
        label: str("Poste de dépense"),
        amountEur: num("Montant total pour l'ensemble du groupe, en euros"),
        confidence: str("« confirmé » si le prix est public et vérifiable, sinon « estimé »"),
      })
    , "5 à 7 postes couvrant vols, hébergement, transport local, repas, activités, assurance"),
    totalEur: num("Somme des postes, en euros"),
  }),
  advice: arr(
    obj({
      title: str("Sujet, par exemple « Formalités », « Santé », « Argent », « Sur place »"),
      detail: str("Deux phrases maximum, concrètes et actionnables"),
    })
  , "3 à 5 conseils réellement spécifiques à cette destination et à ce profil"),
  sources: arr(source, "3 à 8 pages réellement consultées pendant la recherche"),
});

/* ---------- Phase 3 : le pratique ---------- */

export const PRACTICAL_SCHEMA = obj({
  transport: obj({
    verdict: str("Comment se déplacer sur place, en une phrase"),
    options: arr(
      obj({
        mode: str("« Voiture de location », « Train », « Transports urbains », « Chauffeur »…"),
        priceEur: num("Coût indicatif par jour ou par trajet, en euros"),
        pros: str("Ce que ce mode apporte concrètement pour ce voyage"),
        cons: str("La contrainte réelle : conduite à gauche, parking, fréquence…"),
        recommended: { type: "boolean", description: "Vrai pour l'option conseillée" },
      })
    , "2 à 4 modes réellement disponibles sur place"),
    warnings: arr(
      obj({
        title: str("Le point de vigilance"),
        detail: str("Une phrase concrète"),
      })
    , "1 à 4 points de vigilance propres à cette destination"),
  }),
  checklist: arr(
    obj({
      group: str("« Documents », « Santé », « Argent & connexion », « Sur place »…"),
      items: arr(str("Une démarche concrète, vérifiable"), "3 à 6 démarches"),
    })
  , "3 à 4 groupes, adaptés à la nationalité française et à cette destination"),
  packing: arr(
    obj({
      group: str("« Vêtements », « Météo », « Tech & divers »…"),
      items: arr(
        obj({
          label: str("L'objet"),
          why: str("La raison précise, liée à ce voyage — pas une généralité"),
        })
      , "3 à 6 objets"),
    })
  , "3 groupes"),
  watchouts: arr(
    obj({
      severity: str("« fort » ou « modéré »"),
      title: str("Le risque concret sur ce voyage"),
      detail: str("Pourquoi il se pose ici, chiffres à l'appui"),
      fix: str("Le correctif précis"),
    })
  , "2 à 4 pièges réels dans cet itinéraire : marges trop courtes, journées trop chargées, fermetures…"),
});

/* ---------- Phase 2 : les journées ---------- */

export const DAYS_SCHEMA = obj({
  days: arr(
    obj({
      n: num("Numéro de la journée dans le voyage, à partir de 1"),
      date: str("Date au format AAAA-MM-JJ"),
      stopName: str("Étape où se déroule la journée, identique à stops[].name, ou « Transport »"),
      title: str("Titre de la journée, 6 mots maximum"),
      items: arr(
        obj({
          time: str("Heure au format HH:MM"),
          kind: { type: "string", enum: KIND_VALUES, description: "Nature de l'étape" },
          title: str("Ce qu'on fait — nom réel du lieu, du musée, de la table"),
          detail: str("Une phrase concrète : ce qu'on y voit, ce qu'on y mange, comment on y va"),
          durationMin: num("Durée en minutes, 0 si sans objet"),
          costEur: num("Coût par personne en euros, 0 si gratuit"),
          why: str("Pourquoi c'est placé là et pas ailleurs. Chaîne vide si évident."),
          bookingUrl: str("URL de réservation ou site officiel. Chaîne vide si inutile."),
        })
      , "4 à 8 étapes par journée, dans l'ordre chronologique, sans trou de plus de 3 h en journée"),
    })
  , "Une entrée par journée demandée, exactement"),
});
