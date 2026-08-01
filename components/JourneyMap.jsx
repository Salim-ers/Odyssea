"use client";
import { useState } from "react";
import { DAYS, MAP, STOPS, dayItems } from "../lib/data";
import { useOdyssea } from "../lib/store";
import { Icon } from "../lib/icons";
import Reveal from "./Reveal";

/* Carte réelle (fond OpenStreetMap) : trois escales, le programme jour par
   jour à côté. Les repères et le tracé sont posés en SVG aux coordonnées
   projetées de l'image — ils tombent donc exactement sur les villes. */
export default function JourneyMap() {
  const [stop, setStop] = useState("kl");
  const { S } = useOdyssea();
  const days = DAYS.filter((d) => d.c === stop);
  const current = STOPS.find((s) => s.k === stop);

  return (
    <section className="mapsec" id="methode">
      <div className="in">
        <Reveal className="map-head">
          <div className="kicker gold">Un exemple complet</div>
          <h2>Douze jours en Malaisie, heure par heure.</h2>
          <p>
            Trois escales, 59 étapes, chaque trajet compté. Choisissez une escale sur la carte :
            le programme se déroule à côté, avec la raison d&apos;être de chaque moment.
          </p>
        </Reveal>

        <div className="map-grid">
          <Reveal className="map-wrap">
            <div className="map-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="map-img" src={MAP.src} width={MAP.w} height={MAP.h}
                alt="Carte de la péninsule malaisienne : Langkawi, Penang et Kuala Lumpur"
                loading="lazy" decoding="async" draggable="false" />
              <svg className="map-pins" viewBox={`0 0 ${MAP.w} ${MAP.h}`} aria-hidden="true">
                {MAP.routes.map((d, i) => <path key={i} className="route" d={d} />)}
                {STOPS.map((st) => (
                  <g key={st.k} className={"mpin" + (stop === st.k ? " on" : "")}>
                    <circle className="halo" cx={st.x} cy={st.y} r="22" />
                    <circle className="core" cx={st.x} cy={st.y} r="7" />
                  </g>
                ))}
              </svg>
              {/* Les repères cliquables sont de vrais boutons HTML, posés en absolu. */}
              {STOPS.map((st, i) => {
                /* Passé la moitié droite, l'étiquette bascule à gauche du repère
                   pour ne pas déborder de la carte. */
                const flip = st.x / MAP.w > 0.55;
                return (
                  <button type="button" key={st.k}
                    className={"mlabel" + (flip ? " flip" : "") + (stop === st.k ? " on" : "")}
                    style={{ left: `${(st.x / MAP.w) * 100}%`, top: `${(st.y / MAP.h) * 100}%` }}
                    aria-pressed={stop === st.k} onClick={() => setStop(st.k)}>
                    <b>0{i + 1}</b>{st.name}<i>{st.n}</i>
                  </button>
                );
              })}
            </div>
            <div className="map-legend">
              <span>3 escales · 2 vols intérieurs</span>
              <span>1 100 km parcourus</span>
            </div>
            <p className="map-credit">Fond de carte © OpenStreetMap</p>
          </Reveal>

          <div className="map-side">
            <div className="stopbar" role="tablist" aria-label="Escales">
              {STOPS.map((st, i) => (
                <button type="button" key={st.k} role="tab" aria-selected={stop === st.k}
                  className={"stopbtn" + (stop === st.k ? " on" : "")} onClick={() => setStop(st.k)}>
                  <b>0{i + 1}</b>{st.name}<span>{st.n}</span>
                </button>
              ))}
            </div>

            <div className="stopnow">
              <Icon name="map" />
              <span>
                <b>{current?.name}</b>
                {days.length} journée{days.length > 1 ? "s" : ""} détaillée{days.length > 1 ? "s" : ""} ·{" "}
                {days.reduce((a, d) => a + dayItems(d, S.planApplied).length, 0)} étapes
              </span>
            </div>

            <div className="dayscroll">
              {days.map((d) => (
                <article className="dayblock" key={d.n}>
                  <header className="dhead">
                    <span className="dnum">Jour {d.n}</span>
                    <h4>{d.t}</h4>
                    <span className="ddate">{d.d}</span>
                  </header>
                  {dayItems(d, S.planApplied).map((it) => (
                    <div className="dayline" key={it.id}>
                      <span className="t">{it.t}</span>
                      <div className="dtx">
                        <b>{it.f}</b>
                        {it.s && <span>{it.s}</span>}
                        {it.why && <p className="why">{it.why}</p>}
                      </div>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
