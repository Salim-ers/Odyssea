"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Wordmark from "./Wordmark";
import ParcoursMap from "./ParcoursMap";
import { Icon } from "../lib/icons";
import { showCost, summary } from "../lib/usage";

/* L'écran de composition.

   Tout ce qui s'affiche ici est mesuré. Le serveur diffuse en NDJSON ce que
   le modèle fait réellement — les recherches qui partent, leur libellé, les
   tokens écrits — et l'avancement en découle. Il ne peut donc plus rester
   figé pendant qu'une phase travaille, ce qui était le défaut : la barre
   sautait de 12 % à 24 % et ne bougeait pas entre les deux.

   L'attente montre la carte du voyage plutôt qu'une animation décorative. */

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

/** Lit un flux NDJSON ligne à ligne, sans attendre la fin. */
async function* lines(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut;
    while ((cut = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, cut).trim();
      buffer = buffer.slice(cut + 1);
      if (line) {
        try {
          yield JSON.parse(line);
        } catch {
          /* Une ligne tronquée n'a pas à interrompre la composition. */
        }
      }
    }
  }
}

export default function Generating({ tripId, totalDays, ob, onDone, onError }) {
  const dests = ob?.dests || [];
  const [phase, setPhase] = useState("plan");
  const [value, setValue] = useState(0);
  const [written, setWritten] = useState(0);
  const [doing, setDoing] = useState(null);
  const [note, setNote] = useState(null);
  const [spent, setSpent] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [failure, setFailure] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(false);

  /* Les rappels sont recréés à chaque rendu du parent. S'ils entraient dans
     les dépendances de l'effet, son nettoyage annulerait la requête en vol et
     le résultat serait perdu sans un mot. */
  const cb = useRef({ onDone, onError });
  cb.current = { onDone, onError };

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (started.current || !tripId) return;
    started.current = true;
    let cancelled = false;

    (async () => {
      /* Une passe par phase ; les journées en prennent plusieurs. La garde
         couvre le pire cas raisonnable : trente nuits par lots de quatre. */
      for (let guard = 0; guard < 14 && !cancelled; guard++) {
        let res;
        try {
          res = await fetch(`/api/trips/${tripId}/generate`, { method: "POST" });
        } catch {
          if (!cancelled) {
            setFailure({ message: "Connexion interrompue pendant la composition.", retryable: true });
          }
          return;
        }
        if (!res.ok || !res.body) {
          if (!cancelled) {
            setFailure({ message: "La composition n'a pas pu démarrer.", retryable: true });
          }
          return;
        }

        let ended = false;
        for await (const e of lines(res)) {
          if (cancelled) return;
          if (e.t === "phase") {
            setPhase(e.phase);
            setValue((v) => Math.max(v, e.base));
            if (e.written != null) setWritten(e.written);
            setDoing(null);
          } else if (e.t === "search") {
            setDoing(e.query);
          } else if (e.t === "progress") {
            /* L'avancement ne recule jamais : un retour en arrière visuel
               donnerait l'impression d'un travail défait. */
            setValue((v) => Math.max(v, e.value));
          } else if (e.t === "phase-done") {
            setValue((v) => Math.max(v, e.value));
            setDoing(null);
            if (e.written != null) setWritten(e.written);
            if (e.usage) setSpent(e.usage);
            if (e.degraded?.length) {
              setNote("Certaines options avancées du modèle ne sont pas disponibles — la composition continue.");
            }
          } else if (e.t === "done") {
            ended = true;
            setValue(1);
            return cb.current.onDone();
          } else if (e.t === "continue") {
            ended = true;
          } else if (e.t === "error") {
            setFailure({ message: e.message, retryable: Boolean(e.retryable) });
            return;
          }
        }

        /* Le flux s'est terminé sans conclure : la fonction a probablement été
           coupée. On le dit plutôt que de boucler dans le vide. */
        if (!ended) {
          if (!cancelled) {
            setFailure({
              message: "La composition a été interrompue avant la fin de cette étape.",
              retryable: true,
            });
          }
          return;
        }
      }
      if (!cancelled) {
        setFailure({ message: "La composition prend plus de temps que prévu.", retryable: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId, attempt]);

  const retry = useCallback(() => {
    setFailure(null);
    setDoing(null);
    started.current = false;
    setAttempt((n) => n + 1);
  }, []);

  const active = PHASES.findIndex((p) => p.key === phase);
  const pct = Math.round(value * 100);
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

        {/* L'avancement vient du flux du modèle : recherches parties et tokens
            écrits. Il n'y a rien à simuler. */}
        <div className="gen-bar-prog" style={{ "--p": value }}>
          <span className="rail">
            <span className="track" />
            <span className="fill" />
          </span>
          <span className="pct mono">{pct} %</span>
        </div>

        {/* Ce que la composition est en train de faire, à la seconde. */}
        {!failure && (
          <p className={"gen-doing" + (doing ? " on" : "")}>
            <Icon name={doing ? "compass" : "spark"} />
            <span>{doing ? `Recherche : ${doing}` : "Rédaction en cours…"}</span>
          </p>
        )}

        {failure && (
          <div className="gen-fail" role="alert">
            <span className="ic"><Icon name="alert" /></span>
            <div>
              <b>{failure.retryable ? "La composition est en pause" : "La composition s'est arrêtée"}</b>
              <p>{failure.message}</p>
              <div className="acts">
                <button className="btn btn-gold" onClick={retry}>
                  <Icon name="spark" />
                  Reprendre la composition
                </button>
                <button className="btn btn-line" onClick={() => cb.current.onError(null)}>
                  Revenir aux questions
                </button>
              </div>
              {failure.retryable && (
                <p className="keep">
                  Ce qui a déjà été écrit est conservé : la reprise repart de la phase suivante.
                </p>
              )}
            </div>
          </div>
        )}

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
              {i === active && !failure && <span className="pulse" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <ParcoursMap ob={ob} step={7 + Math.round(value * 3)} total={11} />

        {showCost() && spent && <p className="gen-spent mono">{summary(spent)}</p>}
        {note && <p className="gen-note">{note}</p>}
        <p className="gen-note">
          Chaque prix non relevé sur une page sera annoncé comme une estimation. Rien n&apos;est inventé
          de mémoire.
        </p>
      </div>
    </div>
  );
}
