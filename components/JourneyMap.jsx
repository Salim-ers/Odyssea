"use client";
import { useState } from "react";
import { DAYS, STOPS, dayItems } from "../lib/data";
import { useOdyssea } from "../lib/store";
import Reveal from "./Reveal";

/* Carte géante : trois escales, le programme jour par jour à côté. */
export default function JourneyMap() {
  const [stop, setStop] = useState("kl");
  const { S } = useOdyssea();
  const days = DAYS.filter((d) => d.c === stop);

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
            <svg viewBox="0 0 300 420" role="img" aria-label="Carte du voyage en Malaisie">
              <g className="sea-grid">
                {Array.from({ length: 8 }, (_, i) => <line key={"h" + i} x1="0" y1={i * 56} x2="300" y2={i * 56} />)}
                {Array.from({ length: 6 }, (_, i) => <line key={"v" + i} x1={i * 60} y1="0" x2={i * 60} y2="420" />)}
              </g>
              <path className="land" d="M137 22 C 168 44 182 78 186 118 C 190 158 206 186 214 218 C 222 252 214 292 196 330 C 180 364 168 396 152 404 C 140 410 134 392 132 366 C 130 336 120 316 112 292 C 102 262 96 230 96 196 C 96 156 104 112 114 74 C 120 50 128 30 137 22 Z" />
              <path className="land" d="M96 152 C 106 148 114 158 114 172 C 114 188 104 198 94 194 C 84 190 82 160 96 152 Z" />
              <path className="land" d="M52 78 C 62 72 74 80 74 92 C 74 104 62 112 52 106 C 42 100 42 84 52 78 Z" />
              <path className="land" d="M40 104 C 46 101 52 105 52 110 C 52 116 45 119 40 115 C 35 112 35 107 40 104 Z" />
              <path className="route" d="M150 322 C 128 280 112 224 104 168" />
              <path className="route" d="M104 168 C 92 140 76 114 62 92" />
              {STOPS.map((st) => (
                <g key={st.k} className={"mpin" + (stop === st.k ? " on" : "")} role="button" tabIndex={0}
                  aria-label={st.name} onClick={() => setStop(st.k)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setStop(st.k)}>
                  <circle className="halo" cx={st.x} cy={st.y} r="18" />
                  <circle className="core" cx={st.x} cy={st.y} r="5.5" />
                  <text x={st.x + 16} y={st.y + 4}>{st.name}</text>
                </g>
              ))}
            </svg>
            <div className="map-legend">
              <span>3 escales · 2 vols intérieurs</span>
              <span>1 100 km parcourus</span>
            </div>
          </Reveal>

          <div>
            <div className="stopbar">
              {STOPS.map((st, i) => (
                <button key={st.k} className={"stopbtn" + (stop === st.k ? " on" : "")} onClick={() => setStop(st.k)}>
                  <b>0{i + 1}</b>{st.name} · {st.n}
                </button>
              ))}
            </div>
            <div className="dayscroll">
              {days.map((d) => (
                <div className="dayblock" key={d.n}>
                  <div className="dhead">
                    <span className="dnum">JOUR {d.n} · {d.d}</span>
                    <h4>{d.t}</h4>
                  </div>
                  {dayItems(d, S.planApplied).map((it) => (
                    <div className="dayline" key={it.id}>
                      <span className="t">{it.t}</span>
                      <div>
                        <b>{it.f}</b>
                        {it.s && <span>{it.s}</span>}
                        {it.why && <div className="why">{it.why}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
