"use client";
import { RESTOS, RFILTERS, RTAGS, CITY, photoOf } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon, Chip } from "../../lib/icons";
import { Screen } from "./Chrome";
import Reveal from "../Reveal";

export default function Restaurants({ openChat }) {
  const { S, patch } = useOdyssea();
  const list = RESTOS.filter((r) => S.restoFilter === "tous" || r.tags.includes(S.restoFilter));

  return (
    <Screen kicker="Restaurants" title="Dix adresses, zéro compromis."
      intro="Toutes recoupées avec les avis locaux et les horaires réels : du hawker à 4 € à la table du dernier soir.">
      <div className="filterrow">
        {RFILTERS.map(([k, label]) => (
          <button key={k} className={"chip" + (S.restoFilter === k ? " on" : "")} onClick={() => patch(() => ({ restoFilter: k }))}>{label}</button>
        ))}
      </div>
      <div className="photogrid">
        {list.map((r, i) => (
          <Reveal as="article" key={r.id} className="pcard sm" delay={i * 60}>
            <div className="ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoOf(r.city)} alt="" loading="lazy" />
              <span className="pill-tl">{CITY[r.city]}</span>
              <span className="pill-tr">
                {r.tags.includes("vegan") ? <><Icon name="leaf" />Végétal</> : <><Icon name="check" />Vérifié</>}
              </span>
            </div>
            <div className="body">
              <h3>{r.name}</h3>
              <div className="type">{r.cui} · {r.p} par personne</div>
              <div className="tags">{r.tags.slice(0, 3).map((t) => <Chip key={t}>{RTAGS[t] || t}</Chip>)}</div>
              <div className="whybox"><div className="k">Pourquoi cette adresse</div><p>{r.why}</p></div>
              <div className="pricerow">
                <div className="pn">Sans réservation</div>
                <button className="btn btn-line small" onClick={() => openChat(`Parlez-moi de ${r.name} — que commander ?`)}>Que commander&nbsp;?</button>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      {!list.length && <div className="card soft" style={{ textAlign: "center", color: "var(--muted)" }}>Aucune adresse pour ce filtre — essayez-en un autre.</div>}
      <p className="photo-note">« Vérifié » = adresse recoupée sur trois sources, horaires et fourchette de prix confirmés. Vos restrictions alimentaires filtrent automatiquement cette liste.</p>
    </Screen>
  );
}
