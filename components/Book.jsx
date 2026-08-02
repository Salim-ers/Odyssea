"use client";
import { goLink, partnersFor, KINDS } from "../lib/partners";
import { Icon } from "../lib/icons";

/* Les sorties commerciales.

   Le composant ne connaît aucune URL : il demande au registre les partenaires
   d'une catégorie disponibles dans le pays, et construit des liens qui passent
   par notre redirection — laquelle compte le clic et ajoute l'identifiant
   d'affiliation hors du navigateur.

   Un pays sans partenaire pour cette catégorie n'affiche rien, plutôt qu'un
   lien qui mènerait à une page vide. */

const VERB = {
  flight: "Comparer les vols",
  stay: "Voir les hébergements",
  transfer: "Réserver le transfert",
  car: "Louer une voiture",
  train: "Trains et bus",
  ride: "Ouvrir",
  activity: "Voir les activités",
  esim: "Commander une eSIM",
  gear: "Trouver l'équipement",
};

export default function Book({ kind, country, params = {}, tripId, slot, label, compact }) {
  const list = partnersFor(kind, country);
  if (!list.length) return null;

  return (
    <div className={"book" + (compact ? " compact" : "")}>
      {!compact && <span className="book-l">{label || VERB[kind] || KINDS[kind]}</span>}
      <span className="book-row">
        {list.map((p) => (
          <a key={p.id} className="book-a"
            href={goLink(p.id, { ...params, country }, { tripId, slot })}
            target="_blank" rel="noopener nofollow sponsored">
            {p.name}
            <Icon name="send" />
          </a>
        ))}
      </span>
    </div>
  );
}
