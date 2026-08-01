"use client";

/* Les écrans du voyage.

   Même langage visuel que l'exemple de l'accueil : la carte à tuiles, les
   escales en pastilles, le programme en journées. Ce qu'on a montré avant de
   composer est exactement ce qu'on reçoit après — c'est la promesse tenue.

   Tout ce qui s'affiche ici vient de la génération : aucune donnée n'est
   écrite en dur, et ce qui manque se dit plutôt que de se combler. */

import { useEffect, useState } from "react";
import TileMap from "../TileMap";
import { Icon, Chip } from "../../lib/icons";
import { kindOf, KINDS } from "../../lib/kinds";
import { eur, frDate, frDateLong, nights } from "../../lib/store";
import { showCost, usd, summary as usageSummary, detail as usageDetail, PHASE_LABELS } from "../../lib/usage";

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

const stayNights = (s) => `${s.nights} nuit${s.nights > 1 ? "s" : ""}`;

/* ---------- Aperçu ---------- */

export function Overview({ trip, setTab }) {
  const { plan, brief, days } = trip;
  const [stop, setStop] = useState(plan.stops[0]?.name);
  const n = nights(brief.dep, brief.ret);
  const people = Math.max(1, brief.adults + brief.kids);
  const perPerson = plan.budget?.totalEur ? Math.round(plan.budget.totalEur / people) : null;
  const score = plan.season?.score ?? null;

  return (
    <section className="screen">
      <header className="vhead">
        <div className="kicker gold">
          {plan.destination.country} · {n} nuit{n > 1 ? "s" : ""}
        </div>
        <h1>{plan.destination.tagline}</h1>
        <p>{plan.destination.summary}</p>

        <div className="vfacts">
          <div>
            <span className="k">Dates</span>
            <span className="v">{frDate(brief.dep)} → {frDate(brief.ret)}</span>
          </div>
          <div>
            <span className="k">Parcours</span>
            <span className="v">{plan.stops.map((s) => s.name).join(" · ")}</span>
          </div>
          <div>
            <span className="k">Équipage</span>
            <span className="v">
              {brief.adults} adulte{brief.adults > 1 ? "s" : ""}
              {brief.kids ? ` · ${brief.kids} enfant${brief.kids > 1 ? "s" : ""}` : ""}
            </span>
          </div>
          {plan.budget?.totalEur ? (
            <div>
              <span className="k">Budget</span>
              <span className="v">{eur(plan.budget.totalEur)}</span>
            </div>
          ) : null}
        </div>
      </header>

      <div className="vmap-row">
        <div className="map-wrap">
          <TileMap stops={plan.stops} active={stop} />
          <div className="map-legend">
            <span>
              {plan.stops.length} escale{plan.stops.length > 1 ? "s" : ""}
            </span>
            <span>
              {days.length} journée{days.length > 1 ? "s" : ""} écrite{days.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="map-credit">Fond de carte © OpenStreetMap.</p>
        </div>

        <div className="vside">
          {/* La saison d'abord : c'est ce qui peut remettre les dates en cause. */}
          {score != null && (
            <div className="vseason">
              <div className="ring">
                <svg width="86" height="86" viewBox="0 0 86 86">
                  <circle cx="43" cy="43" r="36" className="bg" fill="none" strokeWidth="5" />
                  <circle cx="43" cy="43" r="36" className="fg" fill="none" strokeWidth="5"
                    strokeLinecap="round" strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 * (1 - score / 100)} />
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
                <span>{stayNights(s)}</span>
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

          <div className="vacts">
            <button className="btn btn-gold" onClick={() => setTab("itin")}>
              <Icon name="list" />
              Voir l&apos;itinéraire
            </button>
            <button className="btn btn-line" onClick={() => setTab("pratique")}>
              Le pratique
            </button>
          </div>
        </div>
      </div>

      {plan.advice?.length ? (
        <div className="vsec">
          <h2 className="vsec-t">Ce qu&apos;il faut savoir avant de partir</h2>
          <div className="vgrid">
            {plan.advice.map((a) => (
              <article className="vcard" key={a.title}>
                <b>{a.title}</b>
                <p>{a.detail}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {plan.sources?.length ? (
        <div className="vsources">
          <div className="kicker steel">
            {plan.sources.length} source{plan.sources.length > 1 ? "s" : ""} consultée
            {plan.sources.length > 1 ? "s" : ""} pendant la composition
          </div>
          <ul>
            {plan.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {perPerson ? (
        <p className="vnote">
          Soit environ {eur(perPerson)} par personne. Les montants marqués « estimé » n&apos;ont pas été
          relevés sur une page de réservation : vérifiez-les avant de vous engager.
        </p>
      ) : null}

      {/* Ce que la composition de ce voyage a coûté en appels modèle. Relevé,
          pas estimé : c'est la somme des `usage` renvoyés par l'API. */}
      {showCost() && trip.usage?.total ? (
        <details className="vspent">
          <summary>
            <span>Composition de ce voyage</span>
            <b className="mono">{usd(trip.usage.total.costUsd)}</b>
          </summary>
          <p className="mono">{usageSummary(trip.usage.total)}</p>
          <ul>
            {Object.entries(trip.usage.phases || {}).map(([k, u]) => (
              <li key={k}>
                <span>{PHASE_LABELS[k] || k}</span>
                <b className="mono">{usd(u.costUsd)}</b>
                <i className="mono">{usageDetail(u)}</i>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

/* ---------- Itinéraire ---------- */

export function Itinerary({ trip, day, setDay }) {
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

  return (
    <Screen
      kicker="Itinéraire"
      title={`${trip.days.length} journées, heure par heure.`}
      intro="Chaque étape est justifiée. Les horaires et les fermetures ont été vérifiés au moment de la composition — reconfirmez-les la veille."
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
        </header>

        {d.items.map((it, i) => {
          const kind = kindOf(it.kind);
          return (
            <div className="dayline" key={i} style={{ "--kc": kind.c }}>
              <span className="t">{it.time}</span>
              <span className="kmark" aria-hidden="true">
                <Icon name={kind.icon} />
              </span>
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
                  <div className="r">
                    {d.rain != null ? `${d.rain} %` : "—"}
                    {d.kind === "normal" && <span title="Moyenne des 5 dernières années"> ~</span>}
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

/* ---------- Pratique ---------- */

export function Practical({ trip }) {
  const p = trip.practical;
  if (!p) {
    return (
      <Screen kicker="Pratique" title="Volet pratique en cours.">
        <Empty>Il sera disponible dès la fin de la composition.</Empty>
      </Screen>
    );
  }

  return (
    <Screen
      kicker="Pratique"
      title="Avant de partir, et sur place."
      intro="Les démarches concernent un voyageur de nationalité française. Vérifiez toujours auprès de la source officielle avant de réserver."
    >
      {p.watchouts?.length ? (
        <div className="vsec">
          <h2 className="vsec-t">Ce qui coince dans cet itinéraire</h2>
          <div className="vlist">
            {p.watchouts.map((w) => (
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

      {p.transport?.options?.length ? (
        <div className="vsec">
          <h2 className="vsec-t">Se déplacer sur place</h2>
          <p className="vsec-p">{p.transport.verdict}</p>
          <div className="vgrid">
            {p.transport.options.map((o) => (
              <article className={"vcard tall" + (o.recommended ? " best" : "")} key={o.mode}>
                {o.recommended && <span className="best-tag">Conseillé</span>}
                <h3>{o.mode}</h3>
                <div className="vp mono">{o.priceEur ? `≈ ${eur(o.priceEur)}` : "—"}</div>
                <ul className="prosl">
                  <li className="pro"><Icon name="check" />{o.pros}</li>
                  <li className="con"><Icon name="alert" />{o.cons}</li>
                </ul>
              </article>
            ))}
          </div>
          {p.transport.warnings?.length ? (
            <div className="vaside col">
              {p.transport.warnings.map((w) => (
                <p key={w.title}>
                  <Icon name="alert" />
                  <span><b>{w.title}</b> — {w.detail}</span>
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="vsec vtwo">
        <div>
          <h2 className="vsec-t">Check-list avant le départ</h2>
          {p.checklist?.map((g) => (
            <article className="vcard" key={g.group}>
              <div className="kicker steel">{g.group}</div>
              <ul className="oklist">
                {g.items.map((it) => (
                  <li key={it}>
                    <Icon name="check" />
                    {it}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div>
          <h2 className="vsec-t">La valise</h2>
          {p.packing?.map((g) => (
            <article className="vcard" key={g.group}>
              <div className="kicker steel">{g.group}</div>
              {g.items.map((it) => (
                <div className="packrow" key={it.label}>
                  <span className="lbl">{it.label}</span>
                  <span className="why">{it.why}</span>
                </div>
              ))}
            </article>
          ))}
        </div>
      </div>
    </Screen>
  );
}
