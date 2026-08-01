"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Wordmark from "./Wordmark";
import { useOdyssea, LOCKED } from "../lib/store";

/* Transparente sur la vidéo, verre clair une fois la scène passée. */
export default function Navbar() {
  const [solid, setSolid] = useState(false);
  const { user, patchOb } = useOdyssea();
  const router = useRouter();

  /* Partir composer depuis l'accueil, c'est partir avec ce que la barre de
     recherche affiche : le questionnaire n'a pas à le redemander. */
  const compose = () => {
    patchOb((ob) => ({ fixed: { ...ob.fixed, ...Object.fromEntries(LOCKED.map((k) => [k, true])) } }));
    router.push("/parcours");
  };

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <nav className={"navbar" + (solid ? " solid" : "")}>
      <div className="in">
        <Wordmark />
        <div className="navlinks">
          <a href="#galerie">Explorer</a>
          <a href="#methode">L&apos;exemple</a>
          {user && <Link className="link" href="/mes-voyages">Mes voyages</Link>}
          <a className="nav-cta" href="/parcours"
            onClick={(e) => { e.preventDefault(); compose(); }}>Créer mon voyage</a>
        </div>
      </div>
    </nav>
  );
}
