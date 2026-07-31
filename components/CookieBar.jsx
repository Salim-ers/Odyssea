"use client";
import { useOdyssea } from "../lib/store";
import { CookiePrefs } from "./Footer";

export default function CookieBar() {
  const { S, actions, setModal } = useOdyssea();
  if (S.cookies.set) return null;
  return (
    <div className="cookiebar" role="dialog" aria-label="Gestion des cookies">
      <p>
        <b>Vos données restent chez vous.</b> Seuls les cookies nécessaires au fonctionnement sont
        actifs par défaut. Vous pouvez accepter la mesure d&apos;audience, ou refuser sans perdre la
        moindre fonctionnalité.
      </p>
      <div className="acts">
        <button className="btn btn-quiet small" onClick={() => setModal(<CookiePrefs />)}>Personnaliser</button>
        <button className="btn btn-line small" onClick={() => actions.cookies(false)}>Refuser</button>
        <button className="btn btn-gold small" onClick={() => actions.cookies(true)}>Tout accepter</button>
      </div>
    </div>
  );
}
