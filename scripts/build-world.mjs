/* Transforme le TopoJSON Natural Earth (land 110m, domaine public) en un seul
   chemin SVG, projeté en équirectangulaire sur un canevas 2000 × 1000.

   Faire la projection ici plutôt qu'au navigateur évite d'embarquer une
   bibliothèque de cartographie : à l'exécution, il ne reste qu'une chaîne à
   dessiner, et le cadrage se fait en déplaçant le viewBox. */
import fs from "node:fs";

const topo = JSON.parse(fs.readFileSync("land110.json", "utf8"));
const [sx, sy] = topo.transform.scale;
const [tx, ty] = topo.transform.translate;

/* Les arcs sont encodés en delta : on cumule, puis on applique la transformée. */
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * sx + tx, y * sy + ty];
  });
});

const W = 2000, H = 1000;
const project = ([lon, lat]) => [
  ((lon + 180) / 360) * W,
  ((90 - lat) / 180) * H,
];

/* Un index négatif ~i désigne l'arc (-i-1) parcouru à l'envers. */
const ringOf = (indexes) => {
  const pts = [];
  for (const idx of indexes) {
    const arc = idx < 0 ? arcs[~idx].slice().reverse() : arcs[idx];
    /* Le premier point d'un arc répète le dernier du précédent. */
    for (let i = pts.length ? 1 : 0; i < arc.length; i++) pts.push(arc[i]);
  }
  return pts;
};

/* Aire signée : sert à écarter les îlots trop petits pour être lisibles. */
const area = (pts) => {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  }
  return Math.abs(a / 2);
};

const MIN_AREA = 6; /* en unités du canevas 2000 × 1000 */
let d = "";
let kept = 0, dropped = 0;

for (const geom of topo.objects.land.geometries) {
  const polygons = geom.type === "MultiPolygon" ? geom.arcs : [geom.arcs];
  for (const poly of polygons) {
    for (const ring of poly) {
      const pts = ringOf(ring).map(project);
      if (pts.length < 4) { dropped++; continue; }
      if (area(pts) < MIN_AREA) { dropped++; continue; }
      kept++;
      /* La Russie franchit l'antiméridien : ses points passent d'un bord à
         l'autre du canevas, et relier les deux tracerait une bande sur toute
         la largeur. On coupe l'anneau à la couture et on ferme chaque morceau
         séparément — le remplissage reste juste, le parasite disparaît. */
      let sub = [];
      const flush = () => {
        if (sub.length > 2) {
          d += "M" + sub.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1)).join("L") + "Z";
        }
        sub = [];
      };
      for (let i = 0; i < pts.length; i++) {
        if (i && Math.abs(pts[i][0] - pts[i - 1][0]) > W / 2) flush();
        sub.push(pts[i]);
      }
      flush();
    }
  }
}

fs.mkdirSync("out", { recursive: true });
fs.writeFileSync("out/world-land.json", JSON.stringify({ w: W, h: H, d }));
console.log("anneaux gardés :", kept, "— écartés :", dropped);
console.log("octets :", fs.statSync("out/world-land.json").size);
