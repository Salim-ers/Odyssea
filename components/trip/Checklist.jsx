"use client";
import { REGRETS, CHECKGROUPS } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon } from "../../lib/icons";
import { Screen } from "./Chrome";
import Ring from "../Ring";

const ALTS = {
  r1: ["Prendre le vol LGK → KUL de 15:40 (plus de marge, arrivée Paris identique)", "Faire la restitution de la voiture la veille au soir et finir en Grab"],
  r2: ["Remplacer la Blue Mansion du jour 6 par une visite le jour 7 au matin", "Louer des vélos pour la balade UNESCO (2 h au lieu de 3 h à pied)"],
  r3: ["Réserver le créneau SkyCab de 09:00 en ligne (coupe-file, +6 €)", "Basculer SkyCab au jour 11 au matin, en gardant la plage au jour 9"],
};

export default function Checklist() {
  const { S, actions, readiness, setModal } = useOdyssea();
  const rd = readiness;

  const seeAlt = (r) => setModal(
    <>
      <h3>{r.tt}</h3>
      <p className="note">{r.p}</p>
      <div className="kicker" style={{ margin: "16px 0 8px" }}>AUTRES FAÇONS DE RÉGLER ÇA</div>
      <ul className="oklist">{ALTS[r.id].map((a) => <li key={a}><Icon name="spark" />{a}</li>)}</ul>
      <div className="acts" style={{ marginTop: 16 }}>
        <button className="btn btn-gold small" onClick={() => { actions.fixRegret(r.id); setModal(null); }}>Appliquer la recommandation</button>
      </div>
    </>
  );

  return (
    <Screen kicker="Check-list" title={`Prêt à ${rd.pct} %`}
      intro="Passeport, eSIM, permis, pièges d'itinéraire : tout ce qui peut gâcher un voyage, attrapé avant le départ.">
      <div className="card readyhead">
        <Ring pct={rd.pct} big />
        <div>
          <div className="big-t">{rd.open ? `${rd.open} points à régler` : "Tout est prêt"}</div>
          <div className="note" style={{ marginTop: 4 }}>Le score monte à chaque action — visez le 100 % la veille du départ.</div>
        </div>
      </div>

      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="kicker" style={{ marginBottom: 6 }}>DOCUMENTS &amp; FORMALITÉS</div>
          {[["ok", "Passeport valide", "Expire en 2031 — largement les 6 mois exigés après le retour."],
            ["ok", "Pas de visa nécessaire", "Exemption 90 jours pour les Français · billet retour à présenter."],
            ["warn", "Billets & vouchers hors-ligne", "Téléchargez tout avant le départ — le wifi de Doha est capricieux."]].map(([tone, title, sub]) => (
            <div className={"chkrow " + tone} key={title}>
              <Icon name={tone === "ok" ? "check" : "info"} />
              <div><b>{title}</b><div className="sub">{sub}</div></div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="kicker" style={{ marginBottom: 6 }}>ACTIONS RAPIDES</div>
          <div className={"chkrow " + (S.esim ? "ok" : "warn")}>
            <Icon name={S.esim ? "check" : "alert"} />
            <div><b>{S.esim ? "eSIM 15 Go prête" : "eSIM non préparée"}</b><div className="sub">Activée avant le départ = connecté en sortant de l&apos;avion (≈ 12 €).</div></div>
            {!S.esim && <button className="btn btn-line small" onClick={actions.fixEsim}>Préparer</button>}
          </div>
          <div className={"chkrow " + (S.permis ? "ok" : "warn")}>
            <Icon name={S.permis ? "check" : "alert"} />
            <div><b>{S.permis ? "Permis international noté" : "Permis international à demander"}</b><div className="sub">Gratuit en préfecture, ~3 semaines de délai.</div></div>
            {!S.permis && <button className="btn btn-line small" onClick={actions.fixPermis}>Ajouter</button>}
          </div>
          <div className={"chkrow " + (S.planApplied ? "ok" : "warn")}>
            <Icon name={S.planApplied ? "check" : "rain"} />
            <div><b>{S.planApplied ? "Plan météo du jour 4 appliqué" : "Averses du jour 4 non traitées"}</b><div className="sub">Un clic, réversible.</div></div>
            {!S.planApplied && <button className="btn btn-line small" onClick={actions.applyPlan}>Appliquer</button>}
          </div>
        </div>
      </div>

      <div className="kicker" style={{ margin: "26px 0 12px" }}>DÉTECTEUR DE REGRETS — 3 PIÈGES REPÉRÉS DANS VOTRE PLAN</div>
      {REGRETS.map((r) => {
        const st = S.regrets[r.id];
        return (
          <div className={"card regret" + (st ? " done" : "")} key={r.id}>
            <span className="imp">{st ? (st === "fixed" ? "Corrigé ✓" : "Ignoré — assumé") : r.imp}</span>
            <b>{r.tt}</b>
            <p>{r.p}</p>
            <div className="rec"><b>RECOMMANDATION</b> — {r.rec}</div>
            {!st && (
              <div className="acts">
                <button className="btn btn-gold small" onClick={() => actions.fixRegret(r.id)}>Corriger en un clic</button>
                <button className="btn btn-line small" onClick={() => seeAlt(r)}>Autres options</button>
                <button className="btn btn-quiet small" onClick={() => actions.ignoreRegret(r.id)}>Ignorer</button>
              </div>
            )}
          </div>
        );
      })}

      <div className="kicker" style={{ margin: "26px 0 12px" }}>LA LISTE COMPLÈTE</div>
      <div className="grid2">
        {CHECKGROUPS.map(([title, items], gi) => (
          <div className="card" key={title}>
            <div className="kicker" style={{ marginBottom: 4 }}>{title.toUpperCase()}</div>
            {items.map((item, ii) => {
              const k = gi + "-" + ii;
              return (
                <label className="ckbox" key={k}>
                  <input type="checkbox" checked={!!S.checks[k]} onChange={() => actions.toggleCheck(k)} />
                  <span>{item}</span>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </Screen>
  );
}
