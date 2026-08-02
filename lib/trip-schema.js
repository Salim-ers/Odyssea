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
    countryCode: str("Code pays ISO 3166-1 alpha-2, en majuscules — il décide des services disponibles sur place"),
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

/* ---------- Phase 3 : préparer le voyage ----------

   Six étapes, dans l'ordre où on les traite avant de partir. Tout y est
   propre au pays, aux dates et à l'équipage : les formalités d'un mineur ne
   sont pas celles d'un adulte, une prise électrique change d'un pays à
   l'autre, et une valise pour octobre au Maroc n'est pas une valise pour
   février en Islande. C'est la raison d'être de cette phase — sans elle on
   afficherait des généralités qu'on trouve partout ailleurs. */

const LEVELS = ["obligatoire", "recommandé", "selon le cas"];

/** Natures de réservation : elles décident du partenaire proposé. */
export const BOOKING_KINDS = [
  "flight",
  "stay",
  "transfer",
  "car",
  "train",
  "ride",
  "activity",
  "esim",
  "gear",
];

export const PREP_SCHEMA = obj({
  formalities: obj({
    summary: str("Une phrase : ce qu'il faut avoir en main pour entrer, pour ce profil précis"),
    documents: arr(
      obj({
        label: str("Le document : passeport, carte d'identité, visa, autorisation électronique…"),
        level: { type: "string", enum: LEVELS, description: "Caractère de l'exigence" },
        detail: str("Ce qu'il faut savoir : où le demander, en combien de temps, à quel prix"),
        validity: str("Durée de validité exigée à l'entrée. Chaîne vide si sans objet."),
        who: str("À qui cela s'applique : tous, les mineurs, le conducteur…"),
        url: str("Page officielle qui fait foi. Chaîne vide si aucune."),
      }),
      "3 à 7 documents réellement exigés ou utiles pour un ressortissant français sur cette destination, mineurs compris s'il y en a"
    ),
    entry: arr(
      obj({
        title: str("La condition d'entrée : durée autorisée, billet retour, justificatif…"),
        detail: str("Une phrase concrète et vérifiable"),
      }),
      "2 à 5 conditions d'entrée réelles"
    ),
    sources: arr(source, "1 à 4 pages officielles consultées"),
  }),

  health: obj({
    summary: str("Une phrase : le niveau de précaution sanitaire réel sur place"),
    vaccines: arr(
      obj({
        name: str("Le vaccin"),
        level: { type: "string", enum: LEVELS, description: "Obligatoire, recommandé ou selon le cas" },
        detail: str("Pourquoi, et le délai à respecter avant le départ"),
      }),
      "2 à 6 entrées ; s'il n'y a aucune exigence, le dire dans une entrée « selon le cas »"
    ),
    kit: arr(str("Un article de la trousse, motivé par cette destination"), "4 à 8 articles"),
    emergency: arr(
      obj({
        label: str("Le service : urgences, police, ambassade de France…"),
        number: str("Le numéro tel qu'on le compose sur place"),
      }),
      "3 à 5 numéros réels dans ce pays"
    ),
    facilities: arr(
      obj({
        name: str("Nom réel de l'hôpital ou de la clinique"),
        city: str("Ville ou quartier, parmi les étapes du voyage"),
        detail: str("Ce qui le rend pertinent : urgences 24 h, francophone, proche de l'étape"),
      }),
      "1 à 3 établissements réels, proches des étapes"
    ),
    safety: arr(
      obj({
        title: str("Le point de vigilance propre à cette destination"),
        detail: str("Une phrase concrète, sans alarmisme ni jugement sur les habitants"),
      }),
      "2 à 4 points réellement spécifiques"
    ),
  }),

  connectivity: obj({
    summary: str("Une phrase : à quoi ressemble la connexion sur place"),
    coverage: str("Couverture réelle sur l'itinéraire, zones creuses comprises"),
    esim: arr(
      obj({
        provider: str("Fournisseur d'eSIM réellement disponible pour ce pays"),
        plan: str("Le forfait : volume et durée"),
        priceEur: num("Prix en euros"),
        detail: str("Ce qui le distingue : réseau utilisé, partage de connexion, activation"),
      }),
      "2 à 4 offres réelles couvrant la durée du séjour"
    ),
    localSim: arr(
      obj({
        operator: str("Opérateur local"),
        where: str("Où l'acheter : aéroport, boutique, supérette"),
        priceEur: num("Prix en euros"),
        detail: str("Papiers demandés, volume, durée"),
      }),
      "1 à 3 options locales réelles"
    ),
    plug: obj({
      types: str("Types de prise sur place, par exemple « C et E »"),
      voltage: str("Tension et fréquence, par exemple « 230 V · 50 Hz »"),
      adapter: str("Faut-il un adaptateur depuis la France, et lequel"),
    }),
  }),

  money: obj({
    currency: obj({
      name: str("Nom de la monnaie"),
      code: str("Code ISO, par exemple MAD"),
      rate: str("Ordre de grandeur du change pour un euro, tel que relevé pendant la recherche"),
    }),
    payment: arr(
      obj({
        title: str("Le moyen de paiement"),
        detail: str("Où il passe, où il ne passe pas"),
      }),
      "2 à 4 entrées"
    ),
    cash: arr(
      obj({
        title: str("Le point sur les espèces : retrait, frais, coupures"),
        detail: str("Une phrase concrète et chiffrée"),
      }),
      "2 à 4 entrées"
    ),
    daily: obj({
      frugalEur: num("Budget journalier par personne en mode économe, hors hébergement"),
      comfortEur: num("Budget journalier par personne en mode confort, hors hébergement"),
      generousEur: num("Budget journalier par personne sans se restreindre, hors hébergement"),
      note: str("Ce que ces montants couvrent, en une phrase"),
    }),
  }),

  packing: arr(
    obj({
      group: str("« Vêtements », « Chaussures », « Hygiène », « Santé », « Tech », « Documents », « Plage », « Randonnée »…"),
      items: arr(
        obj({
          label: str("L'objet"),
          why: str("La raison précise, liée à ce voyage : météo, activité, usage local"),
          essential: { type: "boolean", description: "Vrai si l'oublier gâcherait le voyage" },
        }),
        "3 à 7 objets"
      ),
    }),
    "4 à 7 groupes, dictés par la météo, la saison, la durée, les activités prévues, la présence d'enfants et les usages locaux"
  ),

  bookings: arr(
    obj({
      label: str("Ce qu'il faut réserver, nommé précisément"),
      kind: { type: "string", enum: BOOKING_KINDS, description: "Nature de la réservation" },
      when: str("Quand s'en occuper : « dès maintenant », « un mois avant », « sur place »"),
      why: str("Pourquoi à ce moment-là : disponibilité, prix, obligation"),
      place: str("Ville ou lieu concerné, parmi les étapes. Chaîne vide si sans objet."),
    }),
    "5 à 9 réservations réellement nécessaires à cet itinéraire, ordonnées par urgence"
  ),

  transport: obj({
    verdict: str("Comment se déplacer sur place, en une phrase"),
    options: arr(
      obj({
        mode: str("« Voiture de location », « Train », « Transports urbains », « Chauffeur »…"),
        priceEur: num("Coût indicatif par jour ou par trajet, en euros"),
        pros: str("Ce que ce mode apporte concrètement pour ce voyage"),
        cons: str("La contrainte réelle : conduite à gauche, parking, fréquence…"),
        apps: arr(str("Application réellement utilisée sur place"), "0 à 3 applications"),
        recommended: { type: "boolean", description: "Vrai pour l'option conseillée" },
      }),
      "2 à 4 modes réellement disponibles sur place"
    ),
  }),

  watchouts: arr(
    obj({
      severity: str("« fort » ou « modéré »"),
      title: str("Le risque concret sur ce voyage"),
      detail: str("Pourquoi il se pose ici, chiffres à l'appui"),
      fix: str("Le correctif précis"),
    }),
    "2 à 4 pièges réels dans cet itinéraire : marges trop courtes, journées trop chargées, fermetures…"
  ),
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
