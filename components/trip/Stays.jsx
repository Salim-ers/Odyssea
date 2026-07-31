"use client";
import { AREAS, HOTELS, CITY, photoOf } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon, Chip } from "../../lib/icons";
import { Screen } from "./Chrome";
import Reveal from "../Reveal";

function Detail({ h }) {
  return (
    <>
      <h3>{h.name}</h3>
      <p className="note">{h.area} · {CITY[h.city]}</p>
      <div className="kicker" style={{ margin: "16px 0 8px", color: "var(--green)" }}>POURQUOI LUI</div>
      <ul className="oklist">{h.good.map((g) => <li key={g}><Icon name="check" />{g}</li>)}</ul>
      <div className="kicker" style={{ margin: "16px 0 8px", color: "var(--gold-deep)" }}>À SAVOIR AVANT DE RÉSERVER</div>
      <ul className="oklist warn">{h.warn.map((w) => <li key={w}><Icon name="alert" />{w}</li>)}</ul>
    </>
  );
}

export default function Stays() {
  const { setModal } = useOdyssea();
  return (
    <Screen kicker="Hébergements" title="Où dormir, et pourquoi là."
      intro="Chaque adresse est choisie en fonction de vos activités et de votre budget — pas de sa commission.">
      <div className="kicker" style={{ marginBottom: 12 }}>Où dormir à Kuala Lumpur — trois quartiers comparés</div>
      <div className="areagrid">
        {AREAS.map((a) => (
          <div className={"card area" + (a.top ? " lift" : "")} key={a.name}>
            <span className="rank">{a.top ? "NOTRE CHOIX · " : ""}{a.tag}</span>
            <h3>{a.name}</h3>
            <dl>{a.rows.map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>
        ))}
      </div>

      <div className="photogrid" style={{ marginTop: 30 }}>
        {HOTELS.map((t, i) => (
          <Reveal as="article" key={t.id} className={"pcard" + (t.id === "h1" ? " best" : "")} delay={i * 80}>
            <div className="ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoOf(t.city)} alt="" loading="lazy" />
              <span className="pill-tl">{CITY[t.city]} · {t.area}</span>
              <span className="pill-tr">★ {t.rating}</span>
            </div>
            <div className="body">
              <h3>{t.name}</h3>
              <div className="type">{t.dist} · {t.nights} nuits · {t.rev} avis</div>
              <div className="tags">{t.why.slice(1).map((w) => <Chip key={w}>{w.length > 34 ? w.slice(0, 32) + "…" : w}</Chip>)}</div>
              <div className="whybox">
                <div className="k">Pourquoi Odyssea le recommande</div>
                <p>{t.why[0]}</p>
              </div>
              <div className="warnbox">
                <div className="k">À savoir</div>
                <ul>{t.warn.map((w) => <li key={w}><Icon name="alert" />{w}</li>)}</ul>
              </div>
              <div className="pricerow">
                <div>
                  <div className="p">{t.price} €</div>
                  <div className="pn">par nuit · {t.nights} nuits = {t.price * t.nights} €</div>
                </div>
                <button className="btn btn-gold small" onClick={() => setModal(<Detail h={t} />)}>Le détail</button>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="photo-note">Photos d&apos;ambiance — dans la version connectée, elles viennent de la fiche établissement.</p>
    </Screen>
  );
}
