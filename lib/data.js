/* Odyssea — données de démonstration (Malaisie, 12 jours).
   Fixtures pures : aucun accès au DOM, importables côté serveur comme client. */

export const CITY={kl:"Kuala Lumpur",pen:"Penang",lgk:"Langkawi",fly:"Transfert"};

export const SUNSET={kl:"19:07",pen:"19:11",lgk:"19:13"};

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

export const DAY4B=[
 {id:"d4h",t:"09:30",k:"sight",f:"Jardins botaniques Perdana",s:"Avancés au matin — au sec",dur:"2 h 30",cost:"Gratuit",out:true,crowd:"low",travel:{m:12,by:"car"},swap:true},
 {id:"d4i",t:"12:15",k:"food",f:"Déjeuner — Brickfields, Little India",s:"Roti canai, teh tarik · à couvert",cost:"≈ 7 €",travel:{m:10,by:"car"}},
 {id:"d4j",t:"13:20",k:"sight",f:"Merdeka Square sous les arcades",s:"La galerie de la ville, à l'abri",dur:"45 min",tag:"patrimoine",travel:{m:5,by:"walk"}},
 {id:"d4k",t:"14:30",k:"sight",f:"Musée national de Malaisie",s:"À couvert pendant l'averse",dur:"2 h",cost:"1 €",crowd:"low",travel:{m:10,by:"car"},swap:true},
 {id:"d4l",t:"17:00",k:"sight",f:"Central Market (couvert)",dur:"1 h 30",crowd:"mod",travel:{m:8,by:"walk"}},
 {id:"d4m",t:"20:30",k:"sight",f:"Petronas illuminées",dur:"45 min",out:true,travel:{m:10,by:"car"}},
 {id:"d4n",t:"21:15",k:"food",f:"Dîner tardif — Saloma",s:"Cuisine malaise, buffet et spectacle",cost:"≈ 18 €",travel:{m:8,by:"walk"}}];

export const FLIGHTS=[
 {id:"qr",al:"Qatar Airways",code:"QR",col:"#5C0632",dep:"15:55",arr:"14:20",plus:1,dur:"16 h 25",stops:"1 escale · DOH 1 h 50",price:670,score:93,tag:"Meilleur équilibre",
  dims:[["Prix",86],["Durée",90],["Confort",92],["Horaires",95],["Fiabilité",96],["Bagage 30 kg inclus",100]]},
 {id:"sq",al:"Singapore Airlines",code:"SQ",col:"#1C3F94",dep:"12:00",arr:"10:20",plus:1,dur:"16 h 20",stops:"1 escale · SIN 1 h 30",price:745,score:90,tag:"Confort cabine",
  dims:[["Prix",72],["Durée",90],["Confort",99],["Horaires",86],["Fiabilité",92],["Bagage 30 kg inclus",100]]},
 {id:"ek",al:"Emirates",code:"EK",col:"#7A1F1F",dep:"21:30",arr:"19:15",plus:1,dur:"15 h 45",stops:"1 escale · DXB 2 h 05",price:718,score:89,tag:"Le plus rapide",
  dims:[["Prix",78],["Durée",94],["Confort",96],["Horaires",70],["Fiabilité",88],["Bagage 30 kg inclus",100]]},
 {id:"tk",al:"Turkish Airlines",code:"TK",col:"#B0243A",dep:"11:35",arr:"11:05",plus:1,dur:"17 h 30",stops:"1 escale · IST 2 h 40",price:604,score:84,tag:"Le moins cher",
  dims:[["Prix",98],["Durée",74],["Confort",84],["Horaires",84],["Fiabilité",78],["Bagage 23 kg inclus",82]]}
];

export const AREAS=[
 {n:1,name:"KLCC",tag:"Idéal 1er séjour",top:true,rows:[["Ambiance","Verticale, verte, apaisée"],["Transports","LRT + tout à pied"],["Tables","Food courts et grandes tables"],["Prix","€€–€€€"],["Atout","4 activités prévues à < 15 min"]]},
 {n:2,name:"Bukit Bintang",tag:"Le plus gourmand",rows:[["Ambiance","Électrique, commerçante"],["Transports","Monorail + MRT"],["Tables","Jalan Alor et ses étals le soir"],["Prix","€–€€€"],["Atout","Tout se fait à pied le soir"]]},
 {n:3,name:"Chinatown / Pasar Seni",tag:"Meilleur rapport",rows:[["Ambiance","Historique, brute, vivante"],["Transports","MRT Pasar Seni"],["Tables","Kopitiam et halles couvertes"],["Prix","€–€€"],["Atout","Vieux KL à pied"]]}
];

export const HOTELS=[
 {id:"h1",city:"kl",name:"Traders Hotel",area:"KLCC",sky:"gSky1",rating:4.6,rev:"2 840",price:98,nights:4,
  dist:"8 min à pied du parc KLCC · LRT à 5 min",
  why:["Vue directe sur les tours Petronas","Petit-déjeuner servi jusqu'à 11 h","Pratique pour 4 activités planifiées","Dans votre budget (≈ 98 €/nuit)"],
  good:["Excellent emplacement pour votre itinéraire","Piscine sur le toit face aux tours","LRT + trajets courts partout"],
  warn:["Tarif affiché non remboursable","Quartier animé — demander un étage élevé"]},
 {id:"h2",city:"pen",name:"Campbell House",area:"George Town",sky:"gSky2",rating:4.8,rev:"1 120",price:72,nights:3,
  dist:"Cœur du centre UNESCO · tout à pied",
  why:["Maison de 1903 restaurée — cachet rare","≈ 72 €/nuit : sous votre moyenne cible","Petit-déjeuner servi dans la cour intérieure","Rues calmes la nuit malgré le centre"],
  good:["Idéal pour un séjour 100 % à pied","Très bien noté sur le calme","Annulation gratuite 72 h (démo)"],
  warn:["Pas de piscine — prévue au jour 7 ailleurs"]},
 {id:"h3",city:"lgk",name:"Dash Resort",area:"Pantai Cenang",sky:"gSky3",rating:4.4,rev:"1 960",price:84,nights:4,
  dist:"Accès direct plage · 25 min de l'aéroport",
  why:["Les pieds dans le sable pour 4 nuits","Restaurant de plage ouvert jusqu'à 23 h","Spa sur place (réservé jour 10)","≈ 84 €/nuit — équilibre confort/prix"],
  good:["Plage + spa = vos deux derniers piliers","Transferts courts vers Kilim et SkyCab"],
  warn:["Vol tôt le jour 12 — check-out à confirmer","Chambres côté rue plus bruyantes"]}
];

export const LOCS=[
 {id:"car",icn:"car",name:"Voiture compacte",p:"≈ 25 €/jour · Perodua Axia",best:true,
  pts:["Clim + coffre : idéale sous les averses d'octobre","Kilim, SkyCab, Siti Fatimah : l'île entière à portée","Caution ≈ 60 € · assurance de base incluse","Sièges enfant sur demande"],
  reco:"Recommandée jours 8 → 12 à Langkawi"},
 {id:"scoot",icn:"scoot",name:"Scooter",p:"≈ 10 €/jour · Honda Vario 125",
  pts:["Le vent de l'île, stationnement partout","2 casques fournis — port obligatoire","Attention : averses fortes possibles l'après-midi","Permis A ou équivalence exigé sur place"],
  reco:"Pour les balades courtes autour de Cenang"},
 {id:"drv",icn:"users",name:"Chauffeur privé",p:"≈ 45 €/jour · véhicule climatisé",
  pts:["Zéro stress : conduite à gauche déléguée","Bons plans locaux du chauffeur","Idéal pour la journée Kilim + SkyCab","Se réserve la veille via le resort"],
  reco:"Alternative sereine si vous préférez ne pas conduire"}
];

export const LOCWARN=[
 ["alert","Conduite à gauche","Volant à droite, ronds-points inversés — 10 minutes d'adaptation sur le parking."],
 ["shield","Permis international","Obligatoire en pratique avec votre permis français — gratuit, à demander en préfecture ~3 semaines avant."],
 ["rain","Mousson d'octobre","Averses orageuses brèves en fin d'après-midi : en scooter, toujours un K-way dans le coffre."],
 ["info","À KL et Penang, aucun véhicule","LRT, marche et Grab (≈ 2-4 € la course) suffisent largement — parking difficile à KL."]
];

export const RESTOS=[
 {id:"m1",city:"kl",name:"Nasi Lemak Wanjo — Kampung Baru",cui:"Malais traditionnel",p:"≈ 4 €",sky:"gSky3",tags:["budget","local"],
  why:"Le nasi lemak de référence de KL, dans le village malais historique. File rapide, service continu."},
 {id:"m2",city:"kl",name:"Restoran Rebung Chef Ismail",cui:"Buffet malais authentique",p:"≈ 15 €",sky:"gSky1",tags:["famille","local","gastro"],
  why:"60 plats kampung en buffet, du rendang au cendol — la Malaisie des grands-mères, par un chef télévisé."},
 {id:"m3",city:"kl",name:"Simple Life — Bukit Bintang",cui:"Végétal & bols complets",p:"≈ 9 €",sky:"gSky2",tags:["vegan","sain"],
  why:"Chaîne 100 % végétale : options véganes claires, jus pressés — parfait pour alléger un soir."},
 {id:"m4",city:"pen",name:"Line Clear Nasi Kandar",cui:"Nasi kandar mamak",p:"≈ 8 €",sky:"gSky3",tags:["budget","local"],
  why:"Institution ouverte 24 h depuis 1947. Le poulet madras arrosé de trois sauces : incontournable."},
 {id:"m5",city:"pen",name:"Kapitan — Little India",cui:"Briyani & tandoori",p:"≈ 11 €",sky:"gSky1",tags:["famille","local"],
  why:"Immense carte indienne, claypot briyani réputé, four à tandoor visible — et ça sert jusqu'à minuit."},
 {id:"m6",city:"pen",name:"Idealite — George Town",cui:"Végétarien créatif",p:"≈ 10 €",sky:"gSky2",tags:["vegan","sain"],
  why:"Cartes végane et végétarienne balisées, jus détox — la pause verte du centre UNESCO."},
 {id:"m7",city:"lgk",name:"Siti Fatimah",cui:"Buffet malais de l'île",p:"≈ 8 €",sky:"gSky3",tags:["budget","local","famille"],
  why:"L'adresse où déjeunent les familles de Langkawi : 50 plats malais servis à la louche."},
 {id:"m8",city:"lgk",name:"Dîner sur le sable — Pantai Cenang",cui:"Grillades & fruits de mer",p:"≈ 20 €",sky:"gSky3",tags:["sunset","couple","gastro"],
  why:"Table posée sur la plage face à l'ouest : le soleil se couche à 19:13 — il tombe pendant les entrées."},
 {id:"m9",city:"lgk",name:"Ferme aquacole de Kilim",cui:"Fruits de mer de la mangrove",p:"≈ 15 €",sky:"gSky2",tags:["local"],
  why:"Poissons élevés sous vos pieds, cuisinés à la commande au-dessus de la mangrove. Accès en bateau."},
 {id:"m10",city:"lgk",name:"Croisière-dîner — mer d'Andaman",cui:"Buffet servi à bord",p:"≈ 55 €",sky:"gSky1",tags:["sunset","couple","famille","gastro"],
  why:"Déjà réservée au jour 11 : trois heures sur l'eau, buffet à bord — et le coucher de soleil en pleine mer."}
];

export const RTAGS={vegan:"Végane",sunset:"Coucher de soleil",budget:"Petit prix",famille:"En famille",local:"Vécu local",couple:"En amoureux",sain:"Sain",gastro:"Table d'exception"};

export const RFILTERS=[["tous","Tous"],["local","Local authentique"],["gastro","Table d'exception"],["vegan","Options véganes"],["sunset","Vue sunset"],["budget","Petit budget"],["famille","En famille"]];

export const WX=[
 {n:1,c:"fly",i:"plane",t:"—",r:"En vol"},
 {n:2,c:"kl",i:"sun",t:"32°|26°",r:"10 %"},
 {n:3,c:"kl",i:"sun",t:"33°|26°",r:"20 %"},
 {n:4,c:"kl",i:"rain",t:"31°|25°",r:"70 %",alert:true},
 {n:5,c:"pen",i:"cloud",t:"31°|26°",r:"40 %"},
 {n:6,c:"pen",i:"sun",t:"32°|26°",r:"20 %"},
 {n:7,c:"pen",i:"cloud",t:"31°|26°",r:"35 %"},
 {n:8,c:"lgk",i:"sun",t:"32°|27°",r:"15 %"},
 {n:9,c:"lgk",i:"sun",t:"32°|27°",r:"20 %"},
 {n:10,c:"lgk",i:"cloud",t:"31°|26°",r:"45 %"},
 {n:11,c:"lgk",i:"sun",t:"32°|27°",r:"25 %"},
 {n:12,c:"fly",i:"plane",t:"—",r:"En vol"}
];

export const BUDGET=[
 {l:"Vols internationaux + internes",col:"linear-gradient(90deg,#17B8C9,#31BFE3)",amt:1340,conf:true},
 {l:"Hébergements (11 nuits)",col:"linear-gradient(90deg,#31BFE3,#7ADAF2)",amt:890,conf:true},
 {l:"Assurance voyage",col:"linear-gradient(90deg,#35C98E,#7ADAF2)",amt:85,conf:true},
 {l:"Activités & visites",col:"linear-gradient(90deg,#F0B43C,#F6CD6B)",amt:260,conf:false},
 {l:"Location voiture + transports",col:"linear-gradient(90deg,#F0813C,#F0B43C)",amt:310,conf:false},
 {l:"Repas, cafés et marchés",col:"linear-gradient(90deg,#FF8A5C,#F0813C)",amt:300,conf:false}
];

export const REGRETS=[
 {id:"r1",imp:"Impact fort",tt:"Marge trop courte le jour du retour",
  p:"Check-out 10:30, restitution voiture, vol 13:05 : environ 25 min de marge à l'aéroport de Langkawi.",
  rec:"Avancer check-out et restitution à 09:00 pour retrouver ~1 h 20 de marge."},
 {id:"r2",imp:"Impact moyen",tt:"Deux journées consécutives très marchées",
  p:"Jours 6 et 7 à Penang cumulent ≈ 9 km/jour à pied (estimation).",
  rec:"Insérer une pause kopitiam climatisée à 15:45 le jour 6, entre les jetées et la Blue Mansion."},
 {id:"r3",imp:"Impact moyen",tt:"SkyBridge : durée sous-estimée",
  p:"2 h prévues le jour 9 ; files du téléphérique souvent > 45 min en haute affluence (estimation).",
  rec:"Prévoir 3 h (09:00 → 12:00) et décaler la plage à 15:30."}
];

export const D6BREAK={id:"d6x",t:"15:45",k:"rest",f:"Pause kopitiam climatisé",s:"Ajoutée par le détecteur de regrets",travel:{m:5,by:"walk"}};

export const CHECKGROUPS=[
 ["Documents",["Passeport (valide 6 mois après le retour)","Exemption de visa 90 j (Français) — billet retour exigé","Copies numériques passeport + assurance","Permis international (location voiture)"]],
 ["Santé",["Assurance voyage confirmée","Vaccins universels à jour (DTP, hépatites)","Anti-moustique DEET 40 %+","Petite pharmacie (réhydratation, pansements)"]],
 ["Argent & connexion",["Prévenir la banque (paiements Malaisie)","Ringgits : retirer sur place (meilleur taux)","eSIM 15 Go activée avant le départ","Applis hors-ligne : cartes + traduction"]],
 ["Sur place",["Une veste fine pour la climatisation","Chaussures confortables — beaucoup de marche","Adaptateur type G (prises UK)","Photo du tapis de bagages & de la voiture de loc"]]
];

export const PACK=[
 ["Vêtements",[["7 hauts respirants","lin & coton — lavage possible à l'hôtel"],["2 pantalons légers + 2 shorts","confort par 32° et forte humidité"],["Une veste fine","climatisation puissante en intérieur"],["Maillots de bain × 2","piscines & plage de Cenang"],["Sandales + baskets légères","3 h de marche par jour à George Town"]]],
 ["Pluie & soleil",[["K-way compact × 2","averses de mousson l'après-midi"],["SPF 50 (respectueux récifs)","UV équatorial, même voilé"],["Casquette / chapeau","Penang Hill & kayak"],["Anti-moustique DEET","mangroves de Kilim au crépuscule"]]],
 ["Tech & divers",[["Adaptateur type G","prises britanniques"],["Batterie externe 10 000 mAh","longues journées dehors"],["Poche étanche téléphone","kayak & plage"],["Sac pliable","chocolats duty-free de Kuah"]]]
];

export const SCENARIOS=[
 {key:"ess",label:"Essentiel",score:88,tagline:"Le même voyage, dépouillé du superflu.",price:2620,
  lines:["Turkish Airlines (le tarif malin, escale plus longue)","Hôtels simples bien placés, mêmes quartiers","Street food et hawkers à chaque repas","Activités payantes limitées aux trois essentielles"]},
 {key:"eq",label:"Équilibre",score:94,reco:true,tagline:"Notre recommandation — celle du plan détaillé.",price:3185,
  lines:["Qatar Airways, bagage 30 kg inclus","Traders · Campbell House · Dash Resort","Street food ET belles tables","Kayak Kilim, SkyCab, spa duo, croisière au coucher du soleil"]},
 {key:"plus",label:"Confort +",score:91,tagline:"Les mêmes journées, avec plus de douceur.",price:3480,
  lines:["Singapore Airlines, cabine primée","Chambres vue mer / étages élevés","Transferts privés à chaque étape","Spa 2 séances + croisière en catamaran privé"]}
];

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
export const KINDS = {
  transfer: { label: "Trajet", icon: "plane", c: "#5D82A8" },
  hotel:    { label: "Hébergement", icon: "bed", c: "#0B3266" },
  sight:    { label: "Visite", icon: "compass", c: "#E0813C" },
  food:     { label: "Table", icon: "food", c: "#C9932F" },
  activity: { label: "Activité", icon: "spark", c: "#2E7D5B" },
  beach:    { label: "Plage", icon: "sun", c: "#307A88" },
  rest:     { label: "Pause", icon: "moon", c: "#8A93A5" },
};
export const kindOf = (k) => KINDS[k] || KINDS.sight;

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

export const GALS=[
 {key:"bali",city:"Bali",country:"Indonésie",img:"/assets/dest-bali.webp",temp:"29° en oct.",aff:"Affluence modérée",ideal:"Idéal 10-14 jours"},
 {key:"tokyo",city:"Tokyo",country:"Japon",img:"/assets/dest-tokyo.webp",temp:"22° en oct.",aff:"Momiji tout proche",ideal:"Idéal 8-12 jours"},
 {key:"marrakech",city:"Marrakech",country:"Maroc",img:"/assets/dest-marrakech.webp",temp:"27° en oct.",aff:"Douceur parfaite",ideal:"Idéal 4-7 jours"},
 {key:"lisbonne",city:"Lisbonne",country:"Portugal",img:"/assets/dest-lisbonne.webp",temp:"23° en oct.",aff:"Basse saison douce",ideal:"Idéal 4-6 jours"},
 {key:"newyork",city:"New York",country:"États-Unis",img:"/assets/dest-newyork.webp",temp:"17° en oct.",aff:"Été indien",ideal:"Idéal 5-8 jours"}
];

export const CITYPHOTO={kl:"/assets/city-kl.webp",pen:"/assets/city-penang.webp",lgk:"/assets/city-langkawi.webp",fly:"/assets/dest-lisbonne.webp"};

export const TRV={walk:"walk",train:"train",car:"car",scoot:"scoot",boat:"plane"};

export const TRVLBL={walk:"à pied",train:"en train",car:"en voiture / Grab",scoot:"en scooter"};

export const BTOTAL = 3500;
export const BPLAN = BUDGET.reduce((a, b) => a + b.amt, 0);
export const photoOf = (c) => CITYPHOTO[c] || "/assets/dest-bali.webp";

/* Jour 4 : plan initial ou plan B météo, selon l'état */
export const day4 = (planApplied) => (planApplied ? DAY4B : DAY4A).map((x) => ({ ...x, k: x.k || "sight" }));
export const dayItems = (d, planApplied) => (d.n === 4 ? day4(planApplied) : d.items);
export const stepCount = (planApplied) => DAYS.reduce((a, d) => a + dayItems(d, planApplied).length, 0);

/* Carte : fond OpenStreetMap (760 × 900), coordonnées projetées en pixels image. */
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
export const SCOREROWS = [
  ["Météo sur vos dates", 84, "Inter-mousson douce, averses brèves"],
  ["Affluence", 78, "Hors vacances scolaires locales"],
  ["Prix vs saison", 82, "−12 % vs décembre (estimation)"],
  ["Adéquation profil", 96, "Couple · nature · gastronomie"],
  ["Adresses vérifiées", 99, "Chaque table et chaque horaire recoupés"],
];
export const TABS = [
  ["dash", "compass", "Aperçu"], ["itin", "list", "Itinéraire"], ["vols", "plane", "Vols"],
  ["hotels", "bed", "Hôtels"], ["loc", "car", "Location"], ["restos", "food", "Restos"],
  ["meteo", "cloud", "Météo"], ["budget", "wallet", "Budget"], ["check", "shield", "Check-list"],
  ["valise", "bag", "Valise"],
];
export const OB_STEPS = 8;
export const OB_HINTS = [
  "Une ville, un pays, ou juste une envie", "Même approximatives — on affinera",
  "Le rythme change selon l'équipage", "Odyssea complète autour de l'existant",
  "Un principal, un secondaire si vous voulez", "Une fourchette suffit, on s'y tient",
  "Vos règles, jamais négociées", "Le supplément d'âme de l'itinéraire",
];
export const STYLE_CARDS = [
  ["Détente", "Peu de trajets, du temps long, des lieux calmes.", "sun"],
  ["Culture & patrimoine", "Musées, quartiers historiques, architecture.", "landmark"],
  ["Aventure", "Reliefs, kayak, lever tôt, sortir des routes.", "compass"],
  ["Gastronomie", "Marchés, tables locales, une cuisine par jour.", "food"],
  ["Nature", "Mangroves, collines, plages sauvages.", "leaf"],
  ["Photo", "Lumières du matin, spots cadrés, golden hours.", "cam"],
];
/* Identité de l'éditeur — source unique pour le pied de page et les mentions. */
export const ENTITY = {
  name: "Odyssea",
  legalForm: "Entrepreneur individuel",
  siren: "985 222 603",
  siret: "985 222 603 00039",
  vat: "FR27985222603",
  ape: "6202B — Tierce maintenance de systèmes et d'applications informatiques",
  created: "11 mai 2026",
  convention: "Bureaux d'études techniques, SYNTEC (IDCC 1486)",
  email: "contact@odyssea-trip.com",
};

const E = ENTITY;

export const LEGAL = {
  mentions: ["Mentions légales", "Directeur de la publication : le représentant légal de l'entreprise. Hébergeur du site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Les contenus, textes et visuels de ce site sont protégés ; toute reproduction sans accord préalable est interdite."],
  confidentialite: ["Politique de confidentialité", "Les réponses données pendant la composition d'un voyage restent dans votre navigateur pendant la session et ne sont transmises à aucun tiers. Aucun compte n'est créé. Si vous utilisez l'assistant, votre question et le contexte du voyage sont envoyés au fournisseur du modèle pour produire la réponse, puis ne sont pas conservés. Responsable de traitement : " + E.name + " — " + E.email + "."],
  donnees: ["Vos droits (RGPD)", `Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données. Aucune donnée n'étant conservée après la fermeture de l'onglet, l'effacement est immédiat. Pour toute demande, écrivez à ${E.email}. Vous pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).`],
  cookies: ["Politique cookies", "Seuls des cookies strictement nécessaires sont déposés par défaut. La mesure d'audience et la personnalisation ne sont activées qu'après accord explicite, révocable à tout moment depuis « Gérer mes cookies »."],
  cgu: ["Conditions générales d'utilisation", `Odyssea propose des itinéraires à titre indicatif. Horaires, prix, disponibilités et conditions d'entrée doivent être vérifiés auprès des prestataires avant tout déplacement. Odyssea n'agit pas en qualité d'agence de voyages et ne procède à aucune vente de forfait touristique. Pour toute question : ${E.email}.`],
  accessibilite: ["Accessibilité", "L'interface vise le niveau AA du RGAA : contrastes vérifiés, navigation au clavier, libellés explicites, respect de « réduire les animations ». Signalez-nous toute difficulté à " + E.email + "."],
};
