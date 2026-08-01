"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadPlaces, peekPlaces, norm } from "../lib/places";
import { TILE, fitZoom, layout, routePath } from "../lib/tiles";
import { frDate } from "../lib/store";

/* La carte du parcours.

   Exactement le même fond que la carte de l'exemple : des tuiles
   OpenStreetMap, au même traitement chromatique. On y voit le relief, les
   villes et les routes — pas une silhouette.

   Elle se resserre à mesure que le questionnaire avance : on part d'une vue
   large et on gagne un niveau de zoom par étape, jusqu'au cadrage exact de la
   route. Le tracé, lui, se dessine progressivement.

   Le départ vient du jeu d'aéroports, les destinations d'un géocodage
   Open-Meteo (gratuit, sans clé). */

const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
const VW = 1000;
const VH = 400;

/* Nombre de niveaux de zoom traversés entre la première et la dernière
   question : assez pour qu'on voie la carte se resserrer, pas assez pour
   qu'elle saute. */
const APPROACH = 3;

/* Deux escales voisines ont deux étiquettes au même endroit. On les décale
   verticalement, dans l'ordre où on les rencontre. */
const HALF = 17;
function stagger(points) {
  const placed = [];
  return points.map((p) => {
    let dy = 0;
    for (let guard = 0; guard < 8; guard++) {
      const clash = placed.some(
        (q) => Math.abs(q.px - p.px) < 190 && Math.abs(q.y - (p.py + dy)) < HALF * 2
      );
      if (!clash) break;
      /* On alterne au-dessus puis au-dessous, en s'éloignant. */
      dy = dy <= 0 ? -dy + HALF * 2 : -dy;
    }
    placed.push({ px: p.px, y: p.py + dy });
    return { ...p, dy };
  });
}

export default function ParcoursMap({ ob, step, total }) {
  const progress = total > 1 ? step / (total - 1) : 1;
  const frame = useRef(null);
  const [scale, setScale] = useState(0);
  const [places, setPlaces] = useState(() => peekPlaces());
  const [found, setFound] = useState({});
  const cache = useRef(new Map());

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / VW));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!places) loadPlaces().then(setPlaces).catch(() => {});
  }, [places]);

  /* Le départ : on retrouve l'aéroport par son code, sinon par sa ville. */
  const from = useMemo(() => {
    if (!places) return null;
    const code = (ob.from.match(/\b([A-Z]{3})\b/) || [])[1];
    if (code) {
      const hit = places.airports.find((a) => a.code === code);
      if (hit) return { lat: hit.lat, lon: hit.lon, name: hit.city || hit.name, from: true };
    }
    const q = norm(ob.from.split("—")[0]);
    const hit = places.airports.find((a) => norm(a.city) === q);
    return hit ? { lat: hit.lat, lon: hit.lon, name: hit.city, from: true } : null;
  }, [places, ob.from]);

  /* Les destinations sont du texte libre : on les géocode, en différé et une
     seule fois par libellé. Le résultat est mémorisé pour toute la session. */
  const wanted = useMemo(
    () => (ob.dests || []).map((d) => d.trim()).filter((d) => d.length >= 3),
    [ob.dests]
  );

  /* Un échec réseau ne doit pas condamner la carte pour toute la session : le
     libellé ne changera plus, donc rien ne relancerait la recherche. On
     réessaie quelques fois, de plus en plus tard. */
  const [tick, setTick] = useState(0);
  const retryTimer = useRef(null);
  useEffect(() => () => clearTimeout(retryTimer.current), []);

  useEffect(() => {
    const todo = wanted.filter((q) => !cache.current.has(q));
    if (!todo.length) return;
    let alive = true;
    const timer = setTimeout(async () => {
      let failed = false;
      for (const q of todo) {
        try {
          const r = await fetch(
            `${GEOCODE}?name=${encodeURIComponent(q)}&count=1&language=fr&format=json`
          );
          if (!r.ok) throw new Error(r.status);
          const data = await r.json();
          const hit = data?.results?.[0];
          /* Une recherche sans résultat est une réponse : on la mémorise pour
             ne pas la reposer. Une panne, elle, ne se mémorise pas. */
          cache.current.set(q, hit ? { lat: hit.latitude, lon: hit.longitude, name: hit.name } : null);
        } catch {
          failed = true;
        }
      }
      if (!alive) return;
      setFound(Object.fromEntries(cache.current));
      if (failed && tick < 3) {
        retryTimer.current = setTimeout(() => setTick((t) => t + 1), 2000 * (tick + 1));
      }
    }, 550);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [wanted, tick]);

  const stops = wanted.map((q) => (found[q] ?? cache.current.get(q)) || null).filter(Boolean);
  const points = [from, ...stops].filter(Boolean);

  const view = useMemo(() => {
    if (!points.length) return null;
    const target = fitZoom(points, { width: VW, height: VH, pad: 64, max: 9 });
    /* On arrive sur la destination : vue large au début, cadrage exact à la
       fin. Le zoom est entier — c'est ce que sont les tuiles. */
    const start = Math.max(1, target - APPROACH);
    const zoom = start + Math.round((target - start) * progress);
    const { tiles, points: pts } = layout({ points, width: VW, height: VH, zoom });
    return { tiles, points: stagger(pts), route: routePath(pts, 0.2), zoom };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [points.map((p) => `${p.lat},${p.lon}`).join("|"), progress]);

  const named = stops.map((s) => s.name).join(" · ");
  const caption = !wanted.length
    ? "Donnez une destination : la carte s'ouvrira dessus."
    : !stops.length
      ? "Recherche de la destination…"
      : !from
        ? `${named} — indiquez un aéroport de départ.`
        : step === total - 1
          ? `${from.name} → ${named} · votre route est tracée.`
          : `${from.name} → ${named} · ${frDate(ob.dep)} → ${frDate(ob.ret)}`;

  return (
    <figure className="pmap">
      <div className="pmap-frame" ref={frame}>
        {view && scale > 0 && (
          <div className="tm-plane" style={{ width: VW, height: VH, transform: `scale(${scale})` }}>
            <div className="tm-tiles" key={view.zoom}>
              {view.tiles.map((t) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={t.key} src={t.url} alt="" aria-hidden="true"
                  width={TILE} height={TILE} style={{ left: t.left, top: t.top }} />
              ))}
            </div>

            <svg className="tm-over" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true">
              {view.route && (
                <>
                  <path className="tmr-halo" d={view.route} />
                  {/* pathLength ramène le tracé à 1 : la fraction dessinée est
                      exactement l'avancement du questionnaire. */}
                  <path className="tmr drawing" d={view.route} pathLength="1"
                    style={{ strokeDashoffset: 1 - Math.max(0.1, progress) }} />
                </>
              )}
              {view.points.map((p, i) => (
                <g key={i} className={"tmp" + (p.from ? " from" : " on")}>
                  <circle cx={p.px} cy={p.py} r="18" className="tmp-halo" />
                  <circle cx={p.px} cy={p.py} r="8" className="tmp-ring" />
                  <circle cx={p.px} cy={p.py} r="3.5" className="tmp-dot" />
                </g>
              ))}
            </svg>

            {view.points.map((p, i) => (
              <span key={i}
                className={"tmp-tag" + (p.px / VW > 0.62 ? " flip" : "") + (p.from ? "" : " on")}
                style={{ left: p.px, top: p.py + p.dy }}>
                {!p.from && <b>{String(i).padStart(2, "0")}</b>}
                {p.name}
              </span>
            ))}
          </div>
        )}
        {!view && <div className="pmap-idle" aria-hidden="true" />}
      </div>
      <figcaption className="pmap-cap">{caption}</figcaption>
    </figure>
  );
}
