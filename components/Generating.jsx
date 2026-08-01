"use client";
import { useEffect, useRef, useState } from "react";
import Wordmark from "./Wordmark";
import ParcoursMap from "./ParcoursMap";
import { Icon } from "../lib/icons";

/* L'écran de composition.

   La progression affichée est la vraie : chaque appel écrit une phase en base
   et renvoie ce qui a été produit. Rien n'est simulé, et une génération
   interrompue reprend à la phase suivante plutôt qu'au début.

   L'attente montre la carte du voyage plutôt qu'une animation décorative :
   c'est déjà le voyage qui se dessine, sur le même fond que partout ailleurs. */

const PHASES = [
  {
    key: "plan",
    label: "La destination et la saison",
    detail: "Compagnies, quartiers, climat réel sur vos dates.",
  },
  {
    key: "days",
    label: "Les journées, heure par heure",
    detail: "Lieux réels, horaires vérifiés, trajets comptés.",
  },
  {
    key: "practical",
    label: "Le pratique et les pièges",
    detail: "Transport sur place, formalités, valise, marges trop courtes.",
  },
];

export default function Generating({ tripId, totalDays, ob, onDone, onError }) {
  const dests = ob?.dests || [];
  const [phase, setPhase] = useState("plan");
  const [written, setWritten] = useState(0);
  const [note, setNote] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(false);

  /* Un compteur honnête : on annonce une durée, on montre celle qui court. */
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

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
        if (data.done) return onDone();
      }
      if (!cancelled) onError("La composition prend trop de temps. Reprenez depuis « Mes voyages ».");
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId, onDone, onError]);

  const active = PHASES.findIndex((p) => p.key === phase);
  const dayPart = totalDays ? Math.min(1, written / totalDays) : 0;
  /* L'avancement global : le plan vaut un quart, les journées la moitié, le
     pratique le dernier quart. */
  const done = active < 0 ? 0 : active === 0 ? 0.12 : active === 1 ? 0.25 + dayPart * 0.55 : 0.88;
  const pct = Math.round(done * 100);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="gen">
      <div className="gen-bar">
        <span className="onb-bar-side" />
        <Wordmark mark />
        <div className="onb-recap">
          <b>{dests.join(" · ") || "Votre voyage"}</b>
          <span className="sep" />
          <span className="mono">{mm}:{ss}</span>
        </div>
      </div>

      <div className="gen-wrap">
        <div className="gen-head">
          <span className="kicker gold">Composition en cours</span>
          <h1>
            Nous cherchons, nous vérifions,
            <br />
            nous composons.
          </h1>
          <p>
            Odyssea consulte de vraies pages pour les compagnies, les quartiers, les tables et les
            horaires. Comptez une à trois minutes — vous pouvez rester ici.
          </p>
        </div>

        {/* La barre porte l'avancement réel, pas une estimation de confort. */}
        <div className="gen-bar-prog" style={{ "--p": done }}>
          <span className="rail">
            <span className="track" />
            <span className="fill" />
          </span>
          <span className="pct mono">{pct} %</span>
        </div>

        <ol className="gen-phases">
          {PHASES.map((p, i) => (
            <li key={p.key} className={i < active ? "done" : i === active ? "run" : ""}>
              <span className="m" aria-hidden="true">
                {i < active ? <Icon name="check" /> : <b>{i + 1}</b>}
              </span>
              <span className="tx">
                <b>{p.label}</b>
                <i>
                  {i === 1 && active === 1 && totalDays
                    ? `${written} journée${written > 1 ? "s" : ""} écrite${written > 1 ? "s" : ""} sur ${totalDays}`
                    : p.detail}
                </i>
              </span>
              {i === active && <span className="pulse" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        {/* La carte du voyage, déjà : c'est elle qu'on attend. La composition
            est courte, donc on part d'un cadrage déjà proche plutôt que d'une
            vue monde qu'on n'aurait pas le temps de quitter. */}
        <ParcoursMap ob={ob} step={7 + Math.round(done * 3)} total={11} />

        {note && <p className="gen-note">{note}</p>}
        <p className="gen-note">
          Chaque prix non relevé sur une page sera annoncé comme une estimation. Rien n&apos;est inventé
          de mémoire.
        </p>
      </div>
    </div>
  );
}
