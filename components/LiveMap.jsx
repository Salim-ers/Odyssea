"use client";
import { useEffect, useRef, useState } from "react";
import { legsFor, humanKm, humanTime } from "../lib/route";

/* La carte du voyage — une vraie carte, manipulable.

   Elle affiche ce qu'affiche une carte : les rues, les routes, les frontières,
   les villes et leurs quartiers, les gares, les aéroports, les points
   d'intérêt. On peut la déplacer, zoomer, cliquer une étape. Rien n'est
   décoratif : chaque trait est soit une route réelle rendue par le moteur de
   routage, soit l'orthodromie d'un vol, et chacun porte sa distance et sa
   durée.

   Leaflet est chargé à la demande, côté navigateur seulement : il touche au
   DOM et au `window`, donc il ne peut pas être rendu côté serveur.

   Le fond est remplaçable. Par défaut OpenStreetMap, qui ne demande aucune
   clé ; NEXT_PUBLIC_MAP_TILES et NEXT_PUBLIC_MAP_ATTRIBUTION permettent de
   basculer sur un fournisseur à clé — Mapbox, Stadia, Thunderforest — sans
   toucher au code. */

const TILES =
  process.env.NEXT_PUBLIC_MAP_TILES || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export default function LiveMap({ stops, active, onSelect, height = 460 }) {
  const host = useRef(null);
  const map = useRef(null);
  const layers = useRef({ markers: [], lines: [] });
  const [legs, setLegs] = useState([]);
  const [ready, setReady] = useState(false);

  const points = (stops || []).filter(
    (s) => Number.isFinite(s?.lat) && Number.isFinite(s?.lon)
  );
  const key = points.map((p) => `${p.lat},${p.lon}`).join("|");

  /* ---- La carte, une fois ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!alive || !host.current || map.current) return;

      map.current = L.map(host.current, {
        zoomControl: true,
        scrollWheelZoom: false, /* la molette doit faire défiler la page */
        attributionControl: true,
      });
      L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map.current);
      /* La molette ne prend la main qu'après un clic : sinon la carte capture
         le défilement de la page dès qu'on la survole. */
      map.current.on("click", () => map.current.scrollWheelZoom.enable());
      map.current.on("mouseout", () => map.current.scrollWheelZoom.disable());
      setReady(true);
    })();
    return () => {
      alive = false;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  /* ---- Les tronçons réels ---- */
  useEffect(() => {
    if (points.length < 2) return setLegs([]);
    const ctrl = new AbortController();
    legsFor(points, { signal: ctrl.signal })
      .then(setLegs)
      .catch(() => {});
    return () => ctrl.abort();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [key]);

  /* ---- Étapes et tracés ---- */
  useEffect(() => {
    if (!ready || !map.current || !points.length) return;
    let alive = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!alive || !map.current) return;
      const m = map.current;

      for (const l of [...layers.current.markers, ...layers.current.lines]) m.removeLayer(l);
      layers.current = { markers: [], lines: [] };

      for (const leg of legs) {
        /* Un halo clair sous le trait : le tracé reste lisible sur une route
           déjà dessinée par le fond de carte. */
        layers.current.lines.push(
          L.polyline(leg.line, { color: "#FCFBF8", weight: 7, opacity: 0.85 }).addTo(m)
        );
        layers.current.lines.push(
          L.polyline(leg.line, {
            color: leg.mode === "air" ? "#0F3A4A" : "#B85F23",
            weight: 3.5,
            opacity: 0.95,
            dashArray: leg.mode === "air" ? "1 9" : null,
            lineCap: "round",
          })
            .bindTooltip(
              `${leg.mode === "air" ? "Vol" : "Route"} · ${humanKm(leg.km)} · ${humanTime(leg.minutes)}` +
                (leg.estimated ? " (estimé)" : ""),
              { sticky: true }
            )
            .addTo(m)
        );
      }

      points.forEach((s, i) => {
        const on = active === s.name;
        const icon = L.divIcon({
          className: "",
          html:
            `<span class="lm-pin${on ? " on" : ""}">` +
            `<b>${String(i + 1).padStart(2, "0")}</b><i>${s.name}</i></span>`,
          iconSize: null,
          iconAnchor: [0, 0],
        });
        const marker = L.marker([s.lat, s.lon], { icon, riseOnHover: true }).addTo(m);
        const nights = Number.isFinite(s.nights)
          ? `${s.nights} nuit${s.nights > 1 ? "s" : ""}`
          : null;
        marker.bindPopup(
          `<b>${s.name}</b>` +
            (s.region ? `<span>${s.region}${nights ? ` · ${nights}` : ""}</span>` : "") +
            (s.why ? `<p>${s.why}</p>` : "")
        );
        if (onSelect) marker.on("click", () => onSelect(s.name));
        layers.current.markers.push(marker);
      });

      /* Le cadrage englobe tout le tracé, pas seulement les étapes : une route
         qui contourne un golfe sortirait du cadre. */
      const all = [
        ...points.map((s) => [s.lat, s.lon]),
        ...legs.flatMap((l) => l.line),
      ];
      m.fitBounds(L.latLngBounds(all), { padding: [46, 46], maxZoom: 13 });
    })();
    return () => {
      alive = false;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [ready, key, legs, active]);

  if (!points.length) return null;

  return (
    <figure className="livemap">
      <div className="lm-canvas" ref={host} style={{ height }} />
      {legs.length > 0 && (
        <figcaption className="lm-legs">
          {legs.map((l, i) => (
            <span key={i} className={"lm-leg " + l.mode}>
              <b>{l.from.name}</b>
              <em>→</em>
              <b>{l.to.name}</b>
              <i>
                {humanKm(l.km)} · {humanTime(l.minutes)}
                {l.estimated ? " estimé" : ""}
              </i>
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
