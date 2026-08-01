# Odyssea

Odyssea compose de vrais voyages : vous donnez une destination, des dates et un
profil, l'application cherche sur le web, vérifie, et écrit un itinéraire heure
par heure avec les vols, l'hébergement, le budget et les pièges du parcours.

Rien n'est pré-écrit. Il n'y a aucun jeu de données d'exemple dans le dépôt.

## Démarrer

```bash
npm install
cp .env.example .env.local   # renseignez ANTHROPIC_API_KEY
npm run dev
```

Sans `DATABASE_URL`, les comptes et les voyages sont stockés dans une base
SQLite locale (`.data/odyssea.db`), créée toute seule. C'est suffisant pour
développer ; ce n'est pas suffisant en production, où une fonction serverless
n'a pas de disque persistant.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | **Obligatoire.** Composition des voyages et assistant. Reste côté serveur. |
| `DATABASE_URL` | Postgres. Absent en local → SQLite. **Requis en production.** |
| `ODYSSEA_MODEL` | Optionnel. `claude-opus-5` par défaut. |

### Supabase

Project Settings → Database → Connection string → onglet **Transaction pooler**
(port 6543). Prenez celui-là, pas la connexion directe : un pooler en mode
transaction est ce qui convient à des fonctions serverless, qui ouvrent et
ferment une connexion à chaque appel. Remplacez `[YOUR-PASSWORD]` par le mot de
passe de la base.

Le pilote est configuré en conséquence : une connexion par instance,
requêtes préparées désactivées (un pooler en mode transaction ne les conserve
pas entre deux transactions), TLS exigé.

Les tables sont créées au premier accès — il n'y a pas de migration à lancer.

## Comment un voyage est composé

La génération se fait en trois phases, une requête par phase. Ce découpage tient
chaque appel sous la durée maximale d'une fonction serverless, et permet de
reprendre une composition interrompue sans refaire ce qui est déjà écrit.

1. **Le plan** — saison réelle sur les dates demandées, découpage en étapes,
   compagnies qui desservent l'axe, quartiers où loger, budget.
2. **Les journées** — le programme heure par heure, par lots de quatre jours.
3. **Le pratique** — transport sur place, formalités, valise, et les pièges
   réels de l'itinéraire (marges trop courtes, journées trop chargées,
   fermetures).

À chaque phase, le modèle consulte de vraies pages et cite ses sources. La
sortie est contrainte par un schéma JSON : la réponse est conforme par
construction. Le prompt interdit explicitement d'inventer un nom de lieu, un
prix ou un horaire, et impose de distinguer un prix relevé d'une estimation.

## Ce qui est réel, et ce qui ne l'est pas

| Donnée | Source | Statut |
|---|---|---|
| Itinéraire, étapes, adresses, horaires | Recherche web pendant la composition | Réel, sourcé |
| Météo | [Open-Meteo](https://open-meteo.com) — prévision sous 16 jours, moyenne des 5 dernières années au-delà | Réel |
| Aéroports (4 034, 234 pays) | [OurAirports](https://ourairports.com), domaine public | Réel |
| Prix des vols et des hôtels | Ordres de grandeur relevés à la composition | **Estimations** — les liens renvoient vers Google Flights et Booking pour les tarifs du jour |
| Réservation | — | **Aucune.** Odyssea ne vend rien et n'encaisse rien. |

Passer aux disponibilités et aux prix en direct demande un compte fournisseur
(Amadeus, Duffel, Hotelbeds…). L'interface est prête à l'accueillir : c'est
`lib/claude.js` qui produit aujourd'hui les estimations, et les écrans Vols et
Hébergement lisent déjà une liste d'options.

## Comptes

Mot de passe haché avec scrypt et un sel par compte, comparaison à temps
constant. Session par jeton aléatoire de 256 bits dans un cookie `httpOnly`,
stocké haché : une fuite de la base ne permet pas d'usurper une session.

Un voyage composé sans compte reste accessible par son identifiant, ce qui
permet de l'essayer avant de s'inscrire ; il devient privé dès qu'il est
rattaché à un compte.

## Structure

```
app/
  api/auth        inscription, connexion, session
  api/trips       création, lecture, liste
  api/trips/[id]/generate   les trois phases
  api/weather     Open-Meteo
  api/chat        assistant, relais Anthropic
  voyage/[id]     un voyage composé
  parcours        le questionnaire
  compte          inscription et connexion
  mes-voyages     la bibliothèque
lib/
  claude.js       génération (Opus 5 + recherche web + sortie contrainte)
  trip-schema.js  la forme d'un voyage
  db.js           Postgres (Supabase, Neon…) en production, SQLite en développement
  auth.js         mots de passe et sessions
  weather.js      Open-Meteo
  places.js       recherche mondiale d'aéroports et de destinations
scripts/
  build-airports.js   régénère public/data/airports.json depuis OurAirports
```

## Coût

Une composition complète appelle le modèle une fois pour le plan, une fois par
lot de quatre journées, une fois pour le pratique — avec recherche web à chaque
fois. Comptez quelques dizaines de centimes par voyage selon sa durée. Le modèle
se change par `ODYSSEA_MODEL`.
