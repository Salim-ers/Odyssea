"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../lib/icons";

/* Écran de génération.

   La progression affichée est la vraie : chaque appel écrit une phase en base
   et renvoie ce qui a été produit. Rien n'est simulé, et une génération
   interrompue reprend à la phase suivante plutôt qu'au début. */

const PHASES = [
  { key: "plan", label: "Recherche de la destination et de la saison" },
  { key: "days", label: "Composition des journées, heure par heure" },
  { key: "practical", label: "Transport, formalités, valise et pièges" },
];

export default function Generating({ tripId, totalDays, onDone, onError }) {
  const [phase, setPhase] = useState("plan");
  const [written, setWritten] = useState(0);
  const [note, setNote] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !tripId) return;
    started.current = true;
    let cancelled = false;

    (async () => {
      /* Une passe par phase ; les journées prennent plusieurs passes. */
      for (let guard = 0; guard < 40 && !cancelled; guard++) {
        let res;
        try {
          res = await fetch(`/api/trips/${tripId}/generate`, { method: "POST" });
        } catch {
          if (!cancelled) onError("Connexion interrompue pendant la composition.");
          return;
        }
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (!cancelled) onError(data.error || "La composition a échoué.");
          return;
        }
        if (cancelled) return;

        setPhase(data.phase);
        if (data.progress) setWritten(data.progress.written);
        if (data.degraded?.length) {
          setNote("Certaines options avancées du modèle ne sont pas disponibles — la composition continue.");
        }
        if (data.done) {
          onDone();
          return;
        }
      }
      if (!cancelled) onError("La composition prend trop de temps. Reprenez depuis « Mes voyages ».");
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId, onDone, onError]);

  const activeIndex = PHASES.findIndex((p) => p.key === phase);
  const pct = totalDays ? Math.round((written / totalDays) * 100) : 0;

  return (
    <div id="loader" className="on-dark">
      <div className="gen-grid">
        <div>
          <div className="gen-orbrow">
            <span className="gen-orb" />
            <span className="gen-kicker">Composition en cours</span>
          </div>
          <h1 className="gen-title">
            Nous cherchons,
            <br />
            nous vérifions,
            <br />
            nous composons.
          </h1>

          <div className="gen-steps">
            {PHASES.map((p, i) => (
              <div
                key={p.key}
                className={"gen-step" + (i < activeIndex ? " done" : i === activeIndex ? " run" : "")}
              >
                <span className="m">{i < activeIndex ? "✓" : i + 1}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>

          <div className="gen-ctarow">
            <span className="gen-progress">
              {phase === "days" && totalDays
                ? `${written} journée${written > 1 ? "s" : ""} sur ${totalDays} · ${pct} %`
                : "Recherche sur le web en direct…"}
            </span>
          </div>

          {note && <p className="gen-note">{note}</p>}
          <p className="gen-note">
            Odyssea consulte de vraies pages pour les compagnies, les quartiers, les tables et les
            horaires. Comptez une à trois minutes.
          </p>
        </div>

        <div className="gen-art" aria-hidden="true">
          <svg viewBox="0 0 420 420">
            <circle className="draw" cx="210" cy="210" r="150" fill="none" stroke="rgba(252,251,248,.16)" strokeWidth="1" />
            <circle className="draw d2" cx="210" cy="210" r="110" fill="none" stroke="rgba(252,251,248,.12)" strokeWidth="1" />
            <circle className="draw d3" cx="210" cy="210" r="70" fill="none" stroke="rgba(252,251,248,.1)" strokeWidth="1" />
            <path
              className="draw gold"
              d="M70 300 C 150 220 200 180 280 130 C 310 112 340 104 366 98"
              fill="none"
            />
            <g className="gen-pin" style={{ animationDelay: ".6s" }}>
              <circle cx="70" cy="300" r="6" fill="var(--gold)" />
            </g>
            <g className="gen-pin" style={{ animationDelay: "1.4s" }}>
              <circle cx="280" cy="130" r="6" fill="var(--gold)" />
            </g>
            <g className="gen-pin" style={{ animationDelay: "2.2s" }}>
              <circle cx="366" cy="98" r="6" fill="var(--gold)" />
            </g>
          </svg>
          <div className="gen-facts">
            <div className={"gen-fact" + (activeIndex >= 0 ? " vis" : "")}>
              <span className="k">Sources</span>
              <span className="v">Web en direct</span>
            </div>
            <div className={"gen-fact" + (activeIndex >= 1 ? " vis" : "")}>
              <span className="k">Journées</span>
              <span className="v">{totalDays || "—"}</span>
            </div>
            <div className={"gen-fact" + (activeIndex >= 2 ? " vis" : "")}>
              <span className="k">Pratique</span>
              <span className="v">Vérifié</span>
            </div>
          </div>
        </div>
      </div>
      <div className="gen-brand">
        <Icon name="compass" />
        <span>ODYSSEA</span>
      </div>
    </div>
  );
}
