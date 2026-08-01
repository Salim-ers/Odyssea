"use client";
import { PACK } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon } from "../../lib/icons";
import { Screen } from "./Chrome";

export default function Packing() {
  const { S, actions } = useOdyssea();
  const total = PACK.reduce((a, s) => a + s[1].length, 0);
  const done = Object.values(S.packed).filter(Boolean).length;
  const pct = Math.round((done / total) * 100);

  return (
    <Screen kicker="Valise" title="Générée pour ce voyage précis."
      intro="Mousson d'octobre, canopée à 276 m, 5 km à pied dans George Town et une mangrove au crépuscule : chaque objet a une raison d'être, elle est écrite à côté.">
      <div className="card vprog">
        <span className="mono">{done} / {total}</span>
        <div className="track"><i style={{ width: pct + "%" }} /></div>
        <span className={"chip" + (pct === 100 ? " green" : " gold")}>{pct === 100 ? "Valise bouclée ✓" : pct + " %"}</span>
      </div>

      <div className="vgrid">
        {PACK.map(([section, items], si) => (
          <div className="card" key={section}>
            <div className="kicker" style={{ marginBottom: 6 }}>{section.toUpperCase()}</div>
            {items.map(([label, why], ii) => {
              const k = si + "-" + ii;
              return (
                <label className={"v-item" + (S.packed[k] ? " pk" : "")} key={k}>
                  <input type="checkbox" checked={!!S.packed[k]} onChange={() => actions.togglePack(k)} />
                  <span className="lbl">{label}</span>
                  <span className="why">{why}</span>
                </label>
              );
            })}
          </div>
        ))}
        <div className="card" style={{ borderColor: "rgba(240,180,60,.4)" }}>
          <div className="kicker gold" style={{ marginBottom: 8 }}>AJOUTS AUTOMATIQUES</div>
          <ul className="oklist">
            <li><Icon name="check" />Veste fine — climatisation puissante dans les musées et les trains</li>
            <li><Icon name="check" />K-way compact — 70 % d&apos;averses annoncées le jour 4</li>
            <li><Icon name="check" />Poche étanche — kayak dans la géoforêt de Kilim au jour 10</li>
          </ul>
          <p className="note" style={{ marginTop: 10 }}>La liste se recompose si l&apos;itinéraire ou la météo change.</p>
        </div>
      </div>
    </Screen>
  );
}
