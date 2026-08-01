"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { TILE, fitZoom, layout, routePath } from "../lib/tiles";

/* Une vraie carte, pour n'importe quel voyage.

   Même fond que la carte de l'exemple malaisien — des tuiles OpenStreetMap —
   mais assemblées à la volée pour les étapes du voyage au lieu d'être une
   image figée.

   Le rendu se fait dans un repère de taille fixe : les tuiles restent
   alignées au pixel quelle que soit la largeur affichée. */

const VW = 900;
const VH = 660;

export default function TileMap({ stops, active }) {
  /* L'échelle ne peut pas être calculée en CSS : calc() ne divise pas une
     longueur par une longueur, et un élément ne peut pas interroger sa propre
     largeur de conteneur. On la mesure donc, et on la suit. */
  const frame = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / VW));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const usable = (stops || []).filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon));
  const key = usable.map((s) => `${s.lat},${s.lon}`).join("|");

  const view = useMemo(() => {
    if (!usable.length) return null;
    const zoom = fitZoom(usable, { width: VW, height: VH, pad: 130, max: 10 });
    const { tiles, points } = layout({ points: usable, width: VW, height: VH, zoom });
    return { tiles, points, route: routePath(points) };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [key]);

  if (!view) return null;

  return (
    <div className="tilemap" ref={frame}>
      <div className="tm-plane" style={{ width: VW, height: VH, transform: `scale(${scale})` }}>
        <div className="tm-tiles">
          {view.tiles.map((t) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={t.key} src={t.url} alt="" aria-hidden="true" loading="lazy"
              width={TILE} height={TILE} style={{ left: t.left, top: t.top }} />
          ))}
        </div>

        <svg className="tm-over" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true">
          {view.route && (
            <>
              <path className="tmr-halo" d={view.route} />
              <path className="tmr" d={view.route} />
            </>
          )}
          {view.points.map((p) => (
            <g key={p.name} className={active === p.name ? "tmp on" : "tmp"}>
              <circle cx={p.px} cy={p.py} r="20" className="tmp-halo" />
              <circle cx={p.px} cy={p.py} r="8" className="tmp-ring" />
              <circle cx={p.px} cy={p.py} r="3.5" className="tmp-dot" />
            </g>
          ))}
        </svg>

        {view.points.map((p, i) => (
          <span key={p.name}
            className={"tmp-tag" + (p.px / VW > 0.62 ? " flip" : "") + (active === p.name ? " on" : "")}
            style={{ left: p.px, top: p.py }}>
            <b>{String(i + 1).padStart(2, "0")}</b>
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
