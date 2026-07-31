"use client";
import { useEffect, useRef } from "react";
import Composer from "./Composer";

/* Scène d'ouverture : vidéo océan, logo géant, titre. */
export default function Stage() {
  const video = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) video.current?.pause();
  }, []);

  return (
    <section className="stage">
      <div className="stage-media">
        <video ref={video} autoPlay muted loop playsInline preload="auto"
          poster="/assets/ocean-poster.jpg" aria-hidden="true">
          <source src="/assets/ocean.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="stage-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="giant-logo" src="/assets/odyssea-logo-white.png" alt="Odyssea — planifiez, explorez, vivez" />
        <h1 className="stage-title">Votre voyage,<br /><em>imaginé</em> avec vous.</h1>
        <p className="stage-sub">
          Une destination, quelques réponses, et tout s&apos;organise : vols, séjour, journées
          entières — sans jamais rien vous imposer.
        </p>
        <Composer />
      </div>
      <div className="scrollcue"><span>Découvrir</span><span className="rail" /></div>
    </section>
  );
}
