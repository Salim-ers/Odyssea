"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AIRPORTS, DEST_SUGG } from "../lib/data";
import { loadPlaces, peekPlaces, search, norm } from "../lib/places";
import { useOdyssea, frDate } from "../lib/store";
import { Icon } from "../lib/icons";

/* La barre de recherche.

   Chaque champ est un conteneur neutre : le déclencheur et le panneau sont
   deux frères. Aucun élément interactif n'est imbriqué dans un autre — c'est
   ce qui faisait sortir les panneaux de leur champ et cassait la mise en page.

   Départ et destination cherchent dans le monde entier. Le jeu de données
   n'est téléchargé qu'à la première ouverture d'un de ces deux champs. */

const FLEX = ["Dates exactes", "± 2 jours", "± 1 semaine"];
const GROUPS = ["Solo", "Couple", "Famille", "Amis"];
const FIXED = { Solo: 1, Couple: 2 };

const nightsBetween = (dep, ret) => {
  if (!dep || !ret) return 0;
  const d = (new Date(ret) - new Date(dep)) / 86400000;
  return d > 0 ? Math.round(d) : 0;
};

const plural = (n, one, many = one + "s") => `${n} ${n > 1 ? many : one}`;

export default function Composer() {
  const { S, patchOb, toast } = useOdyssea();
  const o = S.ob;
  const [open, setOpen] = useState(null);
  const [flex, setFlex] = useState(FLEX[0]);
  const [cursor, setCursor] = useState(0);
  const [fromDraft, setFromDraft] = useState("");
  const [places, setPlaces] = useState(() => peekPlaces());
  const [loadErr, setLoadErr] = useState(false);
  const root = useRef(null);
  const destInput = useRef(null);
  const fromInput = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const onPointer = (e) => {
      if (root.current && !root.current.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(null); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  /* Le bandeau cookies est en position fixe et passerait devant les panneaux. */
  useEffect(() => {
    document.body.dataset.composer = open ? "open" : "";
    return () => { document.body.dataset.composer = ""; };
  }, [open]);

  useEffect(() => { if (open !== "from") setFromDraft(""); }, [open]);

  /* Le monde entier, mais seulement quand on en a besoin. */
  const wake = useCallback(() => {
    if (places || loadErr) return;
    loadPlaces().then(setPlaces).catch(() => setLoadErr(true));
  }, [places, loadErr]);

  /* ---- Destination : suggestions maison à vide, monde entier à la frappe ---- */
  const q = o.dest.trim();
  const destList = useMemo(() => {
    if (!q) return DEST_SUGG.map(([name, sub]) => ({ kind: "curated", name, sub }));
    if (!places) return [];
    return search(places.destinations, q, 30);
  }, [q, places]);
  const freeText = q && !destList.some((d) => norm(d.name) === norm(q));

  /* ---- Départ : aéroports habituels à vide, monde entier à la frappe ---- */
  const fq = fromDraft.trim();
  const fromList = useMemo(() => {
    if (!fq) return AIRPORTS.map(([code, name, sub]) => ({ code, name, sub, curated: true }));
    if (!places) return [];
    return search(places.airports, fq, 30);
  }, [fq, places]);

  const openPanel = (k) => { setCursor(0); setOpen((v) => (v === k ? null : k)); };

  const pickDest = (name) => {
    patchOb(() => ({ dest: name }));
    setOpen(null);
    destInput.current?.blur();
  };

  const pickFrom = (a) => {
    if (!a) return;
    const label = a.curated ? a.name.replace(" — Charles de Gaulle", " — CDG") : `${a.city || a.name} — ${a.code}`;
    patchOb(() => ({ from: label }));
    setFromDraft("");
    setOpen(null);
    fromInput.current?.blur();
  };

  /* Départ et retour restent cohérents quoi qu'il arrive. */
  const setDep = (v) => patchOb((ob) => (nightsBetween(v, ob.ret) > 0 ? { dep: v } : { dep: v, ret: addDays(v, 7) }));
  const setRet = (v) => patchOb((ob) => (nightsBetween(ob.dep, v) > 0 ? { ret: v } : { ret: v, dep: addDays(v, -7) }));

  /* ---- Voyageurs : le groupe d'abord, le décompte seulement s'il a un sens ---- */
  const setGroup = (g) => patchOb((ob) => {
    if (FIXED[g]) return { group: g, adults: FIXED[g], kids: 0, trav: FIXED[g] };
    const adults = Math.max(g === "Amis" ? 2 : 1, ob.adults || 2);
    const kids = ob.kids || 0;
    return { group: g, adults, kids, trav: adults + kids };
  });
  const setCount = (key, v) => patchOb((ob) => {
    const adults = key === "adults" ? v : ob.adults;
    const kids = key === "kids" ? v : ob.kids;
    return { adults, kids, trav: adults + kids };
  });
  const asksCount = !FIXED[o.group];
  const travLabel = asksCount
    ? plural(o.adults, "adulte") + (o.kids ? ` · ${plural(o.kids, "enfant")}` : "")
    : `${plural(o.trav, "voyageur")} · ${o.group}`;

  /* Même navigation clavier pour les deux champs de saisie. */
  const listNav = (e, list, panel, onPick) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (open !== panel) return setOpen(panel);
      const d = e.key === "ArrowDown" ? 1 : -1;
      setCursor((c) => (list.length ? (c + d + list.length) % list.length : 0));
      return;
    }
    if (e.key === "Enter" && open === panel) {
      e.preventDefault();
      onPick(list[cursor]);
    }
  };

  const nights = nightsBetween(o.dep, o.ret);
  const ctx = `${o.dest.trim() || "Votre destination"} · ${frDate(o.dep)} → ${frDate(o.ret)}${
    nights ? ` · ${plural(nights, "nuit")}` : ""
  } · ${plural(o.trav, "voyageur")}`;

  const loading = (list, hasQuery) => hasQuery && !places && !loadErr && !list.length;

  return (
    <div className="composer-zone">
      <div className="composer" ref={root}>
        <div className="cfields">
          {/* Départ — tous les aéroports desservis du monde */}
          <div className={"cfield" + (open === "from" ? " open" : "")}>
            <span className="ctrigger as-input">
              <label className="lab" htmlFor="c-from">Départ</label>
              <input id="c-from" ref={fromInput} className="val" autoComplete="off"
                value={open === "from" ? fromDraft : o.from}
                placeholder={open === "from" ? o.from : "Ville ou code aéroport"}
                role="combobox" aria-expanded={open === "from"} aria-controls="c-from-list"
                onFocus={() => { setCursor(0); setFromDraft(""); setOpen("from"); wake(); }}
                onKeyDown={(e) => listNav(e, fromList, "from", pickFrom)}
                onChange={(e) => { setCursor(0); setFromDraft(e.target.value); wake(); }} />
            </span>
            <div id="c-from-list" className={"cpanel" + (open === "from" ? " open" : "")} role="listbox">
              <div className="cpanel-hd">
                {fq ? "Résultats" : "Départs les plus fréquents"}
                {!fq && <em>Cherchez n&apos;importe quel aéroport du monde</em>}
              </div>
              {fromList.map((a, i) => (
                <button type="button" key={a.code} role="option" aria-selected={cursor === i}
                  className={"row" + (cursor === i ? " cur" : "")}
                  onMouseEnter={() => setCursor(i)} onClick={() => pickFrom(a)}>
                  <span className="code">{a.code}</span>
                  <span className="rtx">
                    <b>{a.curated ? a.name : `${a.city || a.name}`}</b>
                    <i>{a.curated ? a.sub : `${a.name} · ${a.country}`}</i>
                  </span>
                </button>
              ))}
              {loading(fromList, !!fq) && <div className="cpanel-empty">Chargement des aéroports…</div>}
              {!!fq && !!places && !fromList.length && (
                <div className="cpanel-empty">Aucun aéroport ne correspond à « {fq} ».</div>
              )}
              {loadErr && <div className="cpanel-empty">Liste indisponible — réessayez dans un instant.</div>}
            </div>
          </div>

          {/* Destination — pays et villes du monde entier */}
          <div className={"cfield" + (open === "dest" ? " open" : "")}>
            <span className="ctrigger as-input">
              <label className="lab" htmlFor="c-dest">Destination</label>
              <input id="c-dest" ref={destInput} className="val" value={o.dest} autoComplete="off"
                placeholder="Une ville, un pays, une envie…"
                role="combobox" aria-expanded={open === "dest"} aria-controls="c-dest-list"
                onFocus={() => { setCursor(0); setOpen("dest"); wake(); }}
                onKeyDown={(e) => listNav(e, freeText ? [...destList, null] : destList, "dest",
                  (hit) => pickDest(hit ? hit.name : q))}
                onChange={(e) => { setCursor(0); patchOb(() => ({ dest: e.target.value })); wake(); }} />
              {o.dest && (
                <button type="button" className="cclear" aria-label="Effacer la destination"
                  onClick={() => { patchOb(() => ({ dest: "" })); destInput.current?.focus(); }}>×</button>
              )}
            </span>
            <div id="c-dest-list" className={"cpanel wide" + (open === "dest" ? " open" : "")} role="listbox">
              <div className="cpanel-hd">
                {q ? "Résultats" : "Destinations les plus demandées"}
                {!q && <em>Tous les pays et toutes les villes desservies</em>}
              </div>
              {destList.map((d, i) => (
                <button type="button" key={(d.kind || "") + d.name + (d.cc || "")} role="option" aria-selected={cursor === i}
                  className={"row" + (cursor === i ? " cur" : "")}
                  onMouseEnter={() => setCursor(i)} onClick={() => pickDest(d.name)}>
                  <span className="code">
                    {d.kind === "city" ? <Icon name="landmark" />
                      : d.kind === "country" ? <Icon name="map" />
                      : d.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="rtx"><b>{d.name}</b><i>{d.sub}</i></span>
                </button>
              ))}
              {freeText && (
                <button type="button" role="option" aria-selected={cursor === destList.length}
                  className={"row free" + (cursor === destList.length ? " cur" : "")}
                  onMouseEnter={() => setCursor(destList.length)} onClick={() => pickDest(q)}>
                  <span className="code"><Icon name="compass" /></span>
                  <span className="rtx"><b>« {q} »</b><i>Composer un voyage sur cette envie</i></span>
                </button>
              )}
              {loading(destList, !!q) && <div className="cpanel-empty">Chargement des destinations…</div>}
            </div>
          </div>

          {/* Dates */}
          <div className={"cfield" + (open === "dates" ? " open" : "")}>
            <button type="button" className="ctrigger" aria-expanded={open === "dates"}
              onClick={() => openPanel("dates")}>
              <span className="lab">Dates</span>
              <span className="val">{frDate(o.dep)} → {frDate(o.ret)}</span>
            </button>
            <div className={"cpanel" + (open === "dates" ? " open" : "")}>
              <div className="cpanel-hd">{nights ? `${plural(nights, "nuit")} sur place` : "Choisissez vos dates"}</div>
              <div className="dates">
                <div>
                  <label htmlFor="c-dep">Départ</label>
                  <input id="c-dep" type="date" value={o.dep} onChange={(e) => setDep(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="c-ret">Retour</label>
                  <input id="c-ret" type="date" value={o.ret} min={o.dep} onChange={(e) => setRet(e.target.value)} />
                </div>
              </div>
              <div className="cpanel-hd sub">Souplesse</div>
              <div className="pchips">
                {FLEX.map((f) => (
                  <button type="button" key={f} className={"pchip" + (flex === f ? " on" : "")}
                    onClick={() => { setFlex(f); toast("Souplesse : " + f); }}>{f}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Voyageurs — le groupe d'abord, puis adultes et enfants si besoin */}
          <div className={"cfield" + (open === "trav" ? " open" : "")}>
            <button type="button" className="ctrigger" aria-expanded={open === "trav"}
              onClick={() => openPanel("trav")}>
              <span className="lab">Voyageurs</span>
              <span className="val">{travLabel}</span>
            </button>
            <div className={"cpanel" + (open === "trav" ? " open" : "")}>
              <div className="cpanel-hd">Vous partez</div>
              <div className="pchips">
                {GROUPS.map((g) => (
                  <button type="button" key={g} className={"pchip" + (o.group === g ? " on" : "")}
                    onClick={() => setGroup(g)}>{g}</button>
                ))}
              </div>
              {asksCount ? (
                <>
                  <Counter label="Adultes" sub="18 ans et plus" value={o.adults}
                    min={o.group === "Amis" ? 2 : 1} max={12} onChange={(v) => setCount("adults", v)} />
                  <Counter label="Enfants" sub="moins de 18 ans" value={o.kids}
                    min={0} max={8} onChange={(v) => setCount("kids", v)} />
                </>
              ) : (
                <p className="cpanel-note">
                  {o.group === "Solo"
                    ? "Vous voyagez seul : rien d'autre à préciser."
                    : "À deux : rien d'autre à préciser."}
                </p>
              )}
            </div>
          </div>

          <div className="cgo">
            <button type="button" className="btn-search" onClick={() => router.push("/parcours")}>
              <span className="sheen" />
              <Icon name="compass" />
              Composer mon voyage
            </button>
          </div>
        </div>

        {/* Ce qu'Odyssea doit prendre en charge — posé comme une question. */}
        <div className="copts">
          <span className="coptq" id="copts-q">Que devons-nous organiser&nbsp;?</span>
          <span className="optrow" role="group" aria-labelledby="copts-q">
            {[["vol", "Les vols"], ["hotel", "L'hébergement"], ["act", "Les activités"]].map(([k, label]) => (
              <button type="button" key={k} className={"opt" + (o.include[k] ? " on" : "")} aria-pressed={o.include[k]}
                onClick={() => patchOb((ob) => ({ include: { ...ob.include, [k]: !ob.include[k] } }))}>
                <span className="tick" aria-hidden="true"><Icon name="check" /></span>
                {label}
              </button>
            ))}
          </span>
          <span className="ctxline">{ctx}</span>
        </div>
      </div>
    </div>
  );
}

function Counter({ label, sub, value, min, max, onChange }) {
  return (
    <div className="counter-row">
      <span className="rtx"><b>{label}</b><i>{sub}</i></span>
      <span className="counter">
        <button type="button" className="cstep" aria-label={`Retirer — ${label}`} disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <input className="cnum" type="number" min={min} max={max} value={value} aria-label={label}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onChange(Number.isNaN(n) ? min : Math.max(min, Math.min(max, n)));
          }} />
        <button type="button" className="cstep" aria-label={`Ajouter — ${label}`} disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </span>
    </div>
  );
}

function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
