"use client";
import { useEffect, useRef } from "react";
import Composer from "./Composer";

/* Scène d'ouverture : océan, logo géant, titre.

   Deux lecteurs se relaient en fondu de 800 ms : c'est ce fondu qui rend la
   boucle invisible, et non une propriété de la vidéo. Un seul lecteur
   laisserait voir le redémarrage du décodeur, quelle que soit la source.

   La source n'a donc pas à être un aller-retour. Il suffit que sa dernière
   image ressemble à la première — même horizon, même lumière — ce que le
   fondu achève de raccorder. */
export default function Stage() {
  const a = useRef(null);
  const b = useRef(null);

  useEffect(() => {
    const vids = [a.current, b.current];
    if (!vids[0] || !vids[1]) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      vids[0].classList.add("on");
      return;
    }

    const FADE = 800; // doit rester égal à la transition CSS
    let cur = 0;
    let timer;
    let stopped = false;

    const schedule = () => {
      if (stopped) return;
      const v = vids[cur];
      const d = v.duration;
      if (!d || !isFinite(d)) {
        timer = setTimeout(schedule, 400);
        return;
      }
      timer = setTimeout(swap, Math.max(120, (d - v.currentTime) * 1000 - FADE));
    };

    const swap = () => {
      if (stopped) return;
      const out = vids[cur];
      const inn = vids[1 - cur];
      inn.currentTime = 0;
      inn.classList.add("on");
      inn.play().catch(() => {});
      out.classList.remove("on");
      cur = 1 - cur;
      setTimeout(() => {
        if (stopped) return;
        out.pause();
        out.currentTime = 0;
      }, FADE + 120);
      schedule();
    };

    /* Le second lecteur ne charge qu'une fois le premier servi.

       Les deux pointent sur le même fichier : lancés ensemble, ils partent en
       deux téléchargements parallèles avant qu'aucun n'ait rempli le cache —
       la vidéo arrivait donc deux fois sur le réseau. En attendant que le
       premier tienne, le second la lit dans le cache. */
    const warmSecond = () => {
      if (stopped || vids[1].readyState >= 2) return;
      vids[1].preload = "auto";
      vids[1].load();
    };

    const start = () => {
      vids[0].classList.add("on");
      vids[0].play().catch(() => {});
      if (vids[0].readyState >= 4) warmSecond();
      else vids[0].addEventListener("canplaythrough", warmSecond, { once: true });
      schedule();
    };

    if (vids[0].readyState >= 1) start();
    else vids[0].addEventListener("loadedmetadata", start, { once: true });

    /* Certains navigateurs suspendent la lecture en arrière-plan :
       on resynchronise au retour sur l'onglet. */
    const onVisible = () => {
      if (document.hidden || stopped) return;
      vids[cur].play().catch(() => {});
      clearTimeout(timer);
      schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <section className="stage">
      <div className="stage-media">
        <div className="stage-pan">
          {[a, b].map((ref, i) => (
            <video key={i} ref={ref} muted playsInline
              /* Le relais attend son tour : voir warmSecond ci-dessus. */
              preload={i === 0 ? "auto" : "none"}
              poster="/assets/ocean-poster.jpg" aria-hidden="true" tabIndex={-1}>
              <source src="/assets/ocean-loop.mp4" type="video/mp4" />
            </video>
          ))}
        </div>
      </div>
      <div className="stage-body">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="giant-logo" src="/assets/odyssea-logo-white.png" alt="Odyssea — planifiez, explorez, vivez" />
        <h1 className="stage-title">
          Le voyage sur mesure,<br />
          <em>sans les semaines</em> de préparation.
        </h1>
        <p className="stage-sub">
          Dites-nous où, quand et avec qui — nous composons tout le reste, heure par heure.
        </p>
        <Composer />
      </div>

      {/* L'avion glisse le long de sa trajectoire et invite à descendre. */}
      <button type="button" className="scrollcue" aria-label="Découvrir la suite"
        onClick={() => document.getElementById("galerie")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
        <svg className="cue-path" viewBox="0 0 120 46" aria-hidden="true">
          <path className="trail" d="M4 8 C 34 8 46 20 60 30 C 74 40 88 40 116 40" />
          <path className="trail lead" d="M4 8 C 34 8 46 20 60 30 C 74 40 88 40 116 40" />
          <g className="cue-plane">
            <path d="M0 -5 L11 0 L0 5 L2.6 0 Z" />
          </g>
        </svg>
      </button>
    </section>
  );
}
