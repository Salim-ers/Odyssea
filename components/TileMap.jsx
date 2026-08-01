"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/* Une vraie carte, pour n'importe quel voyage.

   Même principe que la carte de l'exemple malaisien — des tuiles
   OpenStreetMap — mais assemblées à la volée pour les étapes du voyage au
   lieu d'être une image figée. Les tuiles sont posées côte à côte en HTML,
   comme le fait n'importe quelle carte glissante : il n'y a donc rien à
   composer côté serveur, et aucune bibliothèque à embarquer.

   Le rendu se fait dans un repère de taille fixe, mis à l'échelle en CSS :
   les tuiles restent alignées au pixel quelle que soit la largeur affichée.

   Attribution : © les contributeurs d'OpenStreetMap. */

const TILE = 256;
const VW = 900; /* largeur du repère interne */
const VH = 660;
const PAD = 90; /* marge autour des étapes, en pixels du repère */
const MAX_Z = 11;
const MIN_Z = 2;

const lonToX = (lon, z) => ((lon + 180) / 360) * Math.pow(2, z) * TILE;
const latToY = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z) * TILE;
};

/* Le plus fort niveau de zoom auquel toutes les étapes tiennent dans le cadre. */
function fit(stops) {
  for (let z = MAX_Z; z >= MIN_Z; z--) {
    const xs = stops.map((s) => lonToX(s.lon, z));
    const ys = stops.map((s) => latToY(s.lat, z));
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    if (w <= VW - PAD * 2 && h <= VH - PAD * 2) return z;
  }
  return MIN_Z;
}

export default function TileMap({ stops, active }) {
  /* L'échelle ne peut pas être calculée en CSS : calc() ne divise pas une
     longueur par une longueur, et un élément ne peut pas interroger sa propre
     largeur de conteneur. On la mesure donc, une fois et à chaque
     redimensionnement. */
  const frame = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / VW);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const usable = (stops || []).filter(
    (s) => Number.isFinite(s.lat) && Number.isFinite(s.lon)
  );

  const view = useMemo(() => {
    if (!usable.length) return null;
    const z = fit(usable);
    const xs = usable.map((s) => lonToX(s.lon, z));
    const ys = usable.map((s) => latToY(s.lat, z));
    /* Origine du repère : le centre des étapes, ramené au coin haut-gauche. */
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const originX = cx - VW / 2;
    const originY = cy - VH / 2;

    const n = Math.pow(2, z);
    const tiles = [];
    const firstCol = Math.floor(originX / TILE);
    const lastCol = Math.floor((originX + VW) / TILE);
    const firstRow = Math.floor(originY / TILE);
    const lastRow = Math.floor((originY + VH) / TILE);

    for (let ty = firstRow; ty <= lastRow; ty++) {
      if (ty < 0 || ty >= n) continue;
      for (let tx = firstCol; tx <= lastCol; tx++) {
        /* Le monde boucle en longitude : une colonne hors bornes revient
           de l'autre côté plutôt que de laisser un trou. */
        const wrapped = ((tx % n) + n) % n;
        tiles.push({
          key: `${tx}:${ty}`,
          url: `https://tile.openstreetmap.org/${z}/${wrapped}/${ty}.png`,
          left: tx * TILE - originX,
          top: ty * TILE - originY,
        });
      }
    }

    const pts = usable.map((s) => ({
      ...s,
      px: lonToX(s.lon, z) - originX,
      py: latToY(s.lat, z) - originY,
    }));

    const route = pts.length > 1
      ? pts.map((p, i) => `${i ? "L" : "M"}${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(" ")
      : null;

    return { tiles, pts, route };
  }, [usable]);

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
          {view.pts.map((p) => (
            <g key={p.name} className={active === p.name ? "tmp on" : "tmp"}>
              <circle cx={p.px} cy={p.py} r="20" className="tmp-halo" />
              <circle cx={p.px} cy={p.py} r="8" className="tmp-ring" />
              <circle cx={p.px} cy={p.py} r="3.5" className="tmp-dot" />
            </g>
          ))}
        </svg>

        {view.pts.map((p, i) => (
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
