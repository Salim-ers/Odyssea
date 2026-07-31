"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AIRPORTS, DEST_SUGG } from "../lib/data";
import { useOdyssea, frDate } from "../lib/store";
import { Icon } from "../lib/icons";

/* La barre de recherche.
   Les champs sont contrôlés par React : la saisie n'est jamais interrompue,
   et les panneaux ne font qu'apparaître/disparaître par une classe. */
export default function Composer() {
  const { S, patchOb, toast } = useOdyssea();
  const o = S.ob;
  const [open, setOpen] = useState(null);
  const [flex, setFlex] = useState("Dates exactes");
  const root = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e) => {
      if (root.current && !root.current.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(null);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggle = (k) => setOpen((v) => (v === k ? null : k));
  const ctx = `${o.dest || "Votre destination"} · ${frDate(o.dep)} → ${frDate(o.ret)} · ${o.trav} voyageur${o.trav > 1 ? "s" : ""}`;

  return (
    <div className="composer-zone">
      <div className="composer" ref={root}>
        <div className="cfields">
          <button type="button" className={"cfield" + (open === "from" ? " open" : "")} onClick={() => toggle("from")}>
            <span className="lab">Départ</span>
            <span className="val">{o.from}</span>
            <div className={"cpanel" + (open === "from" ? " open" : "")} onClick={(e) => e.stopPropagation()}>
              {AIRPORTS.map((a) => (
                <button key={a[0]} className="row" onClick={() => { patchOb(() => ({ from: a[1].replace(" — Charles de Gaulle", " — CDG") })); setOpen(null); }}>
                  <span className="code">{a[0]}</span>
                  <span><b>{a[1]}</b><i>{a[2]}</i></span>
                </button>
              ))}
            </div>
          </button>

          <div className={"cfield" + (open === "dest" ? " open" : "")}>
            <span className="lab">Destination</span>
            <input className="val" value={o.dest} aria-label="Destination"
              placeholder="Une ville, un pays, une envie…"
              onFocus={() => setOpen("dest")}
              onChange={(e) => patchOb(() => ({ dest: e.target.value }))} />
            <div className={"cpanel" + (open === "dest" ? " open" : "")} onClick={(e) => e.stopPropagation()}>
              {DEST_SUGG.map((d) => (
                <button key={d[0]} className="row" onClick={() => { patchOb(() => ({ dest: d[0] })); setOpen(null); }}>
                  <span className="code">{d[0].slice(0, 2).toUpperCase()}</span>
                  <span><b>{d[0]}</b><i>{d[1]}</i></span>
                </button>
              ))}
            </div>
          </div>

          <button type="button" className={"cfield" + (open === "dates" ? " open" : "")} onClick={() => toggle("dates")}>
            <span className="lab">Dates</span>
            <span className="val">{frDate(o.dep)} → {frDate(o.ret)}</span>
            <div className={"cpanel" + (open === "dates" ? " open" : "")} onClick={(e) => e.stopPropagation()}>
              <div className="dates">
                <div>
                  <label htmlFor="c-dep">Départ</label>
                  <input id="c-dep" type="date" value={o.dep} onChange={(e) => patchOb(() => ({ dep: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="c-ret">Retour</label>
                  <input id="c-ret" type="date" value={o.ret} onChange={(e) => patchOb(() => ({ ret: e.target.value }))} />
                </div>
              </div>
              <div className="pchips">
                {["Dates exactes", "± 2 jours", "± 1 semaine"].map((f) => (
                  <button key={f} className={"pchip" + (flex === f ? " on" : "")} onClick={() => { setFlex(f); toast("Souplesse : " + f); }}>{f}</button>
                ))}
              </div>
            </div>
          </button>

          <button type="button" className={"cfield" + (open === "trav" ? " open" : "")} onClick={() => toggle("trav")}>
            <span className="lab">Voyageurs</span>
            <span className="val">{o.trav} · {o.group}</span>
            <div className={"cpanel" + (open === "trav" ? " open" : "")} onClick={(e) => e.stopPropagation()}>
              <div className="counter-row">
                <span><b>Voyageurs</b><i>adultes et enfants</i></span>
                <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button className="cstep" aria-label="Retirer" onClick={() => patchOb((ob) => ({ trav: Math.max(1, ob.trav - 1) }))}>−</button>
                  <span className="cnum">{o.trav}</span>
                  <button className="cstep" aria-label="Ajouter" onClick={() => patchOb((ob) => ({ trav: Math.min(12, ob.trav + 1) }))}>+</button>
                </span>
              </div>
              <div className="pchips">
                {["Solo", "Couple", "Famille", "Amis"].map((g) => (
                  <button key={g} className={"pchip" + (o.group === g ? " on" : "")} onClick={() => patchOb(() => ({ group: g }))}>{g}</button>
                ))}
              </div>
            </div>
          </button>

          <div className="cgo">
            <button className="btn-search" onClick={() => router.push("/parcours")}>
              <span className="sheen" />
              <Icon name="compass" />
              Composer mon voyage
            </button>
          </div>
        </div>

        <div className="copts">
          {[["vol", "Vols"], ["hotel", "Hôtels"], ["act", "Activités"]].map(([k, label]) => (
            <button key={k} className={"opt" + (o.include[k] ? " on" : "")} aria-pressed={o.include[k]}
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
