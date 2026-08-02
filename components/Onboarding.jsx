"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  questionsFor,
  STYLE_CARDS,
  PACE_CARDS,
  LODGING_CARDS,
  GROUND_CARDS,
  CARE_CHIPS,
  FOOD_CHIPS,
  WISH_CHIPS,
  BUDGET_TIERS,
} from "../lib/onboarding";
import { useOdyssea, frDate, splitOf, eur } from "../lib/store";
import { findAddress, locate, reverse } from "../lib/geocode";
import { postJson, readJson } from "../lib/fetch-json";
import { Icon } from "../lib/icons";
import Wordmark from "./Wordmark";
import Generating from "./Generating";
import ParcoursMap from "./ParcoursMap";

/* Le questionnaire.

   Il ne pose que ce qui reste à savoir : ce que la barre de recherche a
   arrêté figure au bandeau, modifiable, et n'est pas redemandé. La liste des
   questions est donc variable — on s'y repère par identifiant, jamais par
   numéro, sinon ajouter une escale ferait sauter d'une question. */

export default function Onboarding() {
  const { ob: o, patchOb, toast } = useOdyssea();
  const [gen, setGen] = useState(null);
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const resume = params.get("resume");

  /* Une composition interrompue se reprend là où elle s'est arrêtée : le
     brief est déjà en base, les phases écrites aussi. On rouvre donc l'écran
     de composition sur ce voyage plutôt que de reposer les questions. */
  useEffect(() => {
    if (!resume) return;
    let alive = true;
    fetch(`/api/trips/${resume}`)
      .then(readJson)
      .then((d) => {
        if (!alive) return;
        if (!d.trip) return toast(d.error || "Ce voyage est introuvable.");
        setGen({ id: d.trip.id, totalDays: d.trip.totalDays, brief: d.trip.brief });
      })
      .catch((e) => alive && toast("Reprise impossible : " + e.message));
    return () => {
      alive = false;
    };
  }, [resume, toast]);

  const list = useMemo(() => questionsFor(o), [o]);
  const total = list.length;
  const index = Math.max(0, list.findIndex((x) => x.id === o.q));
  const current = list[index] || list[0];
  const progress = total > 1 ? index / (total - 1) : 1;

  /* La direction du dernier saut fait entrer la question du bon côté, et
     `flying` dure le temps du vol pour incliner l'avion. */
  const [dir, setDir] = useState(1);
  const [flying, setFlying] = useState(false);
  const flightTimer = useRef(null);

  /* Si la question courante disparaît — on a retiré la dernière escale, donc
     plus rien à répartir — on se recale sur celle qui prend sa place. */
  useEffect(() => {
    if (!list.some((x) => x.id === o.q)) patchOb(() => ({ q: list[0]?.id || null }));
  }, [list, o.q, patchOb]);

  useEffect(() => () => clearTimeout(flightTimer.current), []);

  const jumpTo = (i) => {
    const target = Math.max(0, Math.min(total - 1, i));
    if (target === index) return;
    setDir(target > index ? 1 : -1);
    setFlying(true);
    clearTimeout(flightTimer.current);
    flightTimer.current = setTimeout(() => setFlying(false), 900);
    patchOb(() => ({ q: list[target].id }));
  };
  const go = (d) => jumpTo(index + d);

  const pickStyle = (label) => {
    if (o.stylePri === label) return patchOb((ob) => ({ stylePri: ob.styleSec, styleSec: null }));
    if (o.styleSec === label) return patchOb(() => ({ styleSec: null }));
    if (!o.stylePri) return patchOb(() => ({ stylePri: label }));
    patchOb(() => ({ styleSec: label }));
  };
  const toggleList = (key, v) =>
    patchOb((ob) => ({
      [key]: (ob[key] || []).includes(v)
        ? ob[key].filter((x) => x !== v)
        : [...(ob[key] || []), v],
    }));

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

  const dests = o.dests || [];
  const addDest = (name) => {
    const label = String(name || "").trim();
    if (!label) return;
    patchOb((ob) =>
      (ob.dests || []).some((d) => d.toLowerCase() === label.toLowerCase())
        ? {}
        : { dests: [...(ob.dests || []), label].slice(0, 5) }
    );
  };
  const dropDest = (name) =>
    patchOb((ob) => {
      const split = { ...ob.split };
      delete split[name];
      return { dests: (ob.dests || []).filter((d) => d !== name), split };
    });

  /* On crée le voyage côté serveur, puis l'écran de génération enchaîne les
     phases. Le brief part tel qu'il a été composé, sans transformation. */
  const compose = async () => {
    if (sending) return;
    if (!dests.length) {
      toast("Indiquez d'abord une destination.");
      return patchOb(() => ({ q: "dest" }));
    }
    setSending(true);
    try {
      const { res, data } = await postJson("/api/trips", o);
      if (!res.ok) return toast(data.error || "Impossible de lancer la composition.");
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
        ob={gen.brief || o}
        onDone={() => router.push(`/voyage/${gen.id}`)}
        /* L'écran de composition affiche lui-même ses erreurs ; il ne
           renvoie ici que si l'on choisit de revenir aux questions. */
        onError={(m) => { if (m) toast(m); setGen(null); }}
      />
    );

  const bodies = {
    dest: <DestQuestion dests={dests} add={addDest} drop={dropDest} />,
    dates: (
      <>
        <h2 className="ob-q">Quelles dates&nbsp;?</h2>
        <p className="ob-sub">Odyssea vérifie la saison et vous prévient si elle joue contre vous.</p>
        <div className="dates2">
          <div>
            <label htmlFor="ob-dep">Départ</label>
            <input id="ob-dep" type="date" className="ob-input" value={o.dep}
              onChange={(e) => patchOb(() => ({ dep: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="ob-ret">Retour</label>
            <input id="ob-ret" type="date" className="ob-input" value={o.ret} min={o.dep}
              onChange={(e) => patchOb(() => ({ ret: e.target.value }))} />
          </div>
        </div>
        <p className="ob-sub mid" style={{ marginTop: 18 }}>
          {splitOf(o).total} nuit{splitOf(o).total > 1 ? "s" : ""} sur place.
        </p>
      </>
    ),
    trav: (
      <>
        <h2 className="ob-q">Qui partagera ce voyage avec vous&nbsp;?</h2>
        <p className="ob-sub">Cela change le rythme, les hébergements et les adresses proposées.</p>
        <div className="chiprow mid" style={{ marginTop: 26 }}>
          {["Solo", "Couple", "Famille", "Amis", "Pro"].map((g) => (
            <button key={g} className={"d-chip" + (o.group === g ? " on" : "")}
              onClick={() => setGroup(g)}>{g}</button>
          ))}
        </div>
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
          <p className="ob-sub mid" style={{ marginTop: 26 }}>
            {o.group === "Solo" ? "Vous voyagez seul — rien d'autre à préciser." : "À deux — rien d'autre à préciser."}
          </p>
        )}
        {o.group === "Couple" && (
          <div className="subcard">
            <h3>Est-ce une occasion particulière&nbsp;?</h3>
            <div className="chiprow">
              {["Lune de miel", "Anniversaire de mariage", "Demande prévue", "Juste nous deux"].map((x) => (
                <button key={x} className={"d-chip" + (o.occasion === x ? " on" : "")}
                  onClick={() => patchOb((ob) => ({ occasion: ob.occasion === x ? null : x }))}>{x}</button>
              ))}
            </div>
          </div>
        )}
      </>
    ),
    origin: <OriginQuestion ob={o} patchOb={patchOb} toast={toast} />,
    split: <SplitQuestion ob={o} patchOb={patchOb} />,
    style: (
      <>
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
      </>
    ),
    pace: (
      <Cards title="À quel rythme ?" sub="C'est ce qui décide du nombre de choses par jour — et de l'heure du réveil."
        cards={PACE_CARDS} value={o.pace} onPick={(v) => patchOb(() => ({ pace: v }))} numbered />
    ),
    budget: <BudgetQuestion ob={o} patchOb={patchOb} />,
    lodging: (
      <Cards title="Où aimeriez-vous dormir ?" sub="Le lieu où l'on rentre le soir compte autant que le programme."
        cards={LODGING_CARDS} value={o.lodging} onPick={(v) => patchOb(() => ({ lodging: v }))} />
    ),
    ground: (
      <Cards title="Comment vous déplacer sur place ?" sub="C'est ce qui décide vraiment de l'itinéraire : ce qu'on peut atteindre, et en combien de temps."
        cards={GROUND_CARDS} value={o.ground} onPick={(v) => patchOb(() => ({ ground: v }))} />
    ),
    booked: (
      <>
        <h2 className="ob-q">Déjà réservé quelque chose&nbsp;?</h2>
        <p className="ob-sub">Odyssea complète autour de l&apos;existant, sans doublon.</p>
        <div style={{ marginTop: 22 }}>
          {[["vol", "Vols"], ["hotel", "Hébergements"], ["act", "Activités"]]
            .filter(([k]) => o.include?.[k] !== false)
            .map(([k, label]) => (
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
      </>
    ),
    food: (
      <>
        <h2 className="ob-q">Côté assiette&nbsp;?</h2>
        <p className="ob-sub">Vos règles, jamais négociées. Chaque table proposée les respecte.</p>
        <div className="chiprow mid">
          {FOOD_CHIPS.map((v) => (
            <button key={v} className={"d-chip" + (o.food.includes(v) ? " on" : "")}
              onClick={() => toggleList("food", v)}>{v}</button>
          ))}
        </div>
        <div style={{ marginTop: 22 }}>
          <label className="ob-sub" htmlFor="ob-allerg" style={{ display: "block", marginBottom: 2 }}>
            Allergies ou intolérances (optionnel)
          </label>
          <input id="ob-allerg" className="ob-input" value={o.allerg} placeholder="Arachides, lactose…"
            onChange={(e) => patchOb(() => ({ allerg: e.target.value }))} />
        </div>
      </>
    ),
    care: (
      <>
        <h2 className="ob-q">Quelque chose dont il faut tenir compte&nbsp;?</h2>
        <p className="ob-sub">
          Odyssea en tiendra compte à chaque journée, sans jamais vous le faire répéter.
        </p>
        <div className="chiprow mid">
          {CARE_CHIPS.map((v) => (
            <button key={v} className={"d-chip" + ((o.care || []).includes(v) ? " on" : "")}
              onClick={() => toggleList("care", v)}>{v}</button>
          ))}
        </div>
        <p className="ob-sub mid" style={{ marginTop: 20 }}>Rien de tout cela&nbsp;? Passez simplement à la suite.</p>
      </>
    ),
    wish: (
      <>
        <h2 className="ob-q">Une chose que vous ne voulez pas manquer&nbsp;?</h2>
        <p className="ob-sub">Un lieu, un plat, une envie précise. Odyssea construira l&apos;itinéraire autour.</p>
        <input className="ob-input" style={{ marginTop: 24 }} value={o.wish} aria-label="Ce qui compte le plus"
          placeholder="Voir le lever du soleil sur les temples, manger dans un marché de nuit…"
          onChange={(e) => patchOb(() => ({ wish: e.target.value }))} />
        <div className="chiprow mid" style={{ marginTop: 24 }}>
          {WISH_CHIPS.map((v) => (
            <button key={v} className={"d-chip" + (o.prefs.includes(v) ? " on" : "")}
              onClick={() => toggleList("prefs", v)}>{v}</button>
          ))}
        </div>
      </>
    ),
  };

  const last = index === total - 1;
  const scope = [
    o.include?.vol !== false && "vols",
    o.include?.hotel !== false && "hébergement",
    o.include?.act !== false && "activités",
  ].filter(Boolean);

  /* Un clic rouvre la question : on lève le drapeau et on s'y rend. Le
     périmètre n'est pas une question du parcours — il se change à l'accueil,
     donc sa pastille est une simple mention. */
  const fixedChips = [
    o.fixed?.dest && dests.length && { k: "dest", label: dests.join(" · "), q: "dest" },
    o.fixed?.dates && { k: "dates", label: `${frDate(o.dep)} → ${frDate(o.ret)}`, q: "dates" },
    o.fixed?.trav && { k: "trav", label: `${o.trav} voyageur${o.trav > 1 ? "s" : ""} · ${o.group}`, q: "trav" },
    o.fixed?.scope && scope.length && { k: "scope", label: `Odyssea organise : ${scope.join(", ")}` },
  ].filter(Boolean);

  return (
    <div className="onb">
      <div className="onb-bar">
        <span className="onb-bar-side" />
        <Wordmark mark />
        <div className="onb-recap">
          <b>{dests.length ? dests.join(" · ") : "Destination"}</b><span className="sep" />
          <span>{frDate(o.dep)} → {frDate(o.ret)}</span><span className="sep" />
          <span>{o.trav} · {o.group}</span>
        </div>
      </div>

      <div className="onb-wrap">
        <span className="ob-ghost" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div className="onb-head">
          <span className="st">Étape <b>{index + 1}</b> sur {total}</span>
          <span className="hint">{current?.hint}</span>
        </div>

        {/* Ce que vous avez déjà dit dans la barre de recherche : rappelé, pas
            redemandé. Un clic le rouvre en question. */}
        {fixedChips.length > 0 && (
          <div className="ob-known">
            <span className="lbl">Déjà noté</span>
            {fixedChips.map((c) =>
              c.q ? (
                <button key={c.k} type="button" className="known"
                  onClick={() => patchOb((ob) => ({ fixed: { ...ob.fixed, [c.k]: false }, q: c.q }))}>
                  {c.label}
                  <i aria-hidden="true"><Icon name="edit" /></i>
                </button>
              ) : (
                <span key={c.k} className="known flat">{c.label}</span>
              )
            )}
          </div>
        )}

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
            {list.map((qn, i) => (
              <button key={qn.id} aria-label={"Étape " + (i + 1)}
                className={"node" + (i < index ? " done" : i === index ? " cur" : "")}
                onClick={() => jumpTo(i)} />
            ))}
          </div>
        </div>

        <div className={"ob-step-body " + (dir > 0 ? "fwd" : "back")} key={current?.id}>
          {bodies[current?.id]}
        </div>

        <div className="ob-nav">
          {index > 0
            ? <button className="btn btn-line" onClick={() => go(-1)}>← Retour</button>
            : <button className="btn btn-quiet" onClick={() => router.push("/")}>Annuler</button>}
          {last
            ? <button className="btn btn-gold" onClick={compose} disabled={sending}>
                <Icon name="spark" />{sending ? "Lancement…" : "Composer mon voyage"}
              </button>
            : <button className="btn btn-gold" onClick={() => go(1)}>Continuer →</button>}
        </div>

        <ParcoursMap ob={o} step={index} total={total} />

        <p className="ob-note">
          Chaque réponse retire une question inutile : vous ne verrez que ce qui change vraiment votre voyage.
        </p>
      </div>
    </div>
  );
}

/* ---------- Les questions qui ont besoin de leur propre logique ---------- */

function DestQuestion({ dests, add, drop }) {
  const [draft, setDraft] = useState("");
  const submit = () => { add(draft); setDraft(""); };

  return (
    <>
      <h2 className="ob-q">Où avez-vous envie d&apos;aller&nbsp;?</h2>
      <p className="ob-sub">
        Une ville, un pays, ou plusieurs escales à enchaîner — Odyssea construit la route entre elles.
      </p>
      <div className="ob-dests">
        {dests.map((d, i) => (
          <span className="dtag big" key={d}>
            <b>{String(i + 1).padStart(2, "0")}</b>
            {d}
            <button type="button" aria-label={`Retirer ${d}`} onClick={() => drop(d)}>×</button>
          </span>
        ))}
      </div>
      <div className="ob-addrow">
        <input className="ob-input" value={draft} aria-label="Destination"
          placeholder={dests.length ? "Ajouter une escale…" : "Malaisie, Lisbonne, du soleil…"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} />
        <button type="button" className="btn btn-line" onClick={submit} disabled={!draft.trim()}>
          Ajouter
        </button>
      </div>
      <div className="chiprow mid">
        {["Malaisie", "Japon", "Portugal", "Islande", "Indonésie", "Pérou"].map((d) => (
          <button key={d} className={"d-chip" + (dests.includes(d) ? " on" : "")}
            onClick={() => (dests.includes(d) ? drop(d) : add(d))}>{d}</button>
        ))}
      </div>
    </>
  );
}

/* L'adresse de départ.

   Elle sert à tracer la route depuis chez soi : le trajet jusqu'à l'aéroport,
   puis le vol, puis l'arrivée jusqu'à l'hébergement. Sans elle, l'itinéraire
   commence à l'aéroport, ce qui est rarement là où commence un voyage.

   Elle reste facultative, et rien ne quitte le navigateur tant qu'elle n'est
   pas retenue : la recherche interroge OpenStreetMap directement. */
function OriginQuestion({ ob, patchOb, toast }) {
  const [draft, setDraft] = useState("");
  const [hits, setHits] = useState([]);
  const [busy, setBusy] = useState(false);
  const chosen = ob.origin;

  useEffect(() => {
    const q = draft.trim();
    if (q.length < 4) return setHits([]);
    const ctrl = new AbortController();
    /* Nominatim tolère une requête par seconde : on attend la fin de la frappe. */
    const timer = setTimeout(() => {
      findAddress(q, { signal: ctrl.signal }).then(setHits).catch(() => {});
    }, 700);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [draft]);

  const take = (hit) => {
    patchOb(() => ({ origin: { label: hit.label, lat: hit.lat, lon: hit.lon } }));
    setDraft("");
    setHits([]);
  };

  const here = async () => {
    setBusy(true);
    try {
      const pos = await locate();
      take(await reverse(pos.lat, pos.lon));
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="ob-q">D&apos;où partez-vous&nbsp;?</h2>
      <p className="ob-sub">
        Votre adresse permet de tracer la route entière : le trajet jusqu&apos;à l&apos;aéroport,
        le vol, puis l&apos;arrivée jusqu&apos;à votre hébergement. Vous pouvez passer —
        l&apos;itinéraire commencera alors à l&apos;aéroport.
      </p>

      {chosen ? (
        <div className="ob-origin">
          <Icon name="map" />
          <span>
            <b>{chosen.label}</b>
            <i>Point de départ retenu</i>
          </span>
          <button type="button" onClick={() => patchOb(() => ({ origin: null }))}>
            Changer
          </button>
        </div>
      ) : (
        <>
          <div className="ob-addrow">
            <input className="ob-input" value={draft} aria-label="Votre adresse"
              placeholder="12 rue de la Paix, Paris"
              onChange={(e) => setDraft(e.target.value)} />
            <button type="button" className="btn btn-line" onClick={here} disabled={busy}>
              <Icon name="compass" />
              {busy ? "Localisation…" : "Ma position"}
            </button>
          </div>
          {hits.length > 0 && (
            <ul className="ob-hits">
              {hits.map((h) => (
                <li key={h.full}>
                  <button type="button" onClick={() => take(h)}>
                    <b>{h.label}</b>
                    <i>{h.full}</i>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="ob-sub mid" style={{ marginTop: 18 }}>
            Recherche effectuée par OpenStreetMap. Rien n&apos;est enregistré tant que vous
            n&apos;avez pas retenu une adresse.
          </p>
        </>
      )}
    </>
  );
}

/* La répartition des nuits : elle n'apparaît qu'à partir de deux escales, et
   ce qui n'est pas attribué est laissé à Odyssea. */
function SplitQuestion({ ob, patchOb }) {
  const { total, given, left } = splitOf(ob);
  const set = (dest, n) =>
    patchOb((o) => ({ split: { ...o.split, [dest]: Math.max(0, n) } }));

  return (
    <>
      <h2 className="ob-q">Combien de temps à chaque escale&nbsp;?</h2>
      <p className="ob-sub">
        {total} nuit{total > 1 ? "s" : ""} à répartir. Laissez à zéro ce que vous préférez confier à Odyssea.
      </p>
      <div className="ob-counts">
        {(ob.dests || []).map((d, i) => (
          <div className="ob-count" key={d}>
            <div><b>{d}</b><span>escale {String(i + 1).padStart(2, "0")}</span></div>
            <div className="ob-count-ctl">
              <button aria-label={`Retirer une nuit — ${d}`} disabled={(ob.split?.[d] || 0) <= 0}
                onClick={() => set(d, (ob.split?.[d] || 0) - 1)}>−</button>
              <span className="n">{ob.split?.[d] || 0}</span>
              <button aria-label={`Ajouter une nuit — ${d}`} disabled={left <= 0}
                onClick={() => set(d, (ob.split?.[d] || 0) + 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
      <p className={"ob-sub mid" + (left < 0 ? " warn" : "")} style={{ marginTop: 20 }}>
        {given === 0
          ? "Odyssea équilibrera les nuits selon ce qu'il y a à voir."
          : left > 0
            ? `${left} nuit${left > 1 ? "s" : ""} encore libre${left > 1 ? "s" : ""} — Odyssea les placera.`
            : "Toutes les nuits sont réparties."}
      </p>
    </>
  );
}

/* Le budget se compte pour le groupe réellement déclaré, pas pour un couple. */
function BudgetQuestion({ ob, patchOb }) {
  const people = Math.max(1, (ob.adults || 0) + (ob.kids || 0));
  const nights = splitOf(ob).total;

  return (
    <>
      <h2 className="ob-q">Quel budget souhaitez-vous respecter&nbsp;?</h2>
      <p className="ob-sub">
        Une fourchette suffit. Odyssea s&apos;y tient et vous alerte avant de la dépasser.
      </p>
      <div className="pick-grid tiers">
        {BUDGET_TIERS.map(([label, perNight, bars]) => (
          <button key={label} className="pick compact tier" aria-pressed={ob.budget === label}
            onClick={() => patchOb(() => ({ budget: label }))}>
            {ob.budget === label && <><span className="sel-ring" /><span className="tag check">✓</span></>}
            <span className="bars">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < bars ? "g" : ""} style={{ height: 6 + i * 3 }} />
              ))}
            </span>
            <h3>{label}</h3>
            <p>
              {perNight
                ? `≈ ${eur(perNight * people * Math.max(1, nights) / 2)} au total`
                : "au-delà, sans limite"}
            </p>
          </button>
        ))}
      </div>
      <p className="ob-sub mid" style={{ marginTop: 20 }}>
        Ordres de grandeur pour {people} voyageur{people > 1 ? "s" : ""} sur {nights} nuit{nights > 1 ? "s" : ""},
        vols compris. Le budget réel est chiffré à la composition.
      </p>
    </>
  );
}

/* Une grille de choix uniques — même forme pour le rythme, l'hébergement et
   le déplacement sur place. */
function Cards({ title, sub, cards, value, onPick, numbered }) {
  return (
    <>
      <h2 className="ob-q">{title}</h2>
      <p className="ob-sub">{sub}</p>
      <div className="pick-grid">
        {cards.map(([label, desc, icon]) => (
          <button key={label} className="pick" aria-pressed={value === label}
            onClick={() => onPick(value === label ? null : label)}>
            {value === label && <><span className="sel-ring" /><span className="tag check">✓</span></>}
            <span className={"ic" + (numbered ? " num" : "")}>
              {numbered ? icon : <Icon name={icon} />}
            </span>
            <h3>{label}</h3>
            <p>{desc}</p>
          </button>
        ))}
      </div>
    </>
  );
}
