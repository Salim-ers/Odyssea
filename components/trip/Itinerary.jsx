"use client";
import { DAYS, CITY, WX, PRAYER, TRV, TRVLBL, dayItems, photoOf } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon, Chip } from "../../lib/icons";
import { Screen, ComparePlans } from "./Chrome";
import Reveal from "../Reveal";

function Meta({ s }) {
  const chips = [];
  if (s.dur) chips.push(<Chip key="dur" icon="clock">{s.dur}</Chip>);
  if (s.cost) chips.push(<Chip key="cost" icon="wallet">{s.cost}</Chip>);
  if (s.crowd) chips.push(<Chip key="crowd" icon="users">{{ low: "Peu de monde", mod: "Affluence modérée", busy: "Beaucoup de monde" }[s.crowd]}</Chip>);
  if (s.resa) chips.push(<Chip key="resa" tone="gold" icon="info">{s.resa}</Chip>);
  if (s.halal) chips.push(<Chip key="halal" tone="green" icon="check">Halal</Chip>);
  if (s.vegan) chips.push(<Chip key="vegan" tone="green" icon="leaf">Options véganes</Chip>);
  if (s.tag === "mosquee") chips.push(<Chip key="m" tone="gold" icon="mosque">Prière</Chip>);
  if (s.tag === "photo") chips.push(<Chip key="p" icon="cam">Spot photo</Chip>);
  if (s.tag === "jetlag") chips.push(<Chip key="j" icon="moon">Anti-décalage</Chip>);
  if (s.tag === "sunset") chips.push(<Chip key="s" tone="gold" icon="sun">Coucher de soleil</Chip>);
  if (s.out) chips.push(<Chip key="o" icon="sun">En extérieur</Chip>);
  if (!chips.length) return null;
  return <div className="tl-meta">{chips}</div>;
}

export default function Itinerary({ day, setDay, openChat }) {
  const { S, actions, setModal } = useOdyssea();
  const d = DAYS[day];
  const items = dayItems(d, S.planApplied);
  const wx = WX[day];
  const pr = PRAYER[d.c];

  return (
    <Screen kicker="Itinéraire" title="12 jours, heure par heure."
      intro="Chaque étape est justifiée. Échangez, supprimez, demandez autre chose à l'assistant — c'est votre voyage.">
      <div className="daytabs" role="tablist">
        {DAYS.map((x, i) => (
          <button key={x.n} className={"daytab" + (i === day ? " on" : "")} role="tab" aria-selected={i === day} onClick={() => setDay(i)}>
            <span className="d">J{x.n} · {x.d}</span>
            <span className="c">{x.t}</span>
          </button>
        ))}
      </div>

      <div className="day-band">
        <span className="pano" style={{ backgroundImage: `url(${photoOf(d.c)})` }} />
        <span className="veil" />
        <div className="db-in">
          <span className="kicker" style={{ color: "var(--gold-pale)" }}>Jour {d.n} sur 12 · {d.d}</span>
          <h2>{d.t}</h2>
          <span className="db-city"><Icon name="compass" />{CITY[d.c]}</span>
        </div>
      </div>

      <div className="dayhead">
        <div>
          <span className="mono">
            {CITY[d.c]} · {d.d}
            {wx && wx.t !== "—" && ` · ${wx.t.replace("|", " / ")} · pluie ${wx.r}`}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {day === 3 && (S.planApplied ? (
            <>
              <span className="chip green"><Icon name="check" />Plan B appliqué</span>
              <button className="btn btn-line small" onClick={actions.revertPlan}>Rétablir l&apos;initial</button>
            </>
          ) : (
            <>
              <span className="chip gold"><Icon name="rain" />Averses 14 h – 17 h</span>
              <button className="btn btn-gold small" onClick={() => setModal(<ComparePlans />)}>Voir le plan B</button>
            </>
          ))}
          {pr && (
            <span className="chip"><Icon name="mosque" />
              Prières : {pr.Fajr} · {pr.Dhuhr} · {pr.Asr} · {pr.Maghrib} · {pr.Isha}
            </span>
          )}
        </div>
      </div>

      <div className="tl">
        {items.map((s, i) => (
          <div key={s.id || s.t + i}>
            {s.travel && (
              <div className="travelrow">
                <Icon name={TRV[s.travel.by] || "walk"} />≈ {s.travel.m} min {TRVLBL[s.travel.by] || ""}
              </div>
            )}
            <Reveal className={"tl-item k-" + (s.k || "sight")} delay={Math.min(i * 45, 320)}>
              <div className="tl-top"><span className="t">{s.t}</span><b>{s.f}</b></div>
              {s.s && <div className="tl-sub">{s.s}</div>}
              <Meta s={s} />
              {s.why && <div className="tl-why"><b>Pourquoi c&apos;est là</b>{s.why}</div>}
              {s.pb && <div className="tl-pb"><b>Plan B si pluie — </b>{s.pb}</div>}
            </Reveal>
          </div>
        ))}
      </div>

      {day === 3 && !S.planApplied && (
        <div className="alert" style={{ marginTop: 8 }}>
          <span className="ic"><Icon name="rain" /></span>
          <div style={{ flex: 1 }}>
            <b>Cette journée a un plan B prêt</b>
            <p>Mêmes lieux, ordre différent : les jardins passent au matin, le musée couvre l&apos;averse.</p>
            <div className="acts">
              <button className="btn btn-gold small" onClick={actions.applyPlan}>Appliquer</button>
              <button className="btn btn-line small" onClick={() => setModal(<ComparePlans />)}>Comparer</button>
            </div>
          </div>
        </div>
      )}

      <div className="card soft askrow">
        <Icon name="spark" />
        <span>Une envie différente ce jour-là ? L&apos;assistant connaît chaque créneau.</span>
        <button className="btn btn-navy small" onClick={() => openChat(`Pouvez-vous me proposer une alternative pour le jour ${day + 1} ?`)}>
          Demander une alternative
        </button>
      </div>
    </Screen>
  );
}
