"use client";
import { useEffect, useRef, useState } from "react";
import { GALS } from "../lib/data";
import { useOdyssea } from "../lib/store";

/* Glissement lent, rotation automatique suspendue au survol. */
export default function Gallery() {
  const [active, setActive] = useState("bali");
  const [auto, setAuto] = useState(true);
  const { patchOb, toast } = useOdyssea();
  const timer = useRef(null);

  useEffect(() => {
    if (!auto) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(() => {
      setActive((k) => GALS[(GALS.findIndex((g) => g.key === k) + 1) % GALS.length].key);
    }, 4600);
    return () => clearInterval(timer.current);
  }, [auto]);

  const pick = (g) => {
    setActive(g.key);
    patchOb(() => ({ dest: g.city }));
    toast(g.city + " retenue — l'exemple détaillé reste la Malaisie.");
  };

  return (
    <section className="gallery" id="galerie">
      <div className="gal-head">
        <div>
          <div className="kicker steel">Explorer</div>
          <h2 className="sec-title" style={{ marginTop: 10 }}>Où voulez-vous respirer&nbsp;?</h2>
        </div>
        <div className="gal-dots">
          {GALS.map((g) => (
            <button key={g.key} className={active === g.key ? "on" : ""} aria-label={g.city} onClick={() => pick(g)} />
          ))}
        </div>
      </div>
      <div className="gal-row" onMouseEnter={() => setAuto(false)} onMouseLeave={() => setAuto(true)}>
        {GALS.map((g) => (
          <button key={g.key} className={"gal" + (active === g.key ? " open" : "")} aria-label={g.city}
            onMouseEnter={() => setActive(g.key)} onFocus={() => setActive(g.key)} onClick={() => pick(g)}>
            <span className="ph" style={{ backgroundImage: `url(${g.img})` }} />
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
