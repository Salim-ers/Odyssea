"use client";
import { useState } from "react";
import Link from "next/link";
import TileMap from "./TileMap";
import Reveal from "./Reveal";
import { MAP, STOPS, DAYS, EXAMPLE, dayItems } from "../lib/example";
import { kindOf, KINDS } from "../lib/kinds";
import { Icon } from "../lib/icons";

/* La vitrine de l'accueil : une carte à gauche, le programme jour par jour à
   droite, et le choix de l'escale qui commande les deux.

   Deux sources possibles, une seule mise en page. Par défaut, l'exemple
   malaisien et sa carte OpenStreetMap. Si un voyage est désigné comme
   vitrine, elle bascule dessus : mêmes tuiles OpenStreetMap, assemblées à la
   volée pour ses étapes. */

const fr = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export default function Showcase({ trip }) {
  const model = trip ? fromTrip(trip) : fromExample();
  const [stopKey, setStopKey] = useState(model.stops[0]?.key);

  const stop = model.stops.find((s) => s.key === stopKey) || model.stops[0];
  const days = model.days.filter((d) => d.stopKey === stop?.key);
  const steps = days.reduce((a, d) => a + d.items.length, 0);

  return (
    <section className="mapsec" id="methode">
      <div className="in">
        <Reveal className="map-head">
          <div className="kicker gold">{model.kicker}</div>
          <h2>{model.title}</h2>
          <p>{model.intro}</p>
        </Reveal>

        <div className="map-grid">
          <Reveal className="map-wrap">
            {model.image ? (
              /* L'exemple a sa carte OpenStreetMap, adoucie aux tons du site. */
              <div className="map-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="map-img" src={model.image.src} width={model.image.w}
                  height={model.image.h} alt={model.image.alt}
                  loading="lazy" decoding="async" draggable="false" />
                <svg className="map-pins" viewBox={`0 0 ${model.image.w} ${model.image.h}`} aria-hidden="true">
                  {model.image.routes.map((d, i) => (
                    <path key={i} className="route" d={d} />
                  ))}
                  {model.stops.map((s) => (
                    <g key={s.key} className={"mpin" + (stop.key === s.key ? " on" : "")}>
                      <circle className="halo" cx={s.x} cy={s.y} r="22" />
                      <circle className="core" cx={s.x} cy={s.y} r="7" />
                    </g>
                  ))}
                </svg>
                {model.stops.map((s, i) => {
                  const flip = s.x / model.image.w > 0.55;
                  return (
                    <button type="button" key={s.key}
                      className={"mlabel" + (flip ? " flip" : "") + (stop.key === s.key ? " on" : "")}
                      style={{ left: `${(s.x / model.image.w) * 100}%`, top: `${(s.y / model.image.h) * 100}%` }}
                      aria-pressed={stop.key === s.key} onClick={() => setStopKey(s.key)}>
                      <b>0{i + 1}</b>{s.name}<i>{s.nights}</i>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Un voyage composé : la carte est tracée depuis ses coordonnées. */
              <TileMap stops={model.geo} active={stop?.key} />
            )}

            <div className="map-legend">
              {model.legend.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <p className="map-credit">{model.credit}</p>
          </Reveal>

          <div className="map-side">
            <div className="stopbar" role="tablist" aria-label="Escales">
              {model.stops.map((s, i) => (
                <button type="button" key={s.key} role="tab" aria-selected={stop.key === s.key}
                  className={"stopbtn" + (stop.key === s.key ? " on" : "")}
                  onClick={() => setStopKey(s.key)}>
                  <b>0{i + 1}</b>{s.name}<span>{s.nights}</span>
                </button>
              ))}
            </div>

            <div className="stopnow">
              <Icon name="map" />
              <span>
                <b>{stop?.name}</b>
                {days.length} journée{days.length > 1 ? "s" : ""} détaillée
                {days.length > 1 ? "s" : ""} · {steps} étapes
              </span>
            </div>

            {/* Une couleur par nature d'étape : la journée se lit d'un coup d'œil. */}
            <ul className="kindkey">
              {Object.entries(KINDS).map(([k, v]) => (
                <li key={k} style={{ "--kc": v.c }}>
                  <Icon name={v.icon} />
                  {v.label}
                </li>
              ))}
            </ul>

            <div className="dayscroll">
              {days.map((d) => (
                <article className="dayblock" key={d.n}>
                  <header className="dhead">
                    <span className="dnum">Jour {d.n}</span>
                    <h4>{d.title}</h4>
                    <span className="ddate">{d.date}</span>
                  </header>
                  {d.items.map((it, i) => {
                    const kind = kindOf(it.kind);
                    return (
                      <div className="dayline" key={i} style={{ "--kc": kind.c }}>
                        <span className="t">{it.time}</span>
                        <span className="kmark" aria-hidden="true">
                          <Icon name={kind.icon} />
                        </span>
                        <div className="dtx">
                          <b>{it.title}</b>
                          <span className="klabel">{kind.label}</span>
                          {it.detail && <span className="dsub">{it.detail}</span>}
                          {it.why && <p className="why">{it.why}</p>}
                        </div>
                      </div>
                    );
                  })}
                </article>
              ))}
              {!days.length && (
                <p className="note">Aucune journée détaillée pour cette escale.</p>
              )}
            </div>

            <div className="show-more">
              <p>{model.footnote}</p>
              <Link className="btn btn-gold" href="/parcours">
                <Icon name="spark" />
                Composer le mien
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Les deux sources, ramenées à la même forme ---------- */

function fromExample() {
  const CITY = { kl: "Kuala Lumpur", pen: "Penang", lgk: "Langkawi" };
  return {
    ...EXAMPLE,
    image: {
      src: MAP.src,
      w: MAP.w,
      h: MAP.h,
      routes: MAP.routes,
      alt: "Carte de la péninsule malaisienne : Langkawi, Penang et Kuala Lumpur",
    },
    stops: STOPS.map((s) => ({ key: s.k, name: s.name, nights: s.n, x: s.x, y: s.y })),
    days: DAYS.filter((d) => CITY[d.c]).map((d) => ({
      n: d.n,
      title: d.t,
      date: d.d,
      stopKey: d.c,
      items: dayItems(d).map((it) => ({
        time: it.t,
        kind: it.k,
        title: it.f,
        detail: it.s,
        why: it.why,
      })),
    })),
    legend: ["3 escales · 2 vols intérieurs", "1 100 km parcourus"],
    credit: "Fond de carte © OpenStreetMap",
    footnote:
      "Voilà ce qu'Odyssea écrit. Le vôtre sera composé pour votre destination, vos dates et votre équipage.",
  };
}

function fromTrip(trip) {
  const { plan, days, brief } = trip;
  const keyOf = (name) => name;
  return {
    kicker: "Un voyage réellement composé",
    title: plan.destination.tagline,
    intro: plan.destination.summary,
    image: null,
    geo: plan.stops,
    stops: plan.stops.map((s) => ({
      key: keyOf(s.name),
      name: s.name,
      nights: `${s.nights} nuit${s.nights > 1 ? "s" : ""}`,
    })),
    days: days.map((d) => ({
      n: d.n,
      title: d.title,
      date: fr(d.date),
      stopKey: keyOf(d.stopName),
      items: d.items.map((it) => ({
        time: it.time,
        kind: it.kind,
        title: it.title,
        detail: it.detail,
        why: it.why,
      })),
    })),
    legend: [
      `${fr(brief.dep)} → ${fr(brief.ret)}`,
      `${days.length} journées écrites`,
    ],
    credit: plan.sources?.length
      ? `Composé à partir de ${plan.sources.length} sources consultées en direct. Fond de carte © OpenStreetMap.`
      : "Fond de carte © OpenStreetMap.",
    footnote:
      "Avec les vols, l'hébergement, le budget et les pièges de l'itinéraire.",
  };
}
