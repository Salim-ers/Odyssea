"use client";
import { useEffect, useRef } from "react";
import Composer from "./Composer";

/* Scène d'ouverture : océan, logo géant, titre.

   La vidéo source est un aller-retour (32 s) : sa dernière image est
   identique à la première, il n'y a donc aucune rupture de mouvement.
   Deux lecteurs se relaient malgré tout, en fondu, pour qu'aucun
   redémarrage de décodeur ne soit visible à l'écran. */
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

    const start = () => {
      vids[0].classList.add("on");
      vids[0].play().catch(() => {});
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
            <video key={i} ref={ref} muted playsInline preload="auto"
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
          Dites-nous où, quand et avec qui : nous composons les vols, les hébergements et
          chaque journée heure par heure — vous gardez la main jusqu&apos;au départ.
        </p>
        <Composer />
      </div>
      <div className="scrollcue"><span>Découvrir</span><span className="rail" /></div>
    </section>
  );
}
