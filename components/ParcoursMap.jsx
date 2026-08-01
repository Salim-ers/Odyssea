"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadPlaces, peekPlaces, norm } from "../lib/places";
import { frDate } from "../lib/store";

/* La carte du parcours — une vraie carte.

   Le fond est le trait de côte Natural Earth (110 m, domaine public), projeté
   en équirectangulaire à la construction : à l'exécution il ne reste qu'un
   chemin à dessiner, sans bibliothèque de cartographie.

   Le départ vient du jeu d'aéroports, la destination d'un géocodage
   Open-Meteo (gratuit, sans clé). Le cadrage passe de la vue monde au plan
   serré sur la route à mesure que le questionnaire avance, et la route se
   dessine par-dessus. */

const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";

/* Le canevas du fond : lon [-180,180] → [0,2000], lat [90,-90] → [0,1000]. */
const W = 2000;
const H = 1000;
const px = (lon) => ((lon + 180) / 360) * W;
const py = (lat) => ((90 - lat) / 180) * H;

let worldCache = null;
function loadWorld() {
  if (worldCache) return Promise.resolve(worldCache);
  return fetch("/data/world-land.json")
    .then((r) => r.json())
    .then((w) => (worldCache = w));
}

/* Une route qui se courbe vers le nord, comme une grande route aérienne. */
function arcBetween(a, b) {
  const x1 = px(a.lon), y1 = py(a.lat);
  const x2 = px(b.lon), y2 = py(b.lat);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const span = Math.hypot(x2 - x1, y2 - y1);
  /* Le contrôle est décalé perpendiculairement, du côté du pôle le plus proche. */
  const lift = Math.min(span * 0.22, 130) * (my < H / 2 ? -1 : 1);
  return { d: `M${x1} ${y1} Q${mx} ${my + lift}, ${x2} ${y2}`, x1, y1, x2, y2 };
}

/* Cadre englobant les deux points, avec de la marge, borné au canevas. */
function frameFor(pts, tightness) {
  if (!pts.length) return { x: 0, y: 0, w: W, h: H };
  const xs = pts.map((p) => px(p.lon));
  const ys = pts.map((p) => py(p.lat));
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const need = Math.max((Math.max(...xs) - Math.min(...xs)) * 2.4, 430);

  /* `tightness` va de 0 (vue monde) à 1 (plan serré sur la route). */
  const w = W + (Math.min(need, W) - W) * tightness;
  const h = (w * H) / W;
  const x = Math.max(0, Math.min(W - w, cx - w / 2));
  const y = Math.max(0, Math.min(H - h, cy - h / 2));
  return { x, y, w, h };
}

export default function ParcoursMap({ ob, step, total }) {
  const progress = step / (total - 1);
  const [world, setWorld] = useState(worldCache);
  const [places, setPlaces] = useState(() => peekPlaces());
  const [dest, setDest] = useState(null);
  const destCache = useRef(new Map());

  useEffect(() => {
    loadWorld().then(setWorld).catch(() => {});
    if (!places) loadPlaces().then(setPlaces).catch(() => {});
  }, [places]);

  /* Le départ : on retrouve l'aéroport par son code, sinon par sa ville. */
  const from = useMemo(() => {
    if (!places) return null;
    const code = (ob.from.match(/\b([A-Z]{3})\b/) || [])[1];
    if (code) {
      const hit = places.airports.find((a) => a.code === code);
      if (hit) return { lat: hit.lat, lon: hit.lon, label: hit.city || hit.name };
    }
    const q = norm(ob.from.split("—")[0]);
    const hit = places.airports.find((a) => norm(a.city) === q);
    return hit ? { lat: hit.lat, lon: hit.lon, label: hit.city } : null;
  }, [places, ob.from]);

  /* La destination est du texte libre : on la géocode, en différé et une
     seule fois par saisie. */
  useEffect(() => {
    const q = ob.dest.trim();
    if (q.length < 3) return setDest(null);
    if (destCache.current.has(q)) return setDest(destCache.current.get(q));

    let alive = true;
    const timer = setTimeout(() => {
      fetch(`${GEOCODE}?name=${encodeURIComponent(q)}&count=1&language=fr&format=json`)
        .then((r) => r.json())
        .then((data) => {
          const hit = data?.results?.[0];
          const found = hit
            ? { lat: hit.latitude, lon: hit.longitude, label: hit.name }
            : null;
          destCache.current.set(q, found);
          if (alive) setDest(found);
        })
        .catch(() => {});
    }, 550);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [ob.dest]);

  const pins = [from, dest].filter(Boolean);
  const route = from && dest ? arcBetween(from, dest) : null;

  /* On resserre dès que la destination est connue, puis progressivement. */
  const tightness = dest ? Math.min(1, 0.78 + progress * 0.22) : 0;
  const box = frameFor(pins, tightness);
  const viewBox = `${box.x.toFixed(0)} ${box.y.toFixed(0)} ${box.w.toFixed(0)} ${box.h.toFixed(0)}`;

  /* Les repères gardent une taille constante à l'écran quel que soit le zoom. */
  const k = box.w / W;

  const caption = !ob.dest.trim()
    ? "Donnez une destination : la carte s'ouvrira dessus."
    : !dest
      ? "Recherche de la destination…"
      : !from
        ? `${dest.label} — indiquez un aéroport de départ.`
        : step === total - 1
          ? `${from.label} → ${dest.label} · votre route est tracée.`
          : `${from.label} → ${dest.label} · ${frDate(ob.dep)} → ${frDate(ob.ret)}`;

  return (
    <figure className="pmap" style={{ "--p": progress }}>
      <div className="pmap-frame">
        <svg viewBox={viewBox} preserveAspectRatio="xMidYMid slice" role="img"
          aria-label={route ? `Carte : ${from.label} vers ${dest.label}` : "Carte du monde"}>
          <defs>
            <linearGradient id="pm-route" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--teal-2)" />
              <stop offset="100%" stopColor="var(--amber)" />
            </linearGradient>
          </defs>

          {/* Parallèles et méridiens tous les 15° : une trame, pas un quadrillage. */}
          <g className="pm-grid">
            {Array.from({ length: 11 }, (_, i) => py(75 - i * 15)).map((y) => (
              <line key={"h" + y} x1="0" y1={y} x2={W} y2={y} />
            ))}
            {Array.from({ length: 25 }, (_, i) => px(-180 + i * 15)).map((x) => (
              <line key={"v" + x} x1={x} y1="0" x2={x} y2={H} />
            ))}
          </g>

          {world && <path className="pm-land" d={world.d} />}

          {route && (
            <>
              <path className="pm-route-ghost" d={route.d} />
              <path className="pm-route" d={route.d} pathLength="1"
                style={{ strokeWidth: 3 * k, strokeDashoffset: 1 - Math.max(0.12, progress) }} />
            </>
          )}

          {from && (
            <g className="pm-pin from">
              <circle cx={px(from.lon)} cy={py(from.lat)} r={9 * k} className="pm-ring" strokeWidth={2.5 * k} />
              <circle cx={px(from.lon)} cy={py(from.lat)} r={3.5 * k} className="pm-dot" />
            </g>
          )}
          {dest && (
            <g className="pm-pin to">
              <circle cx={px(dest.lon)} cy={py(dest.lat)} r={20 * k} className="pm-halo" />
              <circle cx={px(dest.lon)} cy={py(dest.lat)} r={9 * k} className="pm-ring" strokeWidth={2.5 * k} />
              <circle cx={px(dest.lon)} cy={py(dest.lat)} r={3.5 * k} className="pm-dot" />
            </g>
          )}
        </svg>

        {/* Les étiquettes sont en HTML : elles restent nettes et lisibles
            quelle que soit l'échelle de la carte. */}
        {pins.map((p, i) => (
          <span
            key={i}
            className={"pm-tag" + (i === 1 ? " to" : "")}
            style={{
              left: `${((px(p.lon) - box.x) / box.w) * 100}%`,
              top: `${((py(p.lat) - box.y) / box.h) * 100}%`,
            }}
          >
            {p.label}
          </span>
        ))}
      </div>
      <figcaption className="pmap-cap">{caption}</figcaption>
    </figure>
  );
}
