"use client";
import { useEffect, useRef } from "react";
import { SCENARIOS, SCOREROWS, TABS, PRAYER, photoOf, stepCount } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon, Chip, PLANE } from "../../lib/icons";
import { Screen, WeatherAlert } from "./Chrome";

function Count({ to }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { el.textContent = to.toLocaleString("fr-FR"); return; }
    const t0 = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e).toLocaleString("fr-FR");
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span ref={ref}>0</span>;
}

function Bar({ pct }) {
  const ref = useRef(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => { if (ref.current) ref.current.style.width = pct + "%"; }));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return <i ref={ref} style={{ width: 0 }} />;
}

const CARDS = [
  ["itin", "list", "Itinéraire jour par jour", "étapes, trajets et affluence compris"],
  ["vols", "plane", "Vols notés & comparés", "4 options, repas halal certifié sur chacune"],
  ["hotels", "bed", "Hôtels justifiés", "3 adresses — pourquoi elles, et à savoir"],
  ["loc", "car", "Location auto & scooter", "Langkawi motorisée, conduite à gauche expliquée"],
  ["restos", "food", "Tables vérifiées", "10 adresses, zéro alcool"],
  ["meteo", "cloud", "Météo qui décide avec vous", "12 jours, plan B jamais automatique"],
  ["budget", "wallet", "Budget en vrai", "Confirmé vs estimé, au centime honnête"],
  ["check", "shield", "Check-list & regrets", "Passeport, eSIM, permis — 3 pièges évités"],
  ["valise", "bag", "Valise intelligente", "Générée pour la mousson et les mosquées"],
];

export default function Dashboard({ setTab, openChat }) {
  const { S, actions } = useOdyssea();
  const o = S.ob;
  const sc = SCENARIOS.find((x) => x.key === S.scenario);
  const steps = stepCount(S.planApplied);

  return (
    <>
      <header className="dash-band">
        <span className="pano" style={{ backgroundImage: `url(${photoOf("lgk")})` }} />
        <span className="veil" />
        <svg className="routes" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-20 236 C 260 202 460 248 720 220 C 960 192 1180 232 1460 198" fill="none" stroke="rgba(252,251,248,.22)" strokeWidth="1" />
          <path d="M-20 272 C 280 236 480 284 740 254 C 990 226 1200 268 1460 232" fill="none" stroke="rgba(252,251,248,.14)" strokeWidth="1" />
          <path className="draw gold" d="M60 284 C 320 190 620 150 900 112 C 1080 86 1240 90 1400 68" fill="none" strokeWidth="1.4"
            style={{ strokeDasharray: 1500, strokeDashoffset: 1500, animation: "draw 3.2s cubic-bezier(.3,0,.2,1) .3s forwards" }} />
        </svg>
        <span className="plane-fly" aria-hidden="true">{PLANE}</span>
        <div className="dash-chips">
          <div><span className="k">Dates</span><span className="v">03 → 14 oct 2026</span></div>
          <div><span className="k">Parcours</span><span className="v">KL · Penang · Langkawi</span></div>
          <div><span className="k">Météo</span><span className="v">31° · averses brèves</span></div>
        </div>
      </header>

      <div className="dash-over">
        <div className="dash-card">
          <div className="lead">
            <div className="kicker steel">Proposition Odyssea · scénario {sc.label}</div>
            <h1>Votre voyage en Malaisie est prêt.</h1>
            <div className="sumchips">
              <Chip dot>12 jours · 11 nuits</Chip>
              <Chip dot>KL → Penang → Langkawi</Chip>
              <Chip dot>{o.trav} voyageurs · {o.group}</Chip>
              <Chip dot>{steps} étapes orchestrées</Chip>
              <Chip tone="green" icon="check">Curation vérifiée</Chip>
            </div>
            <div className="acts" style={{ marginTop: 22 }}>
              <button className="btn btn-navy" onClick={() => setTab("itin")}><Icon name="list" />Voir l&apos;itinéraire jour par jour</button>
              <button className="btn btn-line" onClick={openChat}>Poser une question</button>
            </div>
          </div>
          <div className="scorecard">
            <div className="top">
              <span className="ringwrap">
                <svg viewBox="0 0 74 74" width="74" height="74">
                  <circle cx="37" cy="37" r="32" fill="none" stroke="rgba(252,251,248,.14)" strokeWidth="4" />
                  <circle cx="37" cy="37" r="32" fill="none" stroke="#E9B75C" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray="201" strokeDashoffset={(201 * (1 - 94 / 100)).toFixed(0)} />
                </svg>
                <span className="n">94</span>
              </span>
              <div>
                <b>Score Odyssea</b>
                <div className="sub">Moyenne pondérée de 5 critères mesurés pour vos dates.</div>
              </div>
            </div>
            <div className="scorerows">
              {SCOREROWS.map(([label, val, note]) => (
                <div className="scorerow" key={label}>
                  <div className="l"><span>{label}</span><span>{val}</span></div>
                  <span className="tr"><Bar pct={val} /></span>
                  <div className="note">{note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Screen>
        <WeatherAlert />

        <div style={{ marginTop: 34, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontWeight: 200, fontSize: "clamp(24px,3vw,34px)", letterSpacing: "-.03em" }}>Trois façons de vivre ce voyage.</h2>
            <p style={{ marginTop: 10, fontSize: 14, color: "var(--muted)" }}>Mêmes dates, même curation. Nous conseillons « Équilibre », vous restez libre.</p>
          </div>
          <span className="note">Prix pour {o.trav} voyageurs, vols et hébergement compris (démo)</span>
        </div>

        <div className="scen-grid">
          {SCENARIOS.map((s) => (
            <button key={s.key} className={"scen" + (S.scenario === s.key ? " sel" : "") + (s.key === "plus" ? " navy" : "")}
              aria-pressed={S.scenario === s.key} onClick={() => actions.pickScenario(s.key)}>
              {s.reco && <span className="badge-reco">RECOMMANDATION ODYSSEA</span>}
              <span className="toprow"><h3>{s.label}</h3><span className="sc">Score {s.score}</span></span>
              <p className="tagline">{s.tagline}</p>
              <div className="price"><Count to={s.price} /> €</div>
              <div className="pp">soit ≈ {Math.round(s.price / o.trav).toLocaleString("fr-FR")} € par personne</div>
              <ul>{s.lines.map((l) => <li key={l}>{l}</li>)}</ul>
              <span className="cta">{S.scenario === s.key ? "Scénario retenu ✓" : "Choisir " + s.label}</span>
            </button>
          ))}
        </div>

        <div className="cardnav">
          {CARDS.map(([k, icon, title, desc]) => (
            <button key={k} className="card lift" onClick={() => setTab(k)}>
              <b><Icon name={icon} />{title}</b>
              <p>{k === "itin" ? `${steps} ${desc}` : desc}</p>
            </button>
          ))}
        </div>

        <div className="grid2" style={{ marginTop: 26 }}>
          <div className="card">
            <div className="kicker gold">Pourquoi ce voyage vous ressemble</div>
            <ul className="oklist" style={{ marginTop: 14 }}>
              {["Octobre : inter-mousson douce, mer à 29° à Langkawi",
                "Trois escales, deux vols internes courts : rythme « équilibré » respecté",
                "Kampung Baru, Line Clear, Siti Fatimah : les tables de légende du pays",
                "Prières intégrées à chaque journée, sans y penser"].map((w) => (
                <li key={w}><Icon name="check" />{w}</li>
              ))}
            </ul>
            <hr className="rule" />
            <div className="kicker">À garder en tête</div>
            <ul className="oklist warn" style={{ marginTop: 10 }}>
              {["Averses brèves possibles chaque après-midi (plan B prêt)",
                "Jour 12 : voiture + 3 vols enchaînés — marge à surveiller"].map((w) => (
                <li key={w}><Icon name="alert" />{w}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="kicker steel">Trip DNA — ajustable à tout moment</div>
            <div className="dna-row">
              <span>Rythme</span>
              <div className="dna-seg">
                {["Tranquille", "Équilibré", "Intense"].map((v, i) => (
                  <button key={v} className={S.dna.pace === i ? "on" : ""} onClick={() => actions.setDna("pace", i)}>{v}</button>
                ))}
              </div>
            </div>
            <div className="dna-row">
              <span>Hébergement</span>
              <div className="dna-seg">
                {["Simple", "Confort", "Premium"].map((v, i) => (
                  <button key={v} className={S.dna.stay === i ? "on" : ""} onClick={() => actions.setDna("stay", i)}>{v}</button>
                ))}
              </div>
            </div>
            <div className="dna-row" style={{ alignItems: "flex-start" }}>
              <span style={{ paddingTop: 6 }}>Envies</span>
              <div className="intwrap">
                {[["halal", "Gastronomie"], ["nature", "Nature"], ["plage", "Plage"], ["culture", "Culture & mosquées"], ["photo", "Photo"], ["bienetre", "Bien-être"]].map(([k, label]) => (
                  <button key={k} className={"chip" + (S.dna.ints.includes(k) ? " on" : "")}
                    aria-pressed={S.dna.ints.includes(k)} onClick={() => actions.toggleInterest(k)}>{label}</button>
                ))}
              </div>
            </div>
            <hr className="rule" />
            <div className="kicker gold">Prières aujourd&apos;hui · Kuala Lumpur</div>
            <div className="prayer">
              {Object.entries(PRAYER.kl).map(([k, v]) => <div key={k}>{k}<b>{v}</b></div>)}
            </div>
            <p className="note" style={{ marginTop: 9 }}>Horaires estimés — chaque journée affiche ceux de sa ville.</p>
          </div>
        </div>
      </Screen>
    </>
  );
}
