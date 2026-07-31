# Odyssea — Next.js

Compagnon de voyage : quelques réponses, et Odyssea compose l'itinéraire heure par heure,
note les vols, justifie les hébergements, tient le budget et veille sur le voyage jusqu'au
retour. Démo complète sur la Malaisie (12 jours, 59 étapes).

**Next.js 14 · App Router · JavaScript · aucune dépendance UI.**

---

## Démarrer

```bash
npm install
cp .env.example .env.local     # collez votre clé Anthropic
npm run dev                    # http://localhost:3000
```

Sans clé, tout fonctionne : l'assistant bascule sur ses réponses préparées.

## Déployer sur Vercel

1. `git init && git add . && git commit -m "Odyssea"`, puis poussez sur GitHub.
2. Sur vercel.com : *Add New → Project → Import*. Next.js est détecté automatiquement,
   aucune configuration à saisir.
3. *Settings → Environment Variables* : `ANTHROPIC_API_KEY` (Production, Preview,
   Development). Redéployez.

Ou en CLI : `npx vercel` puis `npx vercel --prod`.

## Routes

| Route        | Rendu     | Contenu |
|--------------|-----------|---------|
| `/`          | statique  | Vidéo, logo géant, barre de recherche, galerie, carte du voyage, pied de page RGPD |
| `/parcours`  | statique  | Les 8 étapes puis l'écran de génération |
| `/voyage`    | statique  | Les 10 onglets du voyage + assistant |
| `/api/chat`  | serverless| Relais vers l'API Anthropic, clé côté serveur |

## Structure

```
app/
  layout.js            Racine : polices, provider d'état, toasts, modales
  page.js              Accueil
  parcours/page.js     Parcours en 8 étapes
  voyage/page.js       Application à onglets
  api/chat/route.js    Route Handler de l'assistant
  globals.css          Design system complet (tokens, écrans, responsive)
components/
  Navbar, Stage, Composer, Gallery, JourneyMap, Footer, CookieBar,
  Onboarding, Generating, Ring, Reveal, Wordmark, Toasts, ModalHost
components/trip/
  TripApp, Chrome, Dashboard, Itinerary, Flights, Stays, Rentals,
  Restaurants, Weather, Budget, Checklist, Packing, Assistant
lib/
  data.js              Fixtures (aucun accès au DOM, importables partout)
  store.jsx            Contexte React : état du voyage + actions
  icons.jsx            Jeu d'icônes + <Icon> et <Chip>
public/assets/         Vidéo, logo (3 déclinaisons), photos d'ambiance
```

## Ce que le passage à React a apporté

- **La saisie ne peut plus casser.** Les champs de la barre de recherche sont contrôlés ;
  l'ancienne version régénérait le DOM à chaque clic et détruisait le champ en cours de
  frappe.
- **Un seul état partagé** (`lib/store.jsx`) : plan B météo, détecteur de regrets, jauge
  de préparation, cases cochées, scénario. Les corrections de regrets modifient réellement
  l'itinéraire, comme avant.
- **Le rendu HTML est fait au build** pour les trois pages : premier affichage immédiat,
  bon pour le référencement.
- **La clé API ne quitte jamais le serveur** grâce au Route Handler.

## L'assistant

`components/trip/Assistant.jsx` appelle `/api/chat`. En cas d'échec (pas de clé, réseau
coupé), il répond avec des réponses préparées choisies par mots-clés — jamais d'écran
vide. Le prompt système décrit tout le voyage et impose le vouvoiement ainsi que les
règles de curation.

## Options

**Auto-héberger les polices** (recommandé en production, supprime la requête vers Google) :

```js
// app/layout.js
import { Sora, DM_Sans } from "next/font/google";
const sora = Sora({ subsets: ["latin"], weight: ["200","300","400","500","600","700"], variable: "--font-sora" });
const dm = DM_Sans({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-dm" });
// <html className={`${sora.variable} ${dm.variable}`}> puis dans globals.css :
// --sora: var(--font-sora), sans-serif;  --dm: var(--font-dm), system-ui, sans-serif;
```

**Persister l'état** : le store est volontairement en mémoire. Pour survivre au
rechargement, brancher `localStorage` dans `OdysseaProvider` ou une base côté serveur.

## À renseigner avant une mise en ligne

- Hébergeur et adresse du DPO dans `LEGAL` (`lib/data.js`).
- Les données de voyage sont des fixtures : à remplacer par vos sources réelles.
- Les photos d'ambiance sont issues de la maquette.
