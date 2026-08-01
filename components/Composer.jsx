"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AIRPORTS, DEST_SUGG } from "../lib/data";
import { useOdyssea, frDate } from "../lib/store";
import { Icon } from "../lib/icons";

/* La barre de recherche.

   Chaque champ est un conteneur neutre : le déclencheur et le panneau sont
   deux frères. Aucun élément interactif n'est imbriqué dans un autre — c'est
   ce qui faisait sortir les panneaux de leur champ et cassait la mise en page.

   Les champs sont contrôlés par React : la saisie n'est jamais interrompue,
   les panneaux ne font qu'apparaître et disparaître par une classe. */

const FLEX = ["Dates exactes", "± 2 jours", "± 1 semaine"];
const norm = (s) =>
  (s || "").normalize("NFD").replace(new RegExp("[̀-ͯ]", "g"), "").toLowerCase().trim();

const nightsBetween = (dep, ret) => {
  if (!dep || !ret) return 0;
  const d = (new Date(ret) - new Date(dep)) / 86400000;
  return d > 0 ? Math.round(d) : 0;
};

export default function Composer() {
  const { S, patchOb, toast } = useOdyssea();
  const o = S.ob;
  const [open, setOpen] = useState(null);
  const [flex, setFlex] = useState(FLEX[0]);
  const [cursor, setCursor] = useState(0);
  const root = useRef(null);
  const destInput = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const onPointer = (e) => {
      if (root.current && !root.current.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  /* Suggestions filtrées à la frappe, sans jamais vider la liste :
     si rien ne correspond, on propose la saisie telle quelle. */
  const q = norm(o.dest);
  const matches = useMemo(() => {
    if (!q) return DEST_SUGG;
    return DEST_SUGG.filter(([name, sub]) => norm(name).includes(q) || norm(sub).includes(q));
  }, [q]);
  const freeText = o.dest.trim() && !matches.some(([n]) => norm(n) === q);

  /* Le bandeau cookies est en position fixe et passerait devant les panneaux :
     on le prévient qu'une recherche est en cours. */
  useEffect(() => {
    document.body.dataset.composer = open ? "open" : "";
    return () => { document.body.dataset.composer = ""; };
  }, [open]);

  const openPanel = (k) => {
    setCursor(0);
    setOpen((v) => (v === k ? null : k));
  };

  const pickDest = (name) => {
    patchOb(() => ({ dest: name }));
    setOpen(null);
    destInput.current?.blur();
  };

  /* Départ et retour restent cohérents quoi qu'il arrive. */
  const setDep = (v) => {
    patchOb((ob) => (nightsBetween(v, ob.ret) > 0 ? { dep: v } : { dep: v, ret: addDays(v, 7) }));
  };
  const setRet = (v) => {
    patchOb((ob) => (nightsBetween(ob.dep, v) > 0 ? { ret: v } : { ret: v, dep: addDays(v, -7) }));
  };

  const onDestKey = (e) => {
    const list = freeText ? [...matches, null] : matches;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen("dest");
      const d = e.key === "ArrowDown" ? 1 : -1;
      setCursor((c) => (c + d + list.length) % list.length);
      return;
    }
    if (e.key === "Enter" && open === "dest") {
      e.preventDefault();
      const hit = list[cursor];
      pickDest(hit ? hit[0] : o.dest.trim());
    }
  };

  const nights = nightsBetween(o.dep, o.ret);
  const ctx = `${o.dest.trim() || "Votre destination"} · ${frDate(o.dep)} → ${frDate(o.ret)}${
    nights ? ` · ${nights} nuit${nights > 1 ? "s" : ""}` : ""
  } · ${o.trav} voyageur${o.trav > 1 ? "s" : ""}`;

  return (
    <div className="composer-zone">
      <div className="composer" ref={root}>
        <div className="cfields">
          {/* Départ */}
          <div className={"cfield" + (open === "from" ? " open" : "")}>
            <button type="button" className="ctrigger" aria-expanded={open === "from"}
              aria-haspopup="listbox" onClick={() => openPanel("from")}>
              <span className="lab">Départ</span>
              <span className="val">{o.from}</span>
            </button>
            <div className={"cpanel" + (open === "from" ? " open" : "")} role="listbox">
              <div className="cpanel-hd">Aéroports de départ</div>
              {AIRPORTS.map((a) => {
                const label = a[1].replace(" — Charles de Gaulle", " — CDG");
                return (
                  <button type="button" key={a[0]} role="option" aria-selected={o.from === label}
                    className={"row" + (o.from === label ? " sel" : "")}
                    onClick={() => { patchOb(() => ({ from: label })); setOpen(null); }}>
                    <span className="code">{a[0]}</span>
                    <span className="rtx"><b>{a[1]}</b><i>{a[2]}</i></span>
                    {o.from === label && <Icon name="check" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination — champ libre + suggestions */}
          <div className={"cfield" + (open === "dest" ? " open" : "")}>
            <span className="ctrigger as-input">
              <label className="lab" htmlFor="c-dest">Destination</label>
              <input id="c-dest" ref={destInput} className="val" value={o.dest} autoComplete="off"
                placeholder="Une ville, un pays, une envie…"
                role="combobox" aria-expanded={open === "dest"} aria-controls="c-dest-list"
                onFocus={() => { setCursor(0); setOpen("dest"); }}
                onKeyDown={onDestKey}
                onChange={(e) => { setCursor(0); patchOb(() => ({ dest: e.target.value })); }} />
              {o.dest && (
                <button type="button" className="cclear" aria-label="Effacer la destination"
                  onClick={() => { patchOb(() => ({ dest: "" })); destInput.current?.focus(); }}>×</button>
              )}
            </span>
            <div id="c-dest-list" className={"cpanel wide" + (open === "dest" ? " open" : "")} role="listbox">
              <div className="cpanel-hd">{q ? "Résultats" : "Destinations les plus demandées"}</div>
              {matches.map((d, i) => (
                <button type="button" key={d[0]} role="option" aria-selected={cursor === i}
                  className={"row" + (cursor === i ? " cur" : "")}
                  onMouseEnter={() => setCursor(i)} onClick={() => pickDest(d[0])}>
                  <span className="code">{d[0].slice(0, 2).toUpperCase()}</span>
                  <span className="rtx"><b>{d[0]}</b><i>{d[1]}</i></span>
                </button>
              ))}
              {freeText && (
                <button type="button" role="option" aria-selected={cursor === matches.length}
                  className={"row free" + (cursor === matches.length ? " cur" : "")}
                  onMouseEnter={() => setCursor(matches.length)} onClick={() => pickDest(o.dest.trim())}>
                  <span className="code"><Icon name="compass" /></span>
                  <span className="rtx"><b>« {o.dest.trim()} »</b><i>Composer un voyage sur cette envie</i></span>
                </button>
              )}
              {!matches.length && !freeText && (
                <div className="cpanel-empty">Commencez à écrire une ville, un pays ou une envie.</div>
              )}
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
              <div className="cpanel-hd">
                {nights ? `${nights} nuit${nights > 1 ? "s" : ""} sur place` : "Choisissez vos dates"}
              </div>
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

          {/* Voyageurs */}
          <div className={"cfield" + (open === "trav" ? " open" : "")}>
            <button type="button" className="ctrigger" aria-expanded={open === "trav"}
              onClick={() => openPanel("trav")}>
              <span className="lab">Voyageurs</span>
              <span className="val">{o.trav} · {o.group}</span>
            </button>
            <div className={"cpanel" + (open === "trav" ? " open" : "")}>
              <div className="counter-row">
                <span className="rtx"><b>Voyageurs</b><i>adultes et enfants</i></span>
                <span className="counter">
                  <button type="button" className="cstep" aria-label="Retirer un voyageur" disabled={o.trav <= 1}
                    onClick={() => patchOb((ob) => ({ trav: Math.max(1, ob.trav - 1) }))}>−</button>
                  <span className="cnum">{o.trav}</span>
                  <button type="button" className="cstep" aria-label="Ajouter un voyageur" disabled={o.trav >= 12}
                    onClick={() => patchOb((ob) => ({ trav: Math.min(12, ob.trav + 1) }))}>+</button>
                </span>
              </div>
              <div className="cpanel-hd sub">Vous partez</div>
              <div className="pchips">
                {["Solo", "Couple", "Famille", "Amis"].map((g) => (
                  <button type="button" key={g} className={"pchip" + (o.group === g ? " on" : "")}
                    onClick={() => patchOb(() => ({ group: g }))}>{g}</button>
                ))}
              </div>
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

        <div className="copts">
          {[["vol", "Vols"], ["hotel", "Hôtels"], ["act", "Activités"]].map(([k, label]) => (
            <button type="button" key={k} className={"opt" + (o.include[k] ? " on" : "")} aria-pressed={o.include[k]}
              onClick={() => patchOb((ob) => ({ include: { ...ob.include, [k]: !ob.include[k] } }))}>
              {label}
            </button>
          ))}
          <span className="ctxline">{ctx}</span>
        </div>
      </div>

      <div className="reassure">
        <span>Première proposition en quelques minutes</span>
        <span aria-hidden="true">·</span>
        <span>Modification libre</span>
        <span aria-hidden="true">·</span>
        <span>Sans engagement</span>
      </div>
    </div>
  );
}

function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
