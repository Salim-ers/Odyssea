/* La carte d'un voyage composé.

   Même fond que la carte du parcours — trait de côte Natural Earth projeté à
   la construction — mais cadré sur les étapes du voyage, qui portent leurs
   coordonnées réelles depuis la génération.

   Composant serveur : le chemin du fond est lu au rendu et rien n'est
   téléchargé côté navigateur. */

const W = 2000;
const H = 1000;
const px = (lon) => ((lon + 180) / 360) * W;
const py = (lat) => ((90 - lat) / 180) * H;

/* Cadre englobant les étapes, avec de la marge, borné au canevas. */
function frame(stops, ratio) {
  const xs = stops.map((s) => px(s.lon));
  const ys = stops.map((s) => py(s.lat));
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

  /* On part du plus contraignant des deux axes, avec une marge généreuse :
     un voyage tient rarement dans un rectangle serré. */
  /* Le plancher donne du contexte à un voyage court sans le noyer : 120
     unités du canevas valent environ 22° de longitude, soit le pays et ses
     voisins immédiats. */
  let w = Math.max(spanX * 2.6, spanY * ratio * 2.6, 120);
  w = Math.min(w, W);
  let h = Math.min(w / ratio, H);
  return {
    x: Math.max(0, Math.min(W - w, cx - w / 2)),
    y: Math.max(0, Math.min(H - h, cy - h / 2)),
    w,
    h,
  };
}

/* Une polyligne adoucie qui relie les étapes dans l'ordre du voyage. */
function routeThrough(stops) {
  if (stops.length < 2) return null;
  const p = stops.map((s) => [px(s.lon), py(s.lat)]);
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const lift = Math.min(Math.hypot(x2 - x1, y2 - y1) * 0.18, 60) * (my < H / 2 ? -1 : 1);
    d += ` Q${mx.toFixed(1)} ${(my + lift).toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d;
}

const RATIO = 620 / 460;

export default function TripMap({ stops, worldPath, active }) {
  const usable = (stops || []).filter(
    (s) => Number.isFinite(s.lat) && Number.isFinite(s.lon)
  );
  if (!usable.length) return null;

  const box = frame(usable, RATIO);
  const k = box.w / W;
  const route = routeThrough(usable);

  return (
    <div className="tmap">
      <svg viewBox={`${box.x.toFixed(0)} ${box.y.toFixed(0)} ${box.w.toFixed(0)} ${box.h.toFixed(0)}`}
        preserveAspectRatio="xMidYMid slice" role="img"
        aria-label={`Carte du voyage : ${usable.map((s) => s.name).join(", ")}`}>
        <defs>
          <linearGradient id="tm-route" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--teal-2)" />
            <stop offset="100%" stopColor="var(--amber)" />
          </linearGradient>
        </defs>

        <g className="tm-grid">
          {Array.from({ length: 25 }, (_, i) => py(84 - i * 7)).map((y) => (
            <line key={"h" + y} x1="0" y1={y} x2={W} y2={y} />
          ))}
          {Array.from({ length: 49 }, (_, i) => px(-180 + i * 7.5)).map((x) => (
            <line key={"v" + x} x1={x} y1="0" x2={x} y2={H} />
          ))}
        </g>

        {worldPath && <path className="tm-land" d={worldPath} />}

        {route && (
          <>
            <path className="tm-route-halo" d={route} style={{ strokeWidth: 7 * k }} />
            <path className="tm-route" d={route} style={{ strokeWidth: 2.6 * k }} />
          </>
        )}

        {usable.map((s) => (
          <g key={s.name} className={active === s.name ? "tm-on" : undefined}>
            <circle cx={px(s.lon)} cy={py(s.lat)} r={13 * k} className="tm-halo" />
            <circle cx={px(s.lon)} cy={py(s.lat)} r={7 * k} className="tm-ring" strokeWidth={2.4 * k} />
            <circle cx={px(s.lon)} cy={py(s.lat)} r={2.8 * k} className="tm-dot" />
          </g>
        ))}
      </svg>

      {/* Étiquettes en HTML : nettes quelle que soit l'échelle. */}
      {usable.map((s, i) => (
        <span
          key={s.name}
          className={"tm-tag" + (i % 2 ? " low" : "") + (active === s.name ? " on" : "")}
          style={{
            left: `${((px(s.lon) - box.x) / box.w) * 100}%`,
            top: `${((py(s.lat) - box.y) / box.h) * 100}%`,
          }}
        >
          <b>{String(i + 1).padStart(2, "0")}</b>
          {s.name}
        </span>
      ))}
    </div>
  );
}
