"use client";
import { useCallback, useEffect, useState } from "react";
import Book from "../Book";
import { Icon } from "../../lib/icons";
import { eur } from "../../lib/store";

/* « Préparer mon voyage ».

   Six étapes dans l'ordre où on les traite, chacune repliable. On n'ouvre
   qu'une chose à la fois : la préparation d'un voyage est une suite de
   décisions, pas un mur de texte.

   Ce qui se coche se retient. La liste est propre au voyage et vit dans le
   navigateur : elle n'a pas besoin d'un compte pour servir, et elle ne part
   nulle part. Un voyageur qui coche « passeport » depuis son téléphone dans
   le train n'a aucune raison de créer un compte pour cela. */

const STEPS = [
  ["formalities", "Formalités", "shield", "Ce qu'il faut avoir en main pour entrer"],
  ["health", "Santé et sécurité", "heart", "Vaccins, trousse, numéros qui comptent"],
  ["connectivity", "Internet et communication", "spark", "Rester joignable, et brancher ses appareils"],
  ["money", "Argent et paiement", "wallet", "Monnaie, change, budget sur place"],
  ["packing", "La valise", "bag", "Déduite de la météo, de la durée et du programme"],
  ["bookings", "Réservations", "check", "Ce qu'il faut réserver, et quand"],
];

const LEVEL_TONE = { obligatoire: "req", recommandé: "reco", "selon le cas": "maybe" };

/** Ce qui est coché, par voyage, dans le navigateur. */
function useChecklist(tripId) {
  const key = `odyssea:prep:${tripId}`;
  const [done, setDone] = useState(() => new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setDone(new Set(JSON.parse(raw)));
    } catch {
      /* Stockage indisponible : la page marche, sans mémoire. */
    }
  }, [key]);

  const toggle = useCallback(
    (id) =>
      setDone((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        try {
          localStorage.setItem(key, JSON.stringify([...next]));
        } catch {}
        return next;
      }),
    [key]
  );

  return [done, toggle];
}

function Tick({ on, onClick, children, hint }) {
  return (
    <label className={"tick" + (on ? " on" : "")}>
      <input type="checkbox" checked={on} onChange={onClick} />
      <span className="box" aria-hidden="true">
        <Icon name="check" />
      </span>
      <span className="tx">
        {children}
        {hint && <i>{hint}</i>}
      </span>
    </label>
  );
}

export default function Prepare({ trip }) {
  const prep = trip.practical;
  const [open, setOpen] = useState("formalities");
  const [done, toggle] = useChecklist(trip.id);

  if (!prep) {
    return (
      <section className="screen">
        <header className="shead">
          <div className="kicker gold">Préparer mon voyage</div>
          <h1>Préparation en cours.</h1>
        </header>
        <div className="vempty">Elle sera disponible dès la fin de la composition.</div>
      </section>
    );
  }

  const country = trip.plan?.destination?.country || "";
  const cc = trip.plan?.destination?.countryCode || "";
  const first = trip.plan?.stops?.[0]?.name || country;
  const { brief } = trip;

  /* Ce qui est cochable, pour dire l'avancement de la préparation. */
  const boxes = [
    ...(prep.formalities?.documents || []).map((d) => "doc:" + d.label),
    ...(prep.packing || []).flatMap((g) => g.items.map((i) => `pack:${g.group}:${i.label}`)),
    ...(prep.bookings || []).map((b) => "book:" + b.label),
  ];
  const checked = boxes.filter((b) => done.has(b)).length;
  const ratio = boxes.length ? checked / boxes.length : 0;

  const step = (key) => ({
    open: open === key,
    onToggle: () => setOpen((o) => (o === key ? null : key)),
  });

  return (
    <section className="screen">
      <header className="shead">
        <div className="kicker gold">Préparer mon voyage</div>
        <h1>Six étapes, et vous êtes prêt.</h1>
        <p>
          Tout ce qui suit est propre à {country || "cette destination"}, à vos dates et à votre
          équipage. Cochez au fur et à mesure — la liste se retient.
        </p>
      </header>

      <div className="prep-top">
        <div className="prep-gauge" style={{ "--p": ratio }}>
          <span className="rail"><span className="fill" /></span>
          <b className="mono">{checked} / {boxes.length}</b>
        </div>
        <span className="prep-hint">
          {ratio === 1
            ? "Tout est prêt."
            : ratio > 0.5
              ? "Vous y êtes presque."
              : "Commencez par les formalités : ce sont elles qui prennent du temps."}
        </span>
      </div>

      <div className="prep">
        {STEPS.map(([key, title, icon, sub], i) => {
          const s = step(key);
          return (
            <section className={"prep-step" + (s.open ? " open" : "")} key={key}>
              <button type="button" className="prep-head" onClick={s.onToggle} aria-expanded={s.open}>
                <span className="n mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="ic"><Icon name={icon} /></span>
                <span className="tt">
                  <b>{title}</b>
                  <i>{sub}</i>
                </span>
                <span className="chev" aria-hidden="true">›</span>
              </button>

              {s.open && (
                <div className="prep-body">
                  {key === "formalities" && (
                    <Formalities prep={prep} done={done} toggle={toggle} />
                  )}
                  {key === "health" && <Health prep={prep} />}
                  {key === "connectivity" && (
                    <Connectivity prep={prep} country={country} cc={cc} tripId={trip.id} />
                  )}
                  {key === "money" && <Money prep={prep} brief={brief} />}
                  {key === "packing" && (
                    <Packing prep={prep} done={done} toggle={toggle} cc={cc} tripId={trip.id} />
                  )}
                  {key === "bookings" && (
                    <Bookings
                      prep={prep}
                      done={done}
                      toggle={toggle}
                      trip={trip}
                      cc={cc}
                      first={first}
                    />
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {prep.watchouts?.length ? (
        <div className="vsec">
          <h2 className="vsec-t">Ce qui coince dans cet itinéraire</h2>
          <div className="vlist">
            {prep.watchouts.map((w) => (
              <article className={"vwatch" + (w.severity === "fort" ? " hard" : "")} key={w.title}>
                <span className="imp">Impact {w.severity}</span>
                <b>{w.title}</b>
                <p>{w.detail}</p>
                <div className="fix">
                  <span className="kicker steel">Correctif</span>
                  {w.fix}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ---------- Étape 1 ---------- */

function Formalities({ prep, done, toggle }) {
  const f = prep.formalities;
  if (!f) return null;
  return (
    <>
      <p className="prep-lead">{f.summary}</p>
      <div className="prep-docs">
        {(f.documents || []).map((d) => (
          <article className={"doc " + (LEVEL_TONE[d.level] || "maybe")} key={d.label}>
            <Tick on={done.has("doc:" + d.label)} onClick={() => toggle("doc:" + d.label)}>
              <b>{d.label}</b>
            </Tick>
            <span className="lvl">{d.level}</span>
            <p>{d.detail}</p>
            <div className="meta">
              {d.who && <span>{d.who}</span>}
              {d.validity && <span>{d.validity}</span>}
              {d.url && (
                <a href={d.url} target="_blank" rel="noopener noreferrer">
                  Page officielle <Icon name="send" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>

      {f.entry?.length ? (
        <>
          <h3 className="prep-h">Conditions d&apos;entrée</h3>
          <ul className="prep-list">
            {f.entry.map((e) => (
              <li key={e.title}>
                <b>{e.title}</b>
                {e.detail}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {f.sources?.length ? (
        <p className="prep-src">
          Sources officielles :{" "}
          {f.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
            </span>
          ))}
          . Les conditions d&apos;entrée changent sans préavis : vérifiez-les à la source avant de
          réserver.
        </p>
      ) : null}
    </>
  );
}

/* ---------- Étape 2 ---------- */

function Health({ prep }) {
  const h = prep.health;
  if (!h) return null;
  return (
    <>
      <p className="prep-lead">{h.summary}</p>

      <div className="prep-two">
        <div>
          <h3 className="prep-h">Vaccins</h3>
          <div className="prep-chips">
            {(h.vaccines || []).map((v) => (
              <span className={"vac " + (LEVEL_TONE[v.level] || "maybe")} key={v.name}>
                <b>{v.name}</b>
                <i>{v.level}</i>
                <em>{v.detail}</em>
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="prep-h">Trousse à emporter</h3>
          <ul className="prep-list plain">
            {(h.kit || []).map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="prep-h">En cas d&apos;urgence</h3>
      <div className="prep-nums">
        {(h.emergency || []).map((e) => (
          <a className="num" key={e.label} href={`tel:${e.number.replace(/\s/g, "")}`}>
            <span>{e.label}</span>
            <b className="mono">{e.number}</b>
          </a>
        ))}
      </div>

      {h.facilities?.length ? (
        <ul className="prep-list">
          {h.facilities.map((f) => (
            <li key={f.name}>
              <b>{f.name} — {f.city}</b>
              {f.detail}
            </li>
          ))}
        </ul>
      ) : null}

      {h.safety?.length ? (
        <>
          <h3 className="prep-h">Sur place</h3>
          <ul className="prep-list">
            {h.safety.map((s) => (
              <li key={s.title}>
                <b>{s.title}</b>
                {s.detail}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

/* ---------- Étape 3 ---------- */

function Connectivity({ prep, country, cc, tripId }) {
  const c = prep.connectivity;
  if (!c) return null;
  return (
    <>
      <p className="prep-lead">{c.summary}</p>
      {c.coverage && <p className="prep-note">{c.coverage}</p>}

      {c.plug && (
        <div className="prep-plug">
          <Icon name="spark" />
          <span>
            <b>Prises {c.plug.types}</b> · {c.plug.voltage}
            <i>{c.plug.adapter}</i>
          </span>
        </div>
      )}

      {c.esim?.length ? (
        <>
          <h3 className="prep-h">eSIM</h3>
          <div className="prep-offers">
            {c.esim.map((o) => (
              <article className="offer" key={o.provider + o.plan}>
                <b>{o.provider}</b>
                <span className="plan">{o.plan}</span>
                <p>{o.detail}</p>
                <span className="p mono">{eur(o.priceEur)}</span>
              </article>
            ))}
          </div>
          <Book kind="esim" country={cc} params={{ country }} tripId={tripId} slot="prep-esim" />
        </>
      ) : null}

      {c.localSim?.length ? (
        <>
          <h3 className="prep-h">Carte SIM locale</h3>
          <ul className="prep-list">
            {c.localSim.map((s) => (
              <li key={s.operator}>
                <b>
                  {s.operator} — {eur(s.priceEur)}
                </b>
                {s.where}. {s.detail}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

/* ---------- Étape 4 ---------- */

function Money({ prep, brief }) {
  const m = prep.money;
  const people = Math.max(1, (brief.adults || 0) + (brief.kids || 0));
  const [level, setLevel] = useState("comfortEur");
  if (!m) return null;

  const per = m.daily?.[level] || 0;
  const LEVELS = [
    ["frugalEur", "Économe"],
    ["comfortEur", "Confort"],
    ["generousEur", "Sans compter"],
  ];

  return (
    <>
      {m.currency && (
        <div className="prep-cur">
          <b>{m.currency.name}</b>
          <span className="mono">{m.currency.code}</span>
          <i>{m.currency.rate}</i>
        </div>
      )}

      <div className="prep-two">
        <div>
          <h3 className="prep-h">Payer</h3>
          <ul className="prep-list">
            {(m.payment || []).map((p) => (
              <li key={p.title}>
                <b>{p.title}</b>
                {p.detail}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="prep-h">Espèces</h3>
          <ul className="prep-list">
            {(m.cash || []).map((p) => (
              <li key={p.title}>
                <b>{p.title}</b>
                {p.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {m.daily && (
        <div className="prep-budget">
          <h3 className="prep-h">Budget sur place</h3>
          <div className="seg">
            {LEVELS.map(([k, label]) => (
              <button key={k} className={level === k ? "on" : ""} onClick={() => setLevel(k)}>
                {label}
              </button>
            ))}
          </div>
          <div className="figures">
            <div>
              <b>{eur(per)}</b>
              <i>par personne et par jour</i>
            </div>
            <div>
              <b>{eur(per * people)}</b>
              <i>pour {people} voyageur{people > 1 ? "s" : ""}, par jour</i>
            </div>
          </div>
          <p className="prep-note">{m.daily.note}</p>
        </div>
      )}
    </>
  );
}

/* ---------- Étape 5 ---------- */

function Packing({ prep, done, toggle, cc, tripId }) {
  const groups = prep.packing || [];
  const [onlyEssential, setOnly] = useState(false);
  if (!groups.length) return null;

  return (
    <>
      <div className="prep-filter">
        <button className={onlyEssential ? "on" : ""} onClick={() => setOnly((v) => !v)}>
          <Icon name="check" />
          {onlyEssential ? "Tout afficher" : "L'essentiel seulement"}
        </button>
      </div>

      <div className="prep-pack">
        {groups.map((g) => {
          const items = onlyEssential ? g.items.filter((i) => i.essential) : g.items;
          if (!items.length) return null;
          return (
            <article className="pack" key={g.group}>
              <h3>{g.group}</h3>
              {items.map((it) => {
                const id = `pack:${g.group}:${it.label}`;
                return (
                  <Tick key={id} on={done.has(id)} onClick={() => toggle(id)} hint={it.why}>
                    {it.label}
                    {it.essential && <em className="ess">essentiel</em>}
                  </Tick>
                );
              })}
            </article>
          );
        })}
      </div>

      <Book kind="gear" country={cc} params={{ query: "accessoires de voyage" }} tripId={tripId}
        slot="prep-gear" label="Il vous manque quelque chose ?" />
    </>
  );
}

/* ---------- Étape 6 ---------- */

const WHEN_ORDER = ["dès maintenant", "un mois avant", "sur place"];

function Bookings({ prep, done, toggle, trip, cc, first }) {
  const list = prep.bookings || [];
  if (!list.length) return null;
  const { brief, plan } = trip;

  const rank = (b) => {
    const i = WHEN_ORDER.findIndex((w) => (b.when || "").toLowerCase().includes(w));
    return i < 0 ? 1 : i;
  };
  const sorted = [...list].sort((a, b) => rank(a) - rank(b));

  return (
    <div className="prep-books">
      {sorted.map((b) => {
        const id = "book:" + b.label;
        const place = b.place || first;
        return (
          <article className="bk" key={b.label}>
            <Tick on={done.has(id)} onClick={() => toggle(id)}>
              <b>{b.label}</b>
            </Tick>
            <span className="when">{b.when}</span>
            <p>{b.why}</p>
            <Book
              kind={b.kind}
              country={cc}
              tripId={trip.id}
              slot={"prep-" + b.kind}
              compact
              params={{
                place,
                query: b.label,
                country: plan?.destination?.country,
                from: brief.from,
                to: place,
                dep: brief.dep,
                ret: brief.ret,
                adults: brief.adults,
                kids: brief.kids,
              }}
            />
          </article>
        );
      })}
    </div>
  );
}
