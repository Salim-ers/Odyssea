"use client";
import { LOCS, LOCWARN } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon } from "../../lib/icons";
import { Screen } from "./Chrome";

export default function Rentals({ setTab }) {
  const { S, actions } = useOdyssea();
  return (
    <Screen kicker="Location" title="Langkawi se mérite en roulant."
      intro="L'île est grande, les taxis rares après 21 h. Voici les trois options honnêtes — et les pièges qui coûtent cher.">
      <div className="locgrid">
        {LOCS.map((l) => (
          <div className={"card loc-card" + (l.best ? " best" : "")} key={l.id}>
            {l.best && <span className="badge-reco">RECOMMANDATION ODYSSEA</span>}
            <span className="lic"><Icon name={l.icn} /></span>
            <h3>{l.name}</h3>
            <div className="p">{l.p}</div>
            <ul>{l.pts.map((p) => <li key={p}><Icon name="check" />{p}</li>)}</ul>
            <div className="reco note">{l.reco}</div>
          </div>
        ))}
      </div>

      <div className="grid2">
        <div className="card">
          <div className="kicker gold" style={{ marginBottom: 12 }}>LES PIÈGES, DITS FRANCHEMENT</div>
          <div className="warnlist">
            {LOCWARN.map(([icon, title, text]) => (
              <div className="w" key={title}><Icon name={icon} /><div><b>{title}</b> — {text}</div></div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="kicker" style={{ marginBottom: 12 }}>DÉJÀ DANS VOTRE VOYAGE</div>
          <ul className="oklist">
            <li><Icon name="check" />Voiture réservée du jour 9 au jour 12 (comprise dans le budget)</li>
            <li><Icon name="check" />Transferts aéroport ↔ hôtel inclus les jours 8 et 12</li>
            <li><Icon name="check" />Aucun véhicule à KL ni Penang : LRT, marche et Grab suffisent</li>
          </ul>
          <div className="chkrow" style={{ marginTop: 14 }} >
            <Icon name={S.permis ? "check" : "alert"} />
            <div>
              <b>{S.permis ? "Permis international noté" : "Permis international à demander"}</b>
              <div className="sub">Gratuit en préfecture, ~3 semaines de délai.</div>
            </div>
            {!S.permis && <button className="btn btn-line small" onClick={actions.fixPermis}>Ajouter</button>}
          </div>
          <div className="acts">
            <button className="btn btn-line small" onClick={() => setTab("budget")}>Voir la ligne budget</button>
          </div>
        </div>
      </div>
    </Screen>
  );
}
