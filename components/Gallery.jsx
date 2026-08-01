"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { GALS } from "../lib/data";
import { useOdyssea } from "../lib/store";

/* Glissement lent, rotation automatique suspendue au survol.

   Les photos sont posées à hauteur constante : pendant l'ouverture d'une
   carte, seule la fenêtre de découpe bouge, jamais l'image elle-même — le
   navigateur n'a donc rien à re-rastériser et le mouvement reste fluide. */
const DWELL = 5200;

export default function Gallery() {
  const [active, setActive] = useState(GALS[0].key);
  const [paused, setPaused] = useState(false);
  const { patchOb, toast } = useOdyssea();
  const timer = useRef(null);

  const step = useCallback((d = 1) => {
    setActive((k) => {
      const i = GALS.findIndex((g) => g.key === k);
      return GALS[(i + d + GALS.length) % GALS.length].key;
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setTimeout(() => step(1), DWELL);
    return () => clearTimeout(timer.current);
  }, [paused, active, step]);

  const pick = (g) => {
    setActive(g.key);
    patchOb(() => ({ dest: g.city }));
    toast(g.city + " retenue — l'exemple détaillé reste la Malaisie.");
  };

  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  };

  return (
    <section className="gallery" id="galerie">
      <div className="gal-head">
        <div>
          <div className="kicker steel">Explorer</div>
          <h2 className="sec-title" style={{ marginTop: 10 }}>Où voulez-vous respirer&nbsp;?</h2>
        </div>
        <div className="gal-dots" role="tablist" aria-label="Destinations">
          {GALS.map((g) => (
            <button key={g.key} role="tab" aria-selected={active === g.key}
              className={active === g.key ? "on" : ""} aria-label={g.city} onClick={() => pick(g)} />
          ))}
        </div>
      </div>

      <div className="gal-row" onKeyDown={onKey}
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
        {GALS.map((g) => (
          <button type="button" key={g.key} className={"gal" + (active === g.key ? " open" : "")}
            aria-label={`${g.city}, ${g.country}`} aria-expanded={active === g.key}
            onMouseEnter={() => setActive(g.key)} onFocus={() => setActive(g.key)} onClick={() => pick(g)}>
            <span className="ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.img} alt="" loading="lazy" decoding="async" draggable="false" />
            </span>
            <span className="veil" />
            <span className="closed-t">{g.city}</span>
            <span className="open-t">
              <span className="city">{g.city}</span>
              <span className="country">{g.country}</span>
              <span className="chips">
                <span className="chip">{g.temp}</span>
                <span className="chip">{g.aff}</span>
                <span className="chip gold">{g.ideal}</span>
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="gal-foot">
        <span>Survolez pour explorer · cliquez pour choisir votre destination</span>
        <span>L&apos;exemple détaillé ci-dessous explore la Malaisie</span>
      </div>
    </section>
  );
}
