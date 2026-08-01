"use client";
import Link from "next/link";

/* Le mot-symbole, dans la lettre de l'emblème : capitales serif fines et
   très espacées, le A final repris en chevron. Ce chevron est un V de la
   même fonte retourné — il garde donc exactement les mêmes empattements
   et la même modulation de trait que le reste du mot. */
export default function Wordmark({ href = "/" }) {
  return (
    <Link className="wordmark" href={href} aria-label="Odyssea, accueil">
      <span className="wm-letters" aria-hidden="true">Odysse</span>
      <span className="wm-lam" aria-hidden="true">V</span>
    </Link>
  );
}
