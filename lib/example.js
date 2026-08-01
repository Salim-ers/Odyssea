/* L'exemple de l'accueil : douze jours en Malaisie, avec la carte
   OpenStreetMap correspondante.

   C'est le seul contenu écrit à la main du site, et il est là pour une
   raison : montrer ce qu'Odyssea produit avant qu'un voyage ait été composé.
   Dès qu'un vrai voyage existe en base, la vitrine le remplace. */

export const MAP = {
  src: "/assets/map-malaisie.webp",
  w: 760,
  h: 900,
  routes: ["M530 742 C 500 640 380 470 284 331", "M284 331 C 262 285 220 205 190 159"],
};

export const STOPS = [
  { k: "kl", name: "Kuala Lumpur", n: "4 nuits", x: 530, y: 742 },
  { k: "pen", name: "Penang", n: "3 nuits", x: 284, y: 331 },
  { k: "lgk", name: "Langkawi", n: "4 nuits", x: 190, y: 159 },
];

export const DAYS=[
{n:1,c:"fly",d:"sam. 03 oct",t:"Paris → Kuala Lumpur",items:[
 {id:"d1a",t:"15:00",k:"transfer",f:"Départ pour Roissy CDG",s:"RER B ou taxi · comptez 45 min",travel:{m:45,by:"train"}},
 {id:"d1b",t:"18:05",k:"transfer",f:"Vol Paris → Doha",s:"QR 40 · 6 h 35 · repas chaud à bord",dur:"6 h 35"},
 {id:"d1c",t:"01:20",k:"transfer",f:"Vol Doha → Kuala Lumpur",s:"QR 848 · 7 h 30 · nuit à bord",dur:"7 h 30"}]},
{n:2,c:"kl",d:"dim. 04 oct",t:"Arrivée en douceur",items:[
 {id:"d2a",t:"15:10",k:"transfer",f:"Arrivée à KUL",s:"Immigration + bagages · ~50 min",travel:{m:28,by:"train"}},
 {id:"d2b",t:"16:30",k:"transfer",f:"KLIA Ekspres → centre-ville",s:"28 min · ≈ 11 € / pers."},
 {id:"d2c",t:"17:30",k:"hotel",f:"Check-in — Traders Hotel",s:"KLCC · dépôt des bagages",travel:{m:5,by:"walk"}},
 {id:"d2d",t:"18:30",k:"sight",f:"Balade au parc KLCC",s:"Fontaines au pied des tours Petronas",dur:"1 h",out:true,tag:"jetlag",crowd:"mod",
  why:"Rester dehors jusqu'au soir aide à caler le décalage (+6 h)."},
 {id:"d2e",t:"20:00",k:"food",f:"Dîner léger — food court, Suria KLCC",s:"Nasi goreng, satay · sans réservation",cost:"≈ 12 €"}]},
{n:3,c:"kl",d:"lun. 05 oct",t:"Canopée, musées & saveurs",items:[
 {id:"d3a",t:"09:00",k:"food",f:"Petit-déjeuner à l'hôtel",s:"Buffet international"},
 {id:"d3b",t:"10:00",k:"sight",f:"KL Forest Eco Park & KL Tower",s:"Passerelle dans la canopée puis observatoire à 276 m",dur:"2 h 30",cost:"12 €",out:true,crowd:"mod",travel:{m:14,by:"car"},
  why:"Le matin : lumière douce et moins de monde (estimation)."},
 {id:"d3c",t:"12:45",k:"food",f:"Déjeuner banana leaf végétarien",s:"Cuisine indienne · options véganes",cost:"≈ 9 €",vegan:true,travel:{m:25,by:"car"}},
 {id:"d3d",t:"14:30",k:"sight",f:"Musée national de Malaisie",s:"Quatre galeries, de la préhistoire à l'indépendance · climatisé",dur:"2 h",cost:"1 €",crowd:"low",travel:{m:15,by:"car"}},
 {id:"d3e",t:"16:45",k:"sight",f:"Merdeka Square & Sultan Abdul Samad",s:"Le KL colonial en briques rouges",dur:"45 min",tag:"patrimoine",travel:{m:6,by:"walk"},
  why:"À 6 min à pied du musée — la place où l'indépendance a été proclamée en 1957."},
 {id:"d3f",t:"20:00",k:"food",f:"Dîner — Kampung Baru",s:"Le village malais historique, au pied des tours",cost:"≈ 10 €",out:true,crowd:"busy",travel:{m:14,by:"car"},
  why:"Le nasi lemak légendaire du quartier — au cœur de votre profil « gastronomie »."}]},
{n:4,c:"kl",d:"mar. 06 oct",t:"Le vieux KL",items:[]},
{n:5,c:"pen",d:"mer. 07 oct",t:"Cap sur Penang",items:[
 {id:"d5a",t:"09:30",k:"hotel",f:"Check-out"},
 {id:"d5b",t:"11:10",k:"transfer",f:"Vol KUL → Penang",s:"55 min · ≈ 25 € / pers.",dur:"55 min"},
 {id:"d5c",t:"13:00",k:"hotel",f:"Check-in — Campbell House",s:"George Town · maison 1903",travel:{m:35,by:"car"}},
 {id:"d5d",t:"15:00",k:"sight",f:"Street art & Armenian Street",s:"Fresques de Zacharevic",dur:"2 h 30",out:true,crowd:"mod",tag:"photo",travel:{m:8,by:"walk"}},
 {id:"d5e",t:"19:30",k:"food",f:"Nasi kandar — Line Clear",s:"Institution de Penang depuis 1947",cost:"≈ 8 €",out:true,crowd:"busy",
  why:"File d'attente = bon signe. Le poulet madras est un incontournable."}]},
{n:6,c:"pen",d:"jeu. 08 oct",t:"George Town patrimoine",items:[
 {id:"d6a",t:"09:00",k:"sight",f:"Balade patrimoine UNESCO",s:"Shophouses, comptoirs coloniaux et ruelles peintes · ~5 km",dur:"3 h",out:true,crowd:"mod",
  why:"À pied — le centre historique se déguste lentement."},
 {id:"d6b",t:"12:30",k:"food",f:"Assam laksa au marché",s:"Version poisson · la fierté de l'île",cost:"≈ 6 €",travel:{m:6,by:"walk"}},
 {id:"d6c",t:"14:30",k:"sight",f:"Clan Jetties",s:"Villages lacustres centenaires",dur:"1 h 30",out:true,crowd:"busy",travel:{m:12,by:"walk"},
  pb:"Musée de Penang (climatisé, à 10 min)"},
 {id:"d6d",t:"16:30",k:"sight",f:"Blue Mansion — visite guidée",s:"Demeure de Cheong Fatt Tze",dur:"1 h",cost:"10 €",resa:true,crowd:"low",travel:{m:14,by:"walk"}},
 {id:"d6e",t:"19:30",k:"food",f:"Dîner — Kapitan, Little India",s:"Briyani & tandoori au feu de four",cost:"≈ 11 €",crowd:"busy"}]},
{n:7,c:"pen",d:"ven. 09 oct",t:"Collines et panoramas",items:[
 {id:"d7a",t:"08:30",k:"sight",f:"Penang Hill au funiculaire",s:"Montée sans effort · vue à 833 m",dur:"3 h",cost:"16 €",out:true,crowd:"busy",resa:true,travel:{m:25,by:"car"},
  pb:"The Habitat (canopée, partiellement couvert)"},
 {id:"d7b",t:"12:30",k:"sight",f:"Jardin botanique de Penang",s:"30 ha de palmeraies au pied des collines",dur:"1 h 30",cost:"1 €",out:true,crowd:"mod",travel:{m:15,by:"car"}},
 {id:"d7c",t:"15:30",k:"rest",f:"Piscine & sieste",s:"Retour à George Town",travel:{m:25,by:"car"}},
 {id:"d7d",t:"18:40",k:"sight",f:"Coucher de soleil — Chew Jetty",s:"Ponton face à l'ouest · soleil couchant à 19:11",dur:"45 min",out:true,tag:"sunset",crowd:"mod",travel:{m:10,by:"walk"},
  why:"Le soleil tombe dans le détroit pile avant le dîner — votre moment à deux."},
 {id:"d7e",t:"20:00",k:"food",f:"Hawkers — Padang Kota Lama",s:"Pasembur, mee goreng, coco glacé",cost:"≈ 9 €",travel:{m:8,by:"walk"}}]},
{n:8,c:"lgk",d:"sam. 10 oct",t:"L'île aux aigles",items:[
 {id:"d8a",t:"09:00",k:"hotel",f:"Check-out"},
 {id:"d8b",t:"11:10",k:"transfer",f:"Vol Penang → Langkawi",s:"35 min · ≈ 30 € / pers.",dur:"35 min"},
 {id:"d8c",t:"13:00",k:"hotel",f:"Check-in — Dash Resort",s:"Pantai Cenang · face à la mer",travel:{m:25,by:"car"}},
 {id:"d8d",t:"14:00",k:"transfer",f:"Retrait de la voiture de location",s:"Perodua Axia · agence à 5 min du resort",travel:{m:5,by:"walk"},
  why:"Réservée pour les jours 8 → 12 — l'île se découvre bien mieux motorisé."},
 {id:"d8e",t:"16:00",k:"beach",f:"Plage de Cenang",s:"Eau à 29° · transats du resort",dur:"2 h 30",out:true,crowd:"mod"},
 {id:"d8f",t:"19:30",k:"food",f:"Dîner pieds dans le sable",s:"Grillades du resort, table posée sur la plage",cost:"≈ 20 €",tag:"sunset"}]},
{n:9,c:"lgk",d:"dim. 11 oct",t:"Au-dessus de la canopée",items:[
 {id:"d9a",t:"09:00",k:"sight",f:"SkyCab & SkyBridge",s:"Téléphérique + passerelle à 660 m",dur:"2 h",cost:"18 €",out:true,crowd:"very",resa:true,travel:{m:35,by:"car"},
  pb:"Aquarium Underwater World (Cenang)"},
 {id:"d9b",t:"12:30",k:"food",f:"Déjeuner — Oriental Village",s:"Stands de rue · vue montagne",cost:"≈ 10 €"},
 {id:"d9c",t:"15:00",k:"beach",f:"Plage & baignade",dur:"2 h 30",out:true,travel:{m:30,by:"car"}},
 {id:"d9d",t:"19:00",k:"food",f:"Grillades au bord de l'eau",s:"Poissons du jour, choisis à l'étal",cost:"≈ 16 €",tag:"sunset"}]},
{n:10,c:"lgk",d:"lun. 12 oct",t:"Mangroves et lenteur",items:[
 {id:"d10a",t:"09:30",k:"activity",f:"Kayak — géoforêt de Kilim",s:"Mangroves, aigles, grottes",dur:"3 h",cost:"35 €",out:true,resa:true,crowd:"low",travel:{m:40,by:"car"},
  why:"Nature + calme : deux piliers de votre Trip DNA."},
 {id:"d10b",t:"13:30",k:"food",f:"Ferme aquacole de Kilim",s:"Fruits de mer servis au-dessus de l'eau",cost:"≈ 15 €"},
 {id:"d10c",t:"16:00",k:"activity",f:"Spa en duo",s:"90 min · au resort",cost:"48 €",resa:true,travel:{m:40,by:"car"}},
 {id:"d10d",t:"20:00",k:"food",f:"Dîner romantique bord de mer",s:"Table sur le sable, face au large",cost:"≈ 24 €",tag:"sunset"}]},
{n:11,c:"lgk",d:"mar. 13 oct",t:"Journée libre, presque",items:[
 {id:"d11a",t:"—",k:"rest",f:"Matinée libre — piscine",s:"Aucun réveil programmé"},
 {id:"d11b",t:"12:30",k:"food",f:"Déjeuner — Siti Fatimah",s:"Buffet malais réputé de l'île",cost:"≈ 8 €",travel:{m:20,by:"car"}},
 {id:"d11c",t:"14:30",k:"rest",f:"Temps libre — Kuah duty-free",s:"Chocolats à rapporter · ou simplement rien",travel:{m:15,by:"car"}},
 {id:"d11d",t:"17:30",k:"activity",f:"Croisière familiale au coucher du soleil",s:"3 h · dîner servi à bord",cost:"55 €",resa:true,out:true,crowd:"mod",tag:"sunset",
  why:"La dernière vraie soirée — la mer d'Andaman en spectacle, soleil couchant à 19:13."}]},
{n:12,c:"fly",d:"mer. 14 oct",t:"Retour vers Paris",items:[
 {id:"d12a",t:"09:30",k:"transfer",f:"Restitution de la voiture",s:"Plein fait · état des lieux 10 min"},
 {id:"d12b",t:"10:30",k:"hotel",f:"Check-out"},
 {id:"d12c",t:"12:10",k:"transfer",f:"Transfert aéroport LGK",s:"30 min de route",travel:{m:30,by:"car"}},
 {id:"d12d",t:"13:05",k:"transfer",f:"Vol Langkawi → KUL",dur:"1 h"},
 {id:"d12e",t:"16:55",k:"transfer",f:"Vol KUL → Doha → Paris",s:"Arrivée CDG 06:55 le 15 oct · deux repas à bord",dur:"16 h 30"}]}
];

export const DAY4A=[
 {id:"d4a",t:"09:30",k:"sight",f:"Central Market & Chinatown",s:"Halles de 1928 · artisanat",dur:"2 h",out:true,crowd:"mod",travel:{m:10,by:"walk"}},
 {id:"d4b",t:"12:00",k:"food",f:"Déjeuner — Brickfields, Little India",s:"Roti canai, teh tarik, banana leaf",cost:"≈ 7 €"},
 {id:"d4c",t:"13:15",k:"sight",f:"Merdeka Square & bâtiment Sultan Abdul Samad",s:"Le KL colonial en briques rouges",dur:"45 min",tag:"patrimoine",travel:{m:6,by:"walk"}},
 {id:"d4d",t:"14:30",k:"sight",f:"Jardins botaniques Perdana",s:"92 ha · jardin d'orchidées",dur:"2 h 30",cost:"Gratuit",out:true,crowd:"low",travel:{m:12,by:"car"},wxrisk:true,
  pb:"Musée national (à 6 min)"},
 {id:"d4e",t:"17:30",k:"rest",f:"Pause à l'hôtel",travel:{m:14,by:"car"}},
 {id:"d4f",t:"20:30",k:"sight",f:"Petronas illuminées",s:"Depuis le parc KLCC",dur:"45 min",out:true,travel:{m:5,by:"walk"}},
 {id:"d4g",t:"21:15",k:"food",f:"Dîner tardif — Saloma, bord de rivière",s:"Cuisine malaise · spectacle de danses traditionnelles",cost:"≈ 18 €",travel:{m:8,by:"walk"}}];

/* Le jour 4 a un plan B météo ; l'exemple montre le plan initial. */
export const dayItems = (d) => (d.n === 4 ? DAY4A : d.items);

/* Le compte d'étapes se déduit du programme plutôt que d'être recopié :
   il reste juste si une journée change. */
const STEPS = DAYS.reduce((total, d) => total + dayItems(d).length, 0);

export const EXAMPLE = {
  kicker: "Un exemple complet",
  title: "Douze jours en Malaisie, heure par heure.",
  intro:
    `Trois escales, ${STEPS} étapes, chaque trajet compté. Choisissez une escale ` +
    "sur la carte : le programme se déroule à côté, avec la raison d'être de chaque moment.",
};
