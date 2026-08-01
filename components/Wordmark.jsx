"use client";
import Link from "next/link";

/* Le mot-symbole, dans la lettre de l'emblème : capitales serif fines, très espacées. */
export default function Wordmark({ href = "/" }) {
  return (
    <Link className="wordmark" href={href} aria-label="Odyssea, accueil">
      <span className="wm-letters">Odyssea</span>
    </Link>
  );
}
