"use client";
import Link from "next/link";
import { TABS } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon } from "../../lib/icons";
import Wordmark from "../Wordmark";

const DOCK = [["dash", "compass", "Aperçu"], ["itin", "list", "Jours"], ["restos", "food", "Restos"], ["budget", "wallet", "Budget"], ["check", "shield", "Check"]];

export default function Chrome({ tab, setTab, children }) {
  const { readiness, toast } = useOdyssea();
  return (
    <div className="app">
      <div className="app-bar on-dark">
        <Wordmark />
        <div className="right">
          <span className="saved">Modifié à l&apos;instant · sauvegardé</span>
          <Link className="btn btn-line small" href="/parcours">Modifier mes réponses</Link>
          <button className="btn btn-gold small" onClick={() => toast("Lien de partage copié (démo).")}>Partager le voyage</button>
        </div>
      </div>
      <div className="tabszone">
        <nav className="tabs" aria-label="Sections du voyage">
          {TABS.map(([k, icon, label]) => (
            <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>
              <Icon name={icon} />{label}
              {k === "check" && readiness.open > 0 && <span className="warn" aria-label="Points à régler" />}
            </button>
          ))}
        </nav>
      </div>
      {children}
      <nav id="dock" aria-label="Navigation mobile">
        {DOCK.map(([k, icon, label]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            <Icon name={icon} />{label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function Screen({ kicker, title, intro, children }) {
  return (
    <section className="screen">
      {(kicker || title) && (
        <div className="shead">
          {kicker && <div className="kicker gold">{kicker}</div>}
          {title && <h1>{title}</h1>}
          {intro && <p>{intro}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function WeatherAlert() {
  const { S, actions, setModal } = useOdyssea();
  if (S.planApplied) {
    return (
      <div className="alert ok">
        <span className="ic"><Icon name="check" /></span>
        <div>
          <b>Plan météo du jour 4 appliqué</b>
          <p>Les jardins passent au matin, le musée national couvre l&apos;averse. Réversible à tout moment.</p>
          <div className="acts"><button className="btn btn-line small" onClick={actions.revertPlan}>Rétablir le plan initial</button></div>
        </div>
      </div>
    );
  }
  return (
    <div className="alert">
      <span className="ic"><Icon name="rain" /></span>
      <div style={{ flex: 1 }}>
        <b>Averses probables mardi après-midi (jour 4)</b>
        <p>70 % de risque entre 14 h et 17 h à Kuala Lumpur — pile pendant les jardins botaniques. Un plan B garde tout, dans un autre ordre. Rien n&apos;est modifié sans votre accord.</p>
        <div className="acts">
          <button className="btn btn-gold small" onClick={actions.applyPlan}>Appliquer le plan B</button>
          <button className="btn btn-line small" onClick={() => setModal(<ComparePlans />)}>Comparer les deux</button>
        </div>
      </div>
    </div>
  );
}

export function ComparePlans() {
  const { S, actions, setModal } = useOdyssea();
  const { DAY4A, DAY4B } = require("../../lib/data");
  const col = (title, items) => (
    <div>
      <div className="kicker" style={{ marginBottom: 8 }}>{title}</div>
      {items.map((i) => (
        <div key={i.t + i.f} className={"cmp-item" + (i.swap ? " swap" : "")}>
          <span className="t">{i.t}</span>{i.f}
        </div>
      ))}
    </div>
  );
  return (
    <>
      <h3>Jour 4 — plan initial vs plan B météo</h3>
      <p className="note">Rien ne saute : les jardins passent au matin (au sec), le musée national couvre l&apos;averse. Merdeka Square reste au programme, sous les arcades.</p>
      <div className="grid2" style={{ marginTop: 14, gap: 12 }}>
        {col("PLAN INITIAL", DAY4A)}
        {col("PLAN B · SURLIGNÉ = DÉPLACÉ", DAY4B)}
      </div>
      {!S.planApplied && (
        <div className="acts" style={{ marginTop: 16 }}>
          <button className="btn btn-gold small" onClick={() => { actions.applyPlan(); setModal(null); }}>Appliquer le plan B</button>
        </div>
      )}
    </>
  );
}
