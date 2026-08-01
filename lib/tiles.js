/* Géométrie d'une carte glissante.

   C'est le calcul que fait n'importe quelle carte web : le monde est découpé
   en tuiles de 256 px, et le niveau de zoom double le nombre de tuiles par
   côté. Poser les bonnes tuiles au bon endroit suffit à afficher une vraie
   carte — il n'y a pas de bibliothèque à embarquer.

   Ce module est partagé par la carte de l'exemple et par celle du parcours :
   les deux montrent donc exactement le même fond, au même traitement.

   Attribution : © les contributeurs d'OpenStreetMap. */

export const TILE = 256;

export const lonToX = (lon, z) => ((lon + 180) / 360) * Math.pow(2, z) * TILE;

export const latToY = (lat, z) => {
  /* Projection de Mercator, bornée : au-delà de ±85° la formule diverge. */
  const clamped = Math.max(-85.05, Math.min(85.05, lat));
  const r = (clamped * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z) * TILE;
};

/** Le plus fort zoom auquel tous les points tiennent dans le cadre. */
export function fitZoom(points, { width, height, pad = 90, min = 1, max = 11 }) {
  if (points.length < 2) return Math.min(max, 9);
  for (let z = max; z >= min; z--) {
    const xs = points.map((p) => lonToX(p.lon, z));
    const ys = points.map((p) => latToY(p.lat, z));
    if (
      Math.max(...xs) - Math.min(...xs) <= width - pad * 2 &&
      Math.max(...ys) - Math.min(...ys) <= height - pad * 2
    ) {
      return z;
    }
  }
  return min;
}

/* Le fond de carte. Le sous-domaine est fixe : la répartition sur a/b/c n'a
   plus d'intérêt en HTTP/2 et brouille le cache du navigateur. */
export const tileUrl = (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

/** Les tuiles couvrant un cadre, plus les points projetés dedans. */
export function layout({ points, width, height, zoom, center }) {
  const z = Math.max(0, Math.round(zoom));
  const focus = center || {
    lat: (Math.min(...points.map((p) => p.lat)) + Math.max(...points.map((p) => p.lat))) / 2,
    lon: (Math.min(...points.map((p) => p.lon)) + Math.max(...points.map((p) => p.lon))) / 2,
  };

  const originX = lonToX(focus.lon, z) - width / 2;
  const originY = latToY(focus.lat, z) - height / 2;

  const n = Math.pow(2, z);
  const tiles = [];
  for (let ty = Math.floor(originY / TILE); ty <= Math.floor((originY + height) / TILE); ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = Math.floor(originX / TILE); tx <= Math.floor((originX + width) / TILE); tx++) {
      /* Le monde boucle en longitude : une colonne hors bornes revient de
         l'autre côté plutôt que de laisser un trou dans l'océan. */
      const wrapped = ((tx % n) + n) % n;
      tiles.push({
        key: `${z}:${tx}:${ty}`,
        url: tileUrl(z, wrapped, ty),
        left: tx * TILE - originX,
        top: ty * TILE - originY,
      });
    }
  }

  const project = (p) => ({
    ...p,
    px: lonToX(p.lon, z) - originX,
    py: latToY(p.lat, z) - originY,
  });

  return { z, tiles, points: points.map(project), project };
}

/** Une polyligne adoucie qui relie les points dans l'ordre. */
export function routePath(pts, lift = 0.16) {
  if (pts.length < 2) return null;
  let d = `M${pts[0].px.toFixed(1)} ${pts[0].py.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const mx = (a.px + b.px) / 2;
    const my = (a.py + b.py) / 2;
    /* Le point de contrôle est décalé perpendiculairement au segment : la
       route se courbe comme une route aérienne au lieu de couper droit. */
    const dx = b.px - a.px;
    const dy = b.py - a.py;
    const len = Math.hypot(dx, dy) || 1;
    const off = Math.min(len * lift, 90);
    d += ` Q${(mx + (dy / len) * off).toFixed(1)} ${(my - (dx / len) * off).toFixed(1)}, ${b.px.toFixed(1)} ${b.py.toFixed(1)}`;
  }
  return d;
}
