"use client";
import { frDate } from "../lib/store";

/* La carte du bas se dessine à mesure que le questionnaire avance.

   Elle n'est pas décorative : chaque escale porte la réponse que vous venez
   de donner. Le tracé se révèle par `stroke-dashoffset` sur un chemin de
   longueur normalisée à 1, ce qui fait correspondre exactement la portion
   dessinée à la progression — sans mesurer le chemin en JavaScript. */

const W = 1000;
const H = 210;

/* Les huit escales, réparties en méandre pour éviter la ligne droite. */
const WAYPOINTS = [
  [70, 150],
  [190, 108],
  [312, 138],
  [434, 84],
  [556, 118],
  [676, 70],
  [800, 106],
  [928, 58],
];

/* Chemin lissé par splines cardinales : huit points, sept segments cubiques. */
function smoothPath(pts, tension = 0.5) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const c1x = x1 + ((x2 - p0[0]) * tension) / 3;
    const c1y = y1 + ((y2 - p0[1]) * tension) / 3;
    const c2x = x2 - ((p3[0] - x1) * tension) / 3;
    const c2y = y2 - ((p3[1] - y1) * tension) / 3;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x2} ${y2}`;
  }
  return d;
}

const ROUTE = smoothPath(WAYPOINTS);

/** Ce que chaque escale affiche une fois atteinte. */
function labels(ob) {
  const people = ob.adults + ob.kids;
  return [
    ob.dest.trim() || "Destination",
    `${frDate(ob.dep)} → ${frDate(ob.ret)}`,
    ob.group === "Solo" ? "Solo" : `${people} voyageur${people > 1 ? "s" : ""}`,
    Object.values(ob.booked || {}).some((v) => v === "oui") ? "Déjà réservé" : "Tout à composer",
    ob.stylePri || "Votre style",
    ob.budget || "Budget",
    ob.food?.length ? ob.food[0] : "À table",
    ob.prefs?.length ? ob.prefs[0] : "Vos envies",
  ];
}

export default function ParcoursMap({ ob, step, total }) {
  const progress = step / (total - 1);
  const texts = labels(ob);

  return (
    <figure className="pmap" aria-hidden="true" style={{ "--p": progress }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="pm-route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--teal-2)" />
            <stop offset="100%" stopColor="var(--amber)" />
          </linearGradient>
          <radialGradient id="pm-glow">
            <stop offset="0%" stopColor="rgba(224,129,60,.5)" />
            <stop offset="100%" stopColor="rgba(224,129,60,0)" />
          </radialGradient>
        </defs>

        {/* Relief abstrait : rien de géographique, juste de la matière sous le tracé. */}
        <g className="pm-land">
          <path d="M0 176 C 120 150 200 186 320 168 C 450 148 520 184 640 170 C 760 156 860 182 1000 164 L1000 210 L0 210 Z" />
          <path d="M0 196 C 150 178 260 204 400 190 C 560 174 660 200 800 188 C 890 180 950 194 1000 188 L1000 210 L0 210 Z" opacity=".6" />
        </g>
        <g className="pm-grid">
          {[42, 84, 126, 168].map((y) => (
            <line key={y} x1="0" y1={y} x2={W} y2={y} />
          ))}
          {Array.from({ length: 11 }, (_, i) => i * 100).map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2={H} />
          ))}
        </g>

        {/* Le tracé complet en pointillé, puis la portion parcourue par-dessus. */}
        <path className="pm-ghost" d={ROUTE} />
        <path className="pm-route" d={ROUTE} pathLength="1" />

        {WAYPOINTS.map(([x, y], i) => {
          const reached = i <= step;
          return (
            <g key={i} className={"pm-stop" + (reached ? " on" : "") + (i === step ? " cur" : "")}>
              {i === step && <circle className="pm-halo" cx={x} cy={y} r="30" fill="url(#pm-glow)" />}
              <circle className="pm-ring" cx={x} cy={y} r="9" />
              <circle className="pm-dot" cx={x} cy={y} r="4" />
              <text className="pm-label" x={x} y={y - 20} textAnchor="middle">
                {texts[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="pmap-cap">
        {step === total - 1
          ? "Votre carte est complète — il ne reste qu'à composer."
          : `Votre carte se dessine — ${total - 1 - step} question${total - 1 - step > 1 ? "s" : ""} avant le départ.`}
      </figcaption>
    </figure>
  );
}
