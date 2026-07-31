"use client";
import Link from "next/link";

/* ODYSSE + chevron : le A final repris de l'emblème. */
export default function Wordmark({ href = "/" }) {
  return (
    <Link className="wordmark" href={href} aria-label="Odyssea, accueil">
      ODYSSE
      <svg className="lam" viewBox="0 0 12 14" aria-hidden="true">
        <path d="M1.2 13.2L6 1.4l4.8 11.8" />
      </svg>
    </Link>
  );
}
