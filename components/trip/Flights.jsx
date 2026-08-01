"use client";
import { FLIGHTS } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon, Chip } from "../../lib/icons";
import { Screen } from "./Chrome";
import Reveal from "../Reveal";

const durMin = (f) => { const m = f.dur.match(/(\d+)\s*h\s*(\d*)/); return m ? +m[1] * 60 + (+m[2] || 0) : 999; };

function ScoreModal({ f }) {
  return (
    <>
      <div className="kicker steel">{f.al} · Paris CDG → Kuala Lumpur</div>
      <h3 style={{ marginTop: 8 }}>Score {f.score} — le détail</h3>
      <p className="note" style={{ margin: "8px 0 6px" }}>Pondéré selon votre profil (confort + horaires + fiabilité avant le prix pur).</p>
      {f.dims.map(([label, v]) => (
        <div className="scorebar" key={label}>
          <div className="l"><span>{label}</span><b>{v}</b></div>
          <div className="tr"><i style={{ width: v + "%" }} /></div>
        </div>
      ))}
      <p className="note" style={{ marginTop: 14 }}>{f.tag} — une escale unique et une arrivée en journée pèsent lourd dans ce score.</p>
    </>
  );
}

export default function Flights() {
  const { S, patch, setModal } = useOdyssea();
  const sorted = [...FLIGHTS].sort((a, b) =>
    S.flightSort === "cheap" ? a.price - b.price : S.flightSort === "fast" ? durMin(a) - durMin(b) : b.score - a.score
  );

  return (
    <Screen kicker="Vols" title="Quatre options, une recommandation."
      intro="Chaque vol est noté sur six critères pondérés selon votre profil. Le prix compte, il ne décide pas seul.">
      <div className="sortrow">
        <span className="note" style={{ marginRight: 6 }}>Trier :</span>
        {[["best", "Meilleur équilibre"], ["cheap", "Moins cher"], ["fast", "Plus rapide"]].map(([k, label]) => (
          <button key={k} className={"chip" + (S.flightSort === k ? " on" : "")} onClick={() => patch(() => ({ flightSort: k }))}>{label}</button>
        ))}
      </div>

      {sorted.map((f, i) => (
        <Reveal key={f.id} className="card lift flight" delay={i * 60}>
          <div className="logo" style={{ background: f.col }}>{f.code}</div>
          <div>
            <div className="alrow">
              {f.al}
              {i === 0 && <Chip tone="gold" icon="spark">{S.flightSort === "cheap" ? "Le moins cher" : S.flightSort === "fast" ? "Le plus rapide" : "Notre recommandation"}</Chip>}
            </div>
            <div className="times">
              <span className="tt">{f.dep}</span>
              <span className="fline"><span>{f.dur} · {f.stops}</span></span>
              <span className="tt">{f.arr}{f.plus ? <i>+{f.plus}</i> : null}</span>
            </div>
            <div className="fmeta">
              <Chip icon="check" tone="green">Escale unique</Chip>
              <Chip icon="bag">2 × 23 kg inclus</Chip>
              <Chip icon="clock">{f.stops}</Chip>
            </div>
          </div>
          <div className="pcol">
            <div>
              <div className="p">{f.price} €</div>
              <div className="pp">par personne · A/R</div>
            </div>
            <span className="fscore"><i style={{ width: f.score + "%" }} /></span>
            <button className="scorebtn" onClick={() => setModal(<ScoreModal f={f} />)}>Score <b>{f.score}</b></button>
          </div>
        </Reveal>
      ))}
      <p className="note" style={{ marginTop: 14 }}>
        Tarifs de démonstration. Dans la version connectée, ils sont rafraîchis à chaque ouverture et la réservation se fait chez la compagnie.
      </p>
    </Screen>
  );
}
