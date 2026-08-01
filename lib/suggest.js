/* Listes d'amorce de la barre de recherche. Ce sont des suggestions, pas
   des données de voyage : la recherche réelle interroge le jeu mondial
   d'aéroports (lib/places.js) dès la première frappe. */

export const AIRPORTS=[
 ["CDG","Paris — Charles de Gaulle","Vols directs et longs-courriers"],
 ["ORY","Paris — Orly","Pratique depuis le sud de Paris"],
 ["BVA","Paris — Beauvais","Compagnies à bas coût"],
 ["LYS","Lyon — Saint-Exupéry","Avec une courte correspondance"],
 ["MRS","Marseille — Provence","Avec une courte correspondance"],
 ["NCE","Nice — Côte d'Azur","2ᵉ plateforme française"],
 ["TLS","Toulouse — Blagnac","Avec une courte correspondance"],
 ["BOD","Bordeaux — Mérignac","Avec une courte correspondance"],
 ["NTE","Nantes — Atlantique","Avec une courte correspondance"],
 ["LIL","Lille — Lesquin","Ou Bruxelles à 1 h 20 de route"],
 ["MPL","Montpellier — Méditerranée","Avec une courte correspondance"],
 ["SXB","Strasbourg — Entzheim","Ou Bâle-Mulhouse tout proche"],
 ["BSL","Bâle — Mulhouse","Trinational, longs-courriers via hubs"],
 ["RNS","Rennes — Bretagne","Avec une courte correspondance"],
 ["BES","Brest — Bretagne","Avec une courte correspondance"],
 ["AJA","Ajaccio — Napoléon Bonaparte","Correspondance via Paris ou Marseille"],
 ["BIA","Bastia — Poretta","Correspondance via Paris ou Nice"],
 ["GVA","Genève — Cointrin","Depuis la Suisse romande et Rhône-Alpes"],
 ["BRU","Bruxelles — Zaventem","Depuis la Belgique et le Nord"],
 ["LUX","Luxembourg — Findel","Depuis le Grand-Est et le Luxembourg"],
];

/* Catégories d'étape : un code couleur unique, repris partout. */

export const DEST_SUGG=[
 ["Malaisie","Kuala Lumpur, Penang, Langkawi"],
 ["Japon","Tokyo, Kyoto, Alpes japonaises"],
 ["Portugal","Lisbonne, Douro, Algarve"],
 ["Maroc","Marrakech, Atlas, côte atlantique"],
 ["Indonésie","Bali, Java, Lombok"],
 ["Italie","Rome, Toscane, côte amalfitaine"],
 ["Grèce","Athènes et les Cyclades"],
 ["Islande","Cercle d'or, fjords, aurores"],
 ["Vietnam","Hanoï, baie d'Along, Hôi An"],
 ["Costa Rica","Volcans, Pacifique, forêt de nuages"],
 ["Norvège","Fjords, Lofoten, Tromsø"],
 ["États-Unis","New York, Californie, parcs de l'Ouest"]
];
