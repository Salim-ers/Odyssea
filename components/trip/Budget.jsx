"use client";
import { useEffect, useRef } from "react";
import { BUDGET, BTOTAL, BPLAN, SCENARIOS } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon, Chip } from "../../lib/icons";
import { Screen } from "./Chrome";

function Fill({ pct, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => { if (ref.current) ref.current.style.width = pct + "%"; }));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return <span className="b-fill" ref={ref} style={{ width: 0, ...style }} />;
}

export default function Budget({ openChat }) {
  const { S } = useOdyssea();
  const sc = SCENARIOS.find((x) => x.key === S.scenario);
  return (
    <Screen kicker="Budget" title="Le vrai coût, pas le prix d'appel."
      intro="Chaque ligne est « confirmée » (prix figé) ou « estimée » (fourchette honnête). Le total planifié reste sous votre enveloppe.">
      <div className="grid2">
        <div className="card">
          {BUDGET.map((b) => (
            <div className="b-row" key={b.l}>
              <div className="b-line">
                <span className="l">
                  {b.l}
                  {b.conf ? <Chip tone="green" icon="check">Confirmé</Chip> : <Chip tone="gold" icon="info">Estimé</Chip>}
                </span>
                <span className="v">{b.amt.toLocaleString("fr-FR")} €</span>
              </div>
              <div className="b-track"><Fill pct={Math.round((b.amt / 1340) * 100)} style={{ background: b.col }} /></div>
            </div>
          ))}
          <p className="note">Aucune ligne « bar » ni « sorties nocturnes » : le poste classique disparaît, votre budget respire.</p>
        </div>

        <div className="card navy-card b-total">
          <div className="t-label">TOTAL PLANIFIÉ</div>
          <div className="t-num">{BPLAN.toLocaleString("fr-FR")} €</div>
          <div className="t-label">SUR UNE ENVELOPPE DE {BTOTAL.toLocaleString("fr-FR")} €</div>
          <div className="bbar"><Fill pct={Math.round((BPLAN / BTOTAL) * 100)} /></div>
          <div className="pp">
            soit ≈ {Math.round(BPLAN / S.ob.trav).toLocaleString("fr-FR")} € par personne · marge de {BTOTAL - BPLAN} € pour les envies du moment
          </div>
          {S.scenario !== "eq" && <p className="note" style={{ marginTop: 10 }}>Scénario « {sc.label} » retenu : total indicatif {sc.price.toLocaleString("fr-FR")} €.</p>}
          <div className="acts" style={{ justifyContent: "center" }}>
            <button className="btn btn-gold small" onClick={() => openChat("Où puis-je économiser 200 € sans abîmer le voyage ?")}>
              <Icon name="spark" />Où économiser 200 € ?
            </button>
          </div>
        </div>
      </div>
    </Screen>
  );
}
