"use client";
import { useEffect, useState } from "react";
import { Icon } from "../lib/icons";

const STEPS = [
  "Lecture de votre profil : couple, tables certifiées, nature",
  "Analyse de la Malaisie début octobre (inter-mousson)",
  "Curation des adresses, ville par ville",
  "Composition des 12 journées, prières incluses",
  "Vérification des enchaînements et des marges",
  "Calcul du budget réel, ligne par ligne",
  "Détection des regrets probables… 3 trouvés",
];
const FACTS = [
  ["Escales", "3 villes"], ["Étapes", "59 moments"], ["Vols", "4 comparés"],
  ["Adresses", "10 vérifiées"], ["Budget", "3 185 €"], ["Pièges", "3 évités"],
];

export default function Generating({ onDone }) {
  const [i, setI] = useState(0);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (i >= STEPS.length) return;
    const t = setTimeout(() => setI((v) => v + 1), reduced ? 80 : 520);
    return () => clearTimeout(t);
  }, [i, reduced]);

  const done = i >= STEPS.length;
  const pct = Math.round((Math.min(i, STEPS.length) / STEPS.length) * 100);

  return (
    <div id="loader" role="status" aria-label="Génération du voyage">
      <div className="gen-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/odyssea-mark.png" alt="" height={26} />
        <span>ODYSSEA</span>
      </div>
      <div className="gen-grid">
        <div>
          <div className="gen-orbrow"><span className="gen-orb" aria-hidden="true" /><span className="gen-kicker">Odyssea assemble votre séjour</span></div>
          <h1 className="gen-title">Votre voyage<br />prend forme.</h1>
          <div className="gen-steps">
            {STEPS.map((s, k) => (
              <div key={s} className={"gen-step" + (k < i ? " done" : k === i ? " run" : "")}>
                <span className="m">{k < i ? <Icon name="check" /> : ""}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <div className="gen-ctarow">
            <button className="btn btn-gold" disabled={!done} onClick={onDone}>
              {done ? "Ouvrir mon voyage" : "Ouverture du voyage…"}
            </button>
            <span className="gen-progress">{pct} %</span>
          </div>
        </div>
        <div className="gen-art">
          <svg viewBox="0 0 520 460" aria-hidden="true">
            <g fill="none" stroke="rgba(93,130,168,.34)" strokeWidth="1">
              <path className="draw d1" d="M62 306 C 96 250 150 232 196 246 C 236 258 268 232 314 240 C 366 249 420 236 458 262" />
              <path className="draw d2" d="M40 350 C 92 288 168 276 214 292 C 262 309 292 278 344 286 C 404 295 456 280 492 310" />
              <path className="draw d3" d="M28 398 C 88 330 180 318 232 338 C 286 358 316 322 372 332 C 434 342 486 326 512 358" />
            </g>
            <path className="draw gold d4" d="M118 268 C 168 196 214 214 258 176 C 302 138 352 172 404 128" />
            <g>
              {[[150, 250], [232, 214], [300, 190], [356, 168], [404, 132], [196, 246]].map(([x, y], k) => (
                <circle key={k} className="gen-pin" cx={x} cy={y} r="4.5" fill="#E9B75C"
                  style={{ animationDelay: 1.6 + k * 0.22 + "s" }} />
              ))}
            </g>
          </svg>
          <div className="gen-facts">
            {FACTS.map(([k, v], n) => (
              <div key={k} className={"gen-fact" + (i > n ? " vis" : "")}>
                <div className="k">{k}</div><div className="v">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
