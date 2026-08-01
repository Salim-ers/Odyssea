"use client";
import Link from "next/link";

/* Le mot-symbole, dans la lettre de l'emblème : capitales serif fines et
   très espacées, le A final repris en chevron. Ce chevron est un V de la
   même fonte retourné — il garde donc exactement les mêmes empattements
   et la même modulation de trait que le reste du mot.

   `mark` ajoute l'emblème au-dessus : c'est la version des barres
   intérieures, où la marque est centrée et donnée en grand. */
export default function Wordmark({ href = "/", mark = false }) {
  return (
    <Link className={"wordmark" + (mark ? " stacked" : "")} href={href} aria-label="Odyssea, accueil">
      {mark && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img className="wm-mark" src="/assets/odyssea-logo-white.png" alt="" aria-hidden="true" />
      )}
      <span className="wm-word">
        <span className="wm-letters" aria-hidden="true">Odysse</span>
        <span className="wm-lam" aria-hidden="true">V</span>
      </span>
    </Link>
  );
}
