"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Wordmark from "./Wordmark";
import { useOdyssea } from "../lib/store";

/* Transparente sur la vidéo, verre clair une fois la scène passée. */
export default function Navbar() {
  const [solid, setSolid] = useState(false);
  const { S } = useOdyssea();

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
          {S.started && <Link className="link" href="/voyage">Mon voyage</Link>}
          <Link className="nav-cta" href="/parcours">Créer mon voyage</Link>
        </div>
      </div>
    </nav>
  );
}
