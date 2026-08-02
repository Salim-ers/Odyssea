"use client";

/* Les écrans du voyage.

   Même langage visuel que l'exemple de l'accueil : la carte à tuiles, les
   escales en pastilles, le programme en journées. Ce qu'on a montré avant de
   composer est exactement ce qu'on reçoit après — c'est la promesse tenue.

   Tout ce qui s'affiche ici vient de la génération : aucune donnée n'est
   écrite en dur, et ce qui manque se dit plutôt que de se combler. */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LiveMap from "../LiveMap";
import Book from "../Book";
import { postJson } from "../../lib/fetch-json";
import { Icon, Chip } from "../../lib/icons";
import { kindOf, KINDS } from "../../lib/kinds";
import { eur, frDate, frDateLong, nights } from "../../lib/store";

export function Screen({ kicker, title, intro, children }) {
  return (
    <section className="screen">
      <header className="shead">
        <div className="kicker gold">{kicker}</div>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <div className="vempty">{children}</div>;
}

/* Un lien de réservation pointe vers un site tiers : on le dit. */
function Outbound({ href, children }) {
  if (!href) return null;
  return (
    <a className="btn btn-line small" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <Icon name="send" />
    </a>
  );
}

/* La première phrase d'un détail : de quoi se projeter sans recopier
   l'itinéraire. On coupe à la ponctuation, jamais au milieu d'un mot. */
const first = (text) => {
  const t = String(text || '').trim();
  if (t.length <= 120) return t;
  const cut = t.slice(0, 120);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' ; '), cut.lastIndexOf(', '));
  return (stop > 60 ? cut.slice(0, stop) : cut.slice(0, cut.lastIndexOf(' '))) + '…';
};

/* ---------- Aperçu ----------

   Ce qu'on doit comprendre en dix secondes, et rien d'autre : où, quand,
   avec qui, pour combien, quel temps il fera, où l'on dort, comment on se
   déplace, ce qu'on va faire, et ce qu'il reste à faire.

   Tout le reste — les conseils, les sources, le détail des étapes — se
   déplie. Le premier écran d'un voyage n'est pas un dossier : c'est une
   réponse. */

function Fact({ k, v, icon }) {
  return (
    <div className="fact">
      {icon && <Icon name={icon} />}
      <span>
        <i>{k}</i>
        <b>{v}</b>
      </span>
    </div>
  );
}

/* La météo de l'aperçu : une moyenne, pas quatorze cartes. Le détail est
   dans son propre onglet. */
function WeatherGlance({ tripId }) {
  const [w, setW] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/weather?trip=${tripId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const days = (d.stops || []).flatMap((s) => s.days || []);
        const temps = days.map((x) => x.tmax).filter(Number.isFinite);
        if (!temps.length) return;
        const rainy = days.filter((x) => conditionOf(x.code).icon === "rain").length;
        setW({
          max: Math.round(temps.reduce((s, t) => s + t, 0) / temps.length),
          rainy,
          days: days.length,
          forecast: days.some((x) => x.kind === "forecast"),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tripId]);

  if (!w) return null;
  return (
    <Fact
      icon={w.rainy > w.days / 3 ? "rain" : "sun"}
      k={w.forecast ? "Météo prévue" : "Météo de saison"}
      v={`${w.max}° en moyenne${w.rainy ? ` · ${w.rainy} jour${w.rainy > 1 ? "s" : ""} de pluie` : ""}`}
    />
  );
}

export function Overview({ trip, setTab }) {
  const { plan, brief, days, practical: prep } = trip;
  const [stop, setStop] = useState(plan.stops[0]?.name);
  const n = nights(brief.dep, brief.ret);
  const people = Math.max(1, brief.adults + brief.kids);
  const score = plan.season?.score ?? null;
  const cc = plan.destination?.countryCode || "";

  /* Si le voyageur a donné son adresse, la carte part de chez lui : le trajet
     jusqu au premier point est alors calculé comme les autres. */
  const route = brief.origin
    ? [{ ...brief.origin, name: brief.origin.label, region: "Point de départ" }, ...plan.stops]
    : plan.stops;

  /* Les temps forts : les activités et visites du programme, sans les repas
     ni les transferts, dans l'ordre où on les vivra. */
  const highlights = days
    .flatMap((d) => d.items.map((it) => ({ ...it, day: d.n })))
    .filter((it) => it.kind === "sight" || it.kind === "activity")
    .slice(0, 6);

  /* Ce qu'il reste à faire, pris là où c'est écrit. */
  const next = (prep?.bookings || []).slice(0, 3);
  const area = (plan.stays || []).find((s) => s.stopName === stop) || plan.stays?.[0];
  const ground = prep?.transport?.mode || null;

  return (
    <section className="screen">
      <header className="vhead">
        <div className="kicker gold">
          {plan.destination.country} · {n} nuit{n > 1 ? "s" : ""}
        </div>
        <h1>{plan.destination.tagline}</h1>
        <p>{plan.destination.summary}</p>
      </header>

      {/* L'essentiel, d'un coup d'œil. */}
      <div className="glance">
        <Fact icon="clock" k="Dates" v={`${frDate(brief.dep)} → ${frDate(brief.ret)}`} />
        <Fact
          icon="users"
          k="Voyageurs"
          v={`${brief.adults} adulte${brief.adults > 1 ? "s" : ""}${brief.kids ? ` · ${brief.kids} enfant${brief.kids > 1 ? "s" : ""}` : ""}`}
        />
        {plan.budget?.totalEur ? (
          <Fact
            icon="wallet"
            k="Budget estimé"
            v={`${eur(plan.budget.totalEur)} · ${eur(Math.round(plan.budget.totalEur / people))} / pers.`}
          />
        ) : null}
        <WeatherGlance tripId={trip.id} />
        {area ? <Fact icon="bed" k="Hébergement" v={`${area.area}, ${area.stopName}`} /> : null}
        {ground ? <Fact icon="car" k="Sur place" v={ground} /> : null}
      </div>

      <div className="vmap-row">
        <div className="map-wrap plain">
          <LiveMap stops={route} active={stop} onSelect={setStop} height={430} />
        </div>

        <div className="vside">
          {score != null && (
            <div className="vseason">
              <div className="ring">
                <svg width="78" height="78" viewBox="0 0 78 78">
                  <circle cx="39" cy="39" r="32" className="bg" fill="none" strokeWidth="5" />
                  <circle cx="39" cy="39" r="32" className="fg" fill="none" strokeWidth="5"
                    strokeLinecap="round" strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - score / 100)} />
                </svg>
                <span>{score}</span>
              </div>
              <div>
                <b>{plan.season?.verdict}</b>
                <p>{plan.season?.detail}</p>
              </div>
            </div>
          )}

          <div className="stopbar">
            {plan.stops.map((s, i) => (
              <button type="button" key={s.name}
                className={"stopbtn" + (stop === s.name ? " on" : "")}
                onClick={() => setStop(s.name)}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                {s.name}
                <span>{s.nights} nuit{s.nights > 1 ? "s" : ""}</span>
              </button>
            ))}
          </div>

          {plan.stops
            .filter((s) => s.name === stop)
            .map((s) => (
              <article className="vstop" key={s.name}>
                <div className="kicker steel">{s.region}</div>
                <h3>{s.name}</h3>
                <p>{s.why}</p>
              </article>
            ))}
        </div>
      </div>

      {/* Les temps forts, pour se projeter. */}
      {highlights.length ? (
        <div className="vsec">
          <div className="vsec-row">
            <h2 className="vsec-t">Les temps forts</h2>
            <button className="linkish" onClick={() => setTab("itin")}>
              Voir les {days.length} journées →
            </button>
          </div>
          <div className="hl">
            {highlights.map((h, i) => (
              <article className="hl-i" key={i}>
                <span className="d mono">J{h.day}</span>
                <b>{h.title}</b>
                <i>{first(h.detail)}</i>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {/* Ce qu'il reste à faire — la seule section qui appelle une action. */}
      {next.length ? (
        <div className="vsec">
          <div className="vsec-row">
            <h2 className="vsec-t">Vos prochaines actions</h2>
            <button className="linkish" onClick={() => setTab("preparer")}>
              Tout préparer →
            </button>
          </div>
          <div className="todo">
            {next.map((b) => (
              <article className="todo-i" key={b.label}>
                <span className="w mono">{b.when}</span>
                <b>{b.label}</b>
                <p>{b.why}</p>
                <Book
                  kind={b.kind}
                  country={cc}
                  tripId={trip.id}
                  slot={"apercu-" + b.kind}
                  compact
                  params={{
                    place: b.place || plan.stops[0]?.name,
                    query: b.label,
                    country: plan.destination.country,
                    from: brief.from,
                    to: b.place || plan.stops[0]?.name,
                    dep: brief.dep,
                    ret: brief.ret,
                    adults: brief.adults,
                    kids: brief.kids,
                  }}
                />
              </article>
            ))}
          </div>
        </div>
      ) : null}

    </section>
  );
}

/* ---------- Itinéraire ----------

   Une journée se coche, étape par étape : c'est ainsi qu'on la vit, pas en
   la relisant en entier. Ce qui est fait reste su, par voyage, dans le
   navigateur — sans compte, et sans que rien ne parte.

   Et une journée qui ne convient pas se refait, seule. On donne au modèle la
   raison du rejet ; il réécrit cette journée-là sans reprendre ce qu'il
   avait proposé, et le reste du programme n'est pas touché. */

function useDone(tripId) {
  const key = `odyssea:fait:${tripId}`;
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

function Redo({ tripId, day, onDone }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const { res, data } = await postJson(`/api/trips/${tripId}/day`, { n: day, reason });
      if (!res.ok) {
        setError(data.error || "La journée n'a pas pu être refaite.");
        return;
      }
      setOpen(false);
      setReason("");
      onDone();
    } catch (e) {
      setError("Connexion impossible : " + e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="redo-open" onClick={() => setOpen(true)}>
        <Icon name="spark" />
        Cette journée ne me convient pas
      </button>
    );
  }

  return (
    <div className="redo">
      <label htmlFor={`redo-${day}`}>Qu&apos;est-ce qui ne va pas&nbsp;?</label>
      <textarea id={`redo-${day}`} value={reason} rows={2} disabled={busy}
        placeholder="Trop de marche, je préférerais la mer, commencer plus tard…"
        onChange={(e) => setReason(e.target.value)} />
      {error && <p className="redo-err">{error}</p>}
      <div className="redo-acts">
        <button className="btn btn-gold small" onClick={send} disabled={busy}>
          <Icon name="spark" />
          {busy ? "Réécriture…" : "Refaire cette journée"}
        </button>
        <button className="btn btn-quiet small" onClick={() => setOpen(false)} disabled={busy}>
          Annuler
        </button>
      </div>
      <p className="redo-note">
        Seule cette journée est réécrite. Le reste du programme n&apos;est pas touché.
      </p>
    </div>
  );
}

export function Itinerary({ trip, day, setDay }) {
  const router = useRouter();
  const [done, toggle] = useDone(trip.id);
  const d = trip.days.find((x) => x.n === day) || trip.days[0];

  if (!d) {
    return (
      <Screen kicker="Itinéraire" title="Aucune journée.">
        <Empty>Le programme n&apos;a pas encore été composé.</Empty>
      </Screen>
    );
  }

  /* Les journées se regroupent par escale : on lit un séjour, pas une liste. */
  const byStop = [];
  for (const x of trip.days) {
    const last = byStop[byStop.length - 1];
    if (last && last.name === x.stopName) last.days.push(x);
    else byStop.push({ name: x.stopName, days: [x] });
  }

  const id = (i) => `${d.n}:${i}`;
  const checked = d.items.filter((_, i) => done.has(id(i))).length;

  return (
    <Screen
      kicker="Itinéraire"
      title={`${trip.days.length} journées, heure par heure.`}
      intro="Cochez à mesure. Les horaires et les fermetures ont été vérifiés à la composition — reconfirmez-les la veille."
    >
      <div className="dayrail">
        {byStop.map((g) => (
          <div className="dayrail-g" key={g.name + g.days[0].n}>
            <span className="gl">{g.name}</span>
            <div className="gd">
              {g.days.map((x) => (
                <button key={x.n} className={"daychip" + (x.n === day ? " on" : "")}
                  onClick={() => setDay(x.n)}>
                  <b>J{x.n}</b>
                  <span>{frDate(x.date)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ul className="kindkey">
        {Object.entries(KINDS).map(([k, v]) => (
          <li key={k} style={{ "--kc": v.c }}>
            <Icon name={v.icon} />
            {v.label}
          </li>
        ))}
      </ul>

      <article className="dayblock wide" key={d.n}>
        <header className="dhead">
          <span className="dnum">Jour {d.n}</span>
          <h4>{d.title}</h4>
          <span className="ddate">{d.stopName} · {frDateLong(d.date)}</span>
          <span className="ddone mono">{checked} / {d.items.length}</span>
        </header>

        {d.items.map((it, i) => {
          const kind = kindOf(it.kind);
          const on = done.has(id(i));
          return (
            <div className={"dayline" + (on ? " done" : "")} key={i} style={{ "--kc": kind.c }}>
              <span className="t">{it.time}</span>
              <button className={"dtick" + (on ? " on" : "")} onClick={() => toggle(id(i))}
                aria-pressed={on} aria-label={on ? "Marquer comme à faire" : "Marquer comme fait"}>
                <Icon name={on ? "check" : kind.icon} />
              </button>
              <div className="dtx">
                <b>{it.title}</b>
                <span className="klabel">{kind.label}</span>
                {it.detail && <span className="dsub">{it.detail}</span>}
                <div className="dmeta">
                  {it.durationMin > 0 && (
                    <Chip icon="clock">
                      {it.durationMin >= 60
                        ? `${Math.floor(it.durationMin / 60)} h${it.durationMin % 60 ? ` ${it.durationMin % 60}` : ""}`
                        : `${it.durationMin} min`}
                    </Chip>
                  )}
                  {it.costEur > 0 && <Chip icon="wallet">{eur(it.costEur)} / pers.</Chip>}
                  {it.bookingUrl && <Outbound href={it.bookingUrl}>Réserver</Outbound>}
                </div>
                {it.why && <p className="why">{it.why}</p>}
              </div>
            </div>
          );
        })}

        <Redo tripId={trip.id} day={d.n} onDone={() => router.refresh()} />
      </article>

      <div className="daynav">
        <button className="btn btn-line" disabled={d.n <= 1} onClick={() => setDay(d.n - 1)}>
          ← Jour {d.n - 1}
        </button>
        <button className="btn btn-line" disabled={d.n >= trip.days.length}
          onClick={() => setDay(d.n + 1)}>
          Jour {d.n + 1} →
        </button>
      </div>
    </Screen>
  );
}

/* ---------- Vols ---------- */

export function Flights({ trip }) {
  const f = trip.plan.flights;
  if (!f?.options?.length) {
    return (
      <Screen kicker="Vols" title="Aucun vol à comparer.">
        <Empty>Les vols n&apos;étaient pas inclus dans votre demande.</Empty>
      </Screen>
    );
  }

  return (
    <Screen kicker="Vols" title="Les compagnies sur cet axe." intro={f.summary}>
      <div className="vlist">
        {f.options.map((o, i) => (
          <article className="vrow" key={o.airline + i}>
            <span className="mark">{o.airline.slice(0, 2).toUpperCase()}</span>
            <div className="body">
              <div className="line1">
                <b>{o.airline}</b>
                {i === 0 && <Chip tone="gold" icon="spark">La plus pertinente</Chip>}
              </div>
              <div className="route mono">{o.route}</div>
              <div className="dmeta">
                <Chip icon="clock">{o.duration}</Chip>
                <Chip icon="plane">{o.stops}</Chip>
              </div>
              {o.note && <p className="why">{o.note}</p>}
            </div>
            <div className="price">
              <b>{eur(o.priceEur)}</b>
              <i>estimé · A/R par personne</i>
            </div>
          </article>
        ))}
      </div>

      <div className="vaside">
        <Icon name="info" />
        <p>
          Odyssea ne vend pas de billets. Ces prix sont des ordres de grandeur relevés à la
          composition — ouvrez la recherche pour les tarifs et disponibilités du jour.
        </p>
        <Outbound href={f.searchUrl}>Ouvrir la recherche</Outbound>
      </div>
    </Screen>
  );
}

/* ---------- Hébergement ---------- */

export function Stays({ trip }) {
  const stays = trip.plan.stays || [];
  if (!stays.length) {
    return (
      <Screen kicker="Hébergement" title="Aucun hébergement.">
        <Empty>L&apos;hébergement n&apos;était pas inclus dans votre demande.</Empty>
      </Screen>
    );
  }

  return (
    <Screen
      kicker="Hébergement"
      title="Où poser vos valises."
      intro="Un quartier par étape, choisi pour ce que vous allez faire sur place — pas pour la photo."
    >
      <div className="vgrid">
        {stays.map((s) => (
          <article className="vcard tall" key={s.stopName + s.area}>
            <div className="kicker steel">{s.stopName}</div>
            <h3>{s.area}</h3>
            <p>{s.why}</p>
            {s.examples?.length ? (
              <div className="dmeta">
                {s.examples.map((e) => (
                  <Chip key={e}>{e}</Chip>
                ))}
              </div>
            ) : null}
            <div className="vprice">
              <div>
                <b>{eur(s.priceEurPerNight)}</b>
                <i>estimé · la nuit</i>
              </div>
              <Outbound href={s.searchUrl}>Disponibilités</Outbound>
            </div>
          </article>
        ))}
      </div>
    </Screen>
  );
}

/* ---------- Météo ---------- */

export function Weather({ trip }) {
  const [state, setState] = useState({ loading: true, stops: [], error: null });

  useEffect(() => {
    let alive = true;
    fetch(`/api/weather?trip=${trip.id}`)
      .then((r) => r.json())
      .then((d) => alive && setState({ loading: false, stops: d.stops || [], error: d.error || null }))
      .catch((e) => alive && setState({ loading: false, stops: [], error: e.message }));
    return () => {
      alive = false;
    };
  }, [trip.id]);

  const hasNormals = state.stops.some((s) => s.days.some((d) => d.kind === "normal"));

  return (
    <Screen
      kicker="Météo"
      title="Le ciel, étape par étape."
      intro="Données Open-Meteo. Sous seize jours, c'est une prévision ; au-delà, la moyenne des cinq dernières années à la même date."
    >
      {state.loading && <Empty>Relevé en cours…</Empty>}
      {state.error && <Empty>{state.error}</Empty>}

      {state.stops.map((s) => (
        <div className="vsec" key={s.name}>
          <h2 className="vsec-t">{s.name}</h2>
          <div className="wxstrip">
            {s.days.map((d) => {
              const cond = conditionOf(d.code);
              return (
                <div className={"wx" + (cond.icon === "rain" ? " rainy" : "")} key={d.date}>
                  <div className="d">{frDate(d.date)}</div>
                  <Icon name={cond.icon} />
                  <div className="t">
                    {d.tmax != null ? `${d.tmax}°` : "—"} <i>{d.tmin != null ? `${d.tmin}°` : ""}</i>
                  </div>
                  {/* Une prévision donne une probabilité, une normale un cumul
                      moyen : deux grandeurs différentes, deux unités. */}
                  <div className="r">
                    {d.rain != null
                      ? `${d.rain} %`
                      : d.rainMm != null
                        ? `${d.rainMm} mm`
                        : "—"}
                    {d.kind === "normal" && <span title="Moyenne des cinq dernières années"> ~</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {hasNormals && (
        <p className="vnote">
          Les valeurs suivies de « ~ » sont des moyennes des cinq dernières années à la même date, pas
          des prévisions. Elles indiquent une tendance, jamais le temps qu&apos;il fera.
        </p>
      )}
    </Screen>
  );
}

/* Reprise locale de la table de correspondance : la météo est aussi rendue
   côté client, sans repasser par le module serveur. */
function conditionOf(code) {
  if (code >= 0 && code <= 2) return { icon: "sun" };
  if (code === 3 || (code >= 45 && code <= 48)) return { icon: "cloud" };
  if (code >= 51 && code <= 67) return { icon: "rain" };
  if (code >= 71 && code <= 77) return { icon: "cloud" };
  if (code >= 80 && code <= 82) return { icon: "rain" };
  if (code >= 95) return { icon: "rain" };
  return { icon: "cloud" };
}

/* ---------- Budget ---------- */

export function Budget({ trip }) {
  const b = trip.plan.budget;
  if (!b?.lines?.length) {
    return (
      <Screen kicker="Budget" title="Aucun budget.">
        <Empty>Le budget n&apos;a pas pu être établi.</Empty>
      </Screen>
    );
  }
  const max = Math.max(...b.lines.map((l) => l.amountEur));
  const people = Math.max(1, trip.brief.adults + trip.brief.kids);
  const confirmed = b.lines.filter((l) => l.confidence === "confirmé").length;

  return (
    <Screen
      kicker="Budget"
      title="Ce que ce voyage coûte vraiment."
      intro="Les postes marqués « confirmé » viennent d'un prix public relevé pendant la composition. Les autres sont des ordres de grandeur."
    >
      <div className="vbudget">
        <div className="lines">
          {b.lines.map((l) => (
            <div className="b-row" key={l.label}>
              <div className="b-line">
                <span className="l">
                  {l.label}
                  <Chip tone={l.confidence === "confirmé" ? "green" : "steel"}>{l.confidence}</Chip>
                </span>
                <span className="v mono">{eur(l.amountEur)}</span>
              </div>
              <div className="b-track">
                <i className="b-fill" style={{ width: `${(l.amountEur / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <aside className="vtotal">
          <div className="num">{eur(b.totalEur)}</div>
          <div className="lbl">Total du voyage</div>
          <p>
            soit ≈ {eur(Math.round(b.totalEur / people))} par personne, pour {people} voyageur
            {people > 1 ? "s" : ""}.
          </p>
          <p className="sub">
            {confirmed} poste{confirmed > 1 ? "s" : ""} sur {b.lines.length} repose
            {confirmed > 1 ? "nt" : ""} sur un prix public relevé.
          </p>
        </aside>
      </div>
    </Screen>
  );
}
