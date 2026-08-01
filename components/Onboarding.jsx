"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OB_STEPS, OB_HINTS, STYLE_CARDS } from "../lib/onboarding";
import { useOdyssea, frDate } from "../lib/store";
import { Icon } from "../lib/icons";
import Wordmark from "./Wordmark";
import Generating from "./Generating";

export default function Onboarding() {
  const { ob: o, patchOb, toast } = useOdyssea();
  const [gen, setGen] = useState(null);
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const progress = o.step / (OB_STEPS - 1);

  /* La direction du dernier saut fait entrer la question du bon côté : on
     avance, elle vient de la droite ; on revient, elle vient de la gauche.
     `flying` dure le temps du vol et sert à incliner l'avion. */
  const [dir, setDir] = useState(1);
  const [flying, setFlying] = useState(false);
  const flightTimer = useRef(null);

  const jump = (next) => {
    const target = Math.max(0, Math.min(OB_STEPS - 1, next));
    if (target === o.step) return;
    setDir(target > o.step ? 1 : -1);
    setFlying(true);
    clearTimeout(flightTimer.current);
    flightTimer.current = setTimeout(() => setFlying(false), 900);
    patchOb(() => ({ step: target }));
  };
  const go = (d) => jump(o.step + d);
  useEffect(() => () => clearTimeout(flightTimer.current), []);

  const pickStyle = (label) => {
    if (o.stylePri === label) return patchOb((ob) => ({ stylePri: ob.styleSec, styleSec: null }));
    if (o.styleSec === label) return patchOb(() => ({ styleSec: null }));
    if (!o.stylePri) return patchOb(() => ({ stylePri: label }));
    patchOb(() => ({ styleSec: label }));
  };
  const toggleList = (key, v) =>
    patchOb((ob) => ({ [key]: ob[key].includes(v) ? ob[key].filter((x) => x !== v) : [...ob[key], v] }));

  /* Solo et couple valent 1 et 2 : inutile de faire compter l'utilisateur. */
  const FIXED = { Solo: 1, Couple: 2 };
  const asksCount = !FIXED[o.group];
  const setGroup = (g) => patchOb((ob) => {
    if (FIXED[g]) return { group: g, adults: FIXED[g], kids: 0, trav: FIXED[g] };
    const adults = Math.max(g === "Amis" ? 2 : 1, ob.adults || 2);
    const kids = ob.kids || 0;
    return { group: g, adults, kids, trav: adults + kids };
  });
  const setCount = (key, v) => patchOb((ob) => {
    const adults = key === "adults" ? v : ob.adults;
    const kids = key === "kids" ? v : ob.kids;
    return { adults, kids, trav: adults + kids };
  });

  /* On crée le voyage côté serveur, puis l'écran de génération enchaîne les
     phases. Le brief part tel qu'il a été composé, sans transformation. */
  const compose = async () => {
    if (sending) return;
    if (!o.dest.trim()) { toast("Indiquez d'abord une destination."); return patchOb(() => ({ step: 0 })); }
    setSending(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(o),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error || "Impossible de lancer la composition."); return; }
      setGen({ id: data.id, totalDays: data.totalDays });
    } catch (e) {
      toast("Connexion impossible : " + e.message);
    } finally {
      setSending(false);
    }
  };

  if (gen)
    return (
      <Generating
        tripId={gen.id}
        totalDays={gen.totalDays}
        onDone={() => router.push(`/voyage/${gen.id}`)}
        onError={(m) => { toast(m); setGen(null); }}
      />
    );

  const steps = [
    <div key="0">
      <h2 className="ob-q">Où avez-vous envie d&apos;aller&nbsp;?</h2>
      <p className="ob-sub">Une ville, un pays, ou simplement une envie — on part de là.</p>
      <input className="ob-input" style={{ marginTop: 26 }} value={o.dest} aria-label="Destination"
        placeholder="Malaisie, Lisbonne, du soleil…" onChange={(e) => patchOb(() => ({ dest: e.target.value }))} />
      <div className="chiprow">
        {["Malaisie", "Japon", "Portugal", "Maroc", "Indonésie"].map((d) => (
          <button key={d} className={"d-chip" + (o.dest === d ? " on" : "")} onClick={() => patchOb(() => ({ dest: d }))}>{d}</button>
        ))}
      </div>
    </div>,
    <div key="1">
      <h2 className="ob-q">Quelles dates&nbsp;?</h2>
      <p className="ob-sub">Odyssea vérifie la saison et vous prévient si elle joue contre vous.</p>
      <div className="dates2">
        <div>
          <label htmlFor="ob-dep">Départ</label>
          <input id="ob-dep" type="date" className="ob-input" value={o.dep} onChange={(e) => patchOb(() => ({ dep: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="ob-ret">Retour</label>
          <input id="ob-ret" type="date" className="ob-input" value={o.ret} onChange={(e) => patchOb(() => ({ ret: e.target.value }))} />
        </div>
      </div>
      <p className="ob-sub" style={{ marginTop: 18 }}>Début octobre en Malaisie : inter-mousson douce, mer à 29° — bon choix.</p>
    </div>,
    <div key="2">
      <h2 className="ob-q">Qui partagera ce voyage avec vous&nbsp;?</h2>
      <p className="ob-sub">Cela change le rythme, les hébergements et les adresses proposées.</p>
      <div className="chiprow" style={{ justifyContent: "center", marginTop: 26 }}>
        {["Solo", "Couple", "Famille", "Amis", "Pro"].map((g) => (
          <button key={g} className={"d-chip" + (o.group === g ? " on" : "")} onClick={() => setGroup(g)}>{g}</button>
        ))}
      </div>
      {/* Solo ou couple : le nombre est déjà connu, on ne le redemande pas. */}
      {asksCount ? (
        <div className="ob-counts">
          {[["adults", "Adultes", "18 ans et plus", o.group === "Amis" ? 2 : 1, 12],
            ["kids", "Enfants", "moins de 18 ans", 0, 8]].map(([key, label, sub, min, max]) => (
            <div className="ob-count" key={key}>
              <div><b>{label}</b><span>{sub}</span></div>
              <div className="ob-count-ctl">
                <button aria-label={`Retirer — ${label}`} disabled={o[key] <= min}
                  onClick={() => setCount(key, Math.max(min, o[key] - 1))}>−</button>
                <span className="n">{o[key]}</span>
                <button aria-label={`Ajouter — ${label}`} disabled={o[key] >= max}
                  onClick={() => setCount(key, Math.min(max, o[key] + 1))}>+</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="ob-sub" style={{ textAlign: "center", marginTop: 26 }}>
          {o.group === "Solo" ? "Vous voyagez seul — rien d'autre à préciser." : "À deux — rien d'autre à préciser."}
        </p>
      )}
      {o.group === "Couple" && (
        <div className="subcard">
          <h3><span className="orb" />Est-ce une occasion particulière&nbsp;?</h3>
          <div className="chiprow">
            {["Lune de miel", "Anniversaire de mariage", "Demande prévue", "Juste nous deux"].map((x) => (
              <button key={x} className={"d-chip" + (o.occasion === x ? " on" : "")} onClick={() => patchOb(() => ({ occasion: x }))}>{x}</button>
            ))}
          </div>
        </div>
      )}
    </div>,
    <div key="3">
      <h2 className="ob-q">Déjà réservé quelque chose&nbsp;?</h2>
      <p className="ob-sub">Odyssea complète autour de l&apos;existant, sans doublon.</p>
      <div style={{ marginTop: 22 }}>
        {[["vol", "Vols"], ["hotel", "Hébergements"], ["act", "Activités"]].map(([k, label]) => (
          <div className="yn-row" key={k}>
            <span>{label}</span>
            <div className="yn">
              {["oui", "non"].map((v) => (
                <button key={v} className={o.booked[k] === v ? "on" : ""}
                  onClick={() => patchOb((ob) => ({ booked: { ...ob.booked, [k]: v } }))}>
                  {v === "oui" ? "Oui" : "Pas encore"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>,
    <div key="4">
      <h2 className="ob-q">Quel voyage avez-vous envie de vivre&nbsp;?</h2>
      <p className="ob-sub">Un choix principal, et si vous le souhaitez un choix secondaire.</p>
      <div className="pick-grid">
        {STYLE_CARDS.map(([label, desc, icon]) => {
          const pri = o.stylePri === label, sec = o.styleSec === label;
          return (
            <button key={label} className="pick" aria-pressed={pri || sec} onClick={() => pickStyle(label)}>
              {pri && <><span className="sel-ring" /><span className="tag pri">Principal</span></>}
              {sec && <><span className="sel-ring sec" /><span className="tag sec">Secondaire</span></>}
              <span className="ic"><Icon name={icon} /></span>
              <h3>{label}</h3>
              <p>{desc}</p>
            </button>
          );
        })}
      </div>
    </div>,
    <div key="5">
      <h2 className="ob-q">Quel budget souhaitez-vous respecter&nbsp;?</h2>
      <p className="ob-sub">Une fourchette suffit. Odyssea s&apos;y tient et vous alerte avant de la dépasser.</p>
      <div className="pick-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        {[["Éco", "≈ 1 800 € pour deux", 2], ["Confort", "≈ 3 500 € pour deux", 3], ["Premium", "≈ 5 500 € pour deux", 4], ["Luxe", "au-delà, sans limite", 5]].map(([label, range, n]) => (
          <button key={label} className="pick compact tier" aria-pressed={o.budget === label} onClick={() => patchOb(() => ({ budget: label }))}>
            {o.budget === label && <><span className="sel-ring" /><span className="tag check">✓</span></>}
            <span className="bars">
              {Array.from({ length: 5 }, (_, i) => <span key={i} className={i < n ? "g" : ""} style={{ height: 6 + i * 3 }} />)}
            </span>
            <h3>{label}</h3>
            <p>{range}</p>
          </button>
        ))}
      </div>
    </div>,
    <div key="6">
      <h2 className="ob-q">Côté assiette&nbsp;?</h2>
      <p className="ob-sub">Vos règles, jamais négociées. Chaque table proposée les respecte.</p>
      <div className="chiprow">
        {["Aucune restriction", "Végétarien", "Végan", "Sans gluten", "Sans épices fortes", "Sans fruits de mer"].map((v) => (
          <button key={v} className={"d-chip" + (o.food.includes(v) ? " on" : "")} onClick={() => toggleList("food", v)}>{v}</button>
        ))}
      </div>
      <div style={{ marginTop: 22 }}>
        <label className="ob-sub" htmlFor="ob-allerg" style={{ display: "block", marginBottom: 2 }}>Allergies ou intolérances (optionnel)</label>
        <input id="ob-allerg" className="ob-input" value={o.allerg} placeholder="Arachides, lactose…"
          onChange={(e) => patchOb(() => ({ allerg: e.target.value }))} />
      </div>
    </div>,
    <div key="7">
      <h2 className="ob-q">Dernier réglage : vos préférences</h2>
      <p className="ob-sub">Le petit supplément d&apos;âme de l&apos;itinéraire.</p>
      <div className="chiprow" style={{ marginTop: 24 }}>
        {["Éviter la foule", "Vivre local", "Les incontournables", "Lever tôt", "Rythme lent", "En voir un maximum"].map((v) => (
          <button key={v} className={"d-chip" + (o.prefs.includes(v) ? " on" : "")} onClick={() => toggleList("prefs", v)}>{v}</button>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="onb">
      <div className="onb-bar">
        <Wordmark />
        <div className="onb-recap">
          <b>{o.dest || "Destination"}</b><span className="sep" />
          <span>{frDate(o.dep)} → {frDate(o.ret)}</span><span className="sep" />
          <span>{o.trav} · {o.group}</span>
        </div>
      </div>
      <div className="onb-wrap">
        {/* Le numéro de l'étape, en très grand et presque effacé : un repère
            qu'on lit sans le regarder. */}
        <span className="ob-ghost" aria-hidden="true">{String(o.step + 1).padStart(2, "0")}</span>
        <div className="onb-head">
          <span className="st">Étape {o.step + 1} sur {OB_STEPS}</span>
          <span className="hint">{OB_HINTS[o.step]}</span>
        </div>
        {/* La position est portée par une seule variable, sans unité : le rail,
            la traînée et l'avion s'y accrochent tous, et restent alignés. */}
        <div className={"prog" + (flying ? " flying" : "")} style={{ "--p": progress }}>
          <span className="track" />
          <span className="fill" />
          <span className="wake" aria-hidden="true" />
          <span className="plane" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path className="hull" d="M1 21 L23 12 L1 3 L5.5 12 Z" />
              <path className="wing" d="M5.5 12 L23 12 L1 21 Z" />
            </svg>
          </span>
          <div className="nodes">
            {Array.from({ length: OB_STEPS }, (_, i) => (
              <button key={i} aria-label={"Étape " + (i + 1)}
                className={"node" + (i < o.step ? " done" : i === o.step ? " cur" : "")}
                onClick={() => jump(i)} />
            ))}
          </div>
        </div>
        <div className={"ob-step-body " + (dir > 0 ? "fwd" : "back")} key={o.step}>{steps[o.step]}</div>
        <div className="ob-nav">
          {o.step > 0
            ? <button className="btn btn-line" onClick={() => go(-1)}>← Retour</button>
            : <button className="btn btn-quiet" onClick={() => router.push("/")}>Annuler</button>}
          {o.step < OB_STEPS - 1
            ? <button className="btn btn-gold" onClick={() => go(1)}>Continuer →</button>
            : <button className="btn btn-gold" onClick={compose} disabled={sending}><Icon name="spark" />{sending ? "Lancement…" : "Composer mon voyage"}</button>}
        </div>
        <p className="ob-note">
          Les questions secondaires (mobilité, enfants, escales…) arrivent plus tard, au bon moment — jamais toutes d&apos;un coup.
        </p>
      </div>
    </div>
  );
}
