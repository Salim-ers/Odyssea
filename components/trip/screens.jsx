"use client";

/* Les écrans du voyage. Tout ce qui s'affiche ici vient de la génération :
   aucune donnée n'est écrite en dur, et ce qui manque se dit plutôt que de
   se combler. */

import { useEffect, useState } from "react";
import { Icon, Chip } from "../../lib/icons";
import { kindOf } from "../../lib/kinds";
import { eur, frDate, frDateLong, nights } from "../../lib/store";

export function Screen({ kicker, title, intro, children }) {
  return (
    <section className="screen">
      <header className="shead">
        <div className="kicker steel">{kicker}</div>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return (
    <div className="card soft" style={{ textAlign: "center", color: "var(--muted)" }}>
      {children}
    </div>
  );
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

/* ---------- Aperçu ---------- */

export function Overview({ trip, setTab }) {
  const { plan, brief, days } = trip;
  const n = nights(brief.dep, brief.ret);
  const perPerson = plan.budget?.totalEur
    ? Math.round(plan.budget.totalEur / (brief.adults + brief.kids))
    : null;

  return (
    <>
      <header className="dash-band">
        <span className="veil" />
        <div className="dash-chips">
          <div>
            <span className="k">Dates</span>
            <span className="v">
              {frDate(brief.dep)} → {frDate(brief.ret)}
            </span>
          </div>
          <div>
            <span className="k">Parcours</span>
            <span className="v">{plan.stops.map((s) => s.name).join(" · ")}</span>
          </div>
          <div>
            <span className="k">Saison</span>
            <span className="v">{plan.season?.verdict}</span>
          </div>
        </div>
      </header>

      <div className="dash-over">
        <div className="dash-card">
          <div className="lead">
            <div className="kicker steel">
              {plan.destination.country} · {n} nuits
            </div>
            <h1>{plan.destination.tagline}</h1>
            <p style={{ marginTop: 14, color: "var(--muted)", maxWidth: 620 }}>
              {plan.destination.summary}
            </p>
            <div className="sumchips">
              <Chip dot>
                {days.length} journée{days.length > 1 ? "s" : ""} détaillée
                {days.length > 1 ? "s" : ""}
              </Chip>
              <Chip dot>
                {brief.adults} adulte{brief.adults > 1 ? "s" : ""}
                {brief.kids ? ` · ${brief.kids} enfant${brief.kids > 1 ? "s" : ""}` : ""}
              </Chip>
              <Chip dot>{plan.stops.length} étapes</Chip>
              {plan.budget?.totalEur ? <Chip dot>{eur(plan.budget.totalEur)} au total</Chip> : null}
            </div>
            <div className="acts" style={{ marginTop: 22 }}>
              <button className="btn btn-navy" onClick={() => setTab("itin")}>
                <Icon name="list" />
                Voir l&apos;itinéraire
              </button>
              <button className="btn btn-line" onClick={() => setTab("pratique")}>
                Le pratique
              </button>
            </div>
          </div>

          <div className="scorecard">
            <div className="top">
              <div className="ringwrap">
                <svg width="74" height="74">
                  <circle cx="37" cy="37" r="32" fill="none" stroke="rgba(252,251,248,.14)" strokeWidth="5" />
                  <circle
                    cx="37"
                    cy="37"
                    r="32"
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 * (1 - (plan.season?.score ?? 0) / 100)}
                  />
                </svg>
                <span className="n">{plan.season?.score ?? "—"}</span>
              </div>
              <div>
                <b>Vos dates</b>
                <div className="sub">{plan.season?.verdict}</div>
              </div>
            </div>
            <p className="sub" style={{ marginTop: 16 }}>
              {plan.season?.detail}
            </p>
          </div>
        </div>
      </div>

      <Screen kicker="Le parcours" title="Les étapes, et pourquoi elles.">
        <div className="cardnav">
          {plan.stops.map((s, i) => (
            <article className="card lift" key={s.name}>
              <b>
                <Icon name="map" />
                {String(i + 1).padStart(2, "0")} · {s.name}
              </b>
              <p style={{ marginTop: 8 }}>
                {s.region} · {s.nights} nuit{s.nights > 1 ? "s" : ""}
              </p>
              <p style={{ marginTop: 10, color: "var(--muted)" }}>{s.why}</p>
            </article>
          ))}
        </div>

        {plan.advice?.length ? (
          <div className="grid2" style={{ marginTop: 26 }}>
            {plan.advice.map((a) => (
              <article className="card" key={a.title}>
                <b style={{ fontFamily: "var(--sora)", fontSize: 15 }}>{a.title}</b>
                <p style={{ marginTop: 8, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
                  {a.detail}
                </p>
              </article>
            ))}
          </div>
        ) : null}

        {plan.sources?.length ? (
          <div className="sources">
            <div className="kicker steel">Sources consultées</div>
            <ul>
              {plan.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {perPerson ? (
          <p className="photo-note" style={{ marginTop: 18 }}>
            Soit environ {eur(perPerson)} par personne. Les montants marqués « estimé » n&apos;ont pas
            été relevés sur une page de réservation : vérifiez-les avant de vous engager.
          </p>
        ) : null}
      </Screen>
    </>
  );
}

/* ---------- Itinéraire ---------- */

export function Itinerary({ trip, day, setDay }) {
  const d = trip.days.find((x) => x.n === day) || trip.days[0];
  if (!d) return <Screen kicker="Itinéraire" title="Aucune journée."><Empty>Le programme n&apos;a pas encore été composé.</Empty></Screen>;

  return (
    <Screen
      kicker="Itinéraire"
      title={`${trip.days.length} journées, heure par heure.`}
      intro="Chaque étape est justifiée. Les horaires et les fermetures ont été vérifiés au moment de la composition — reconfirmez-les la veille."
    >
      <div className="daytabs" role="tablist">
        {trip.days.map((x) => (
          <button
            key={x.n}
            className={"daytab" + (x.n === day ? " on" : "")}
            role="tab"
            aria-selected={x.n === day}
            onClick={() => setDay(x.n)}
          >
            <span className="d">J{x.n} · {frDate(x.date)}</span>
            <span className="c">{x.stopName}</span>
          </button>
        ))}
      </div>

      <div className="dayhead">
        <div>
          <h2>{d.title}</h2>
          <span className="mono">
            {d.stopName} · {frDateLong(d.date)}
          </span>
        </div>
      </div>

      <div className="tl">
        {d.items.map((it, i) => {
          const kind = kindOf(it.kind);
          return (
            <article className={"tl-item k-" + it.kind} key={i} style={{ "--kc": kind.c }}>
              <div className="tl-top">
                <span className="t">{it.time}</span>
                <b>{it.title}</b>
                <span className="klabel">{kind.label}</span>
              </div>
              {it.detail && <div className="tl-sub">{it.detail}</div>}
              <div className="tl-meta">
                {it.durationMin > 0 && (
                  <Chip icon="clock">
                    {it.durationMin >= 60
                      ? `${Math.floor(it.durationMin / 60)} h${it.durationMin % 60 ? ` ${it.durationMin % 60}` : ""}`
                      : `${it.durationMin} min`}
                  </Chip>
                )}
                {it.costEur > 0 && <Chip icon="wallet">{eur(it.costEur)} / pers.</Chip>}
              </div>
              {it.why && (
                <div className="tl-why">
                  <b>Pourquoi c&apos;est là</b>
                  {it.why}
                </div>
              )}
              {it.bookingUrl && (
                <div className="acts">
                  <Outbound href={it.bookingUrl}>Réserver ou en savoir plus</Outbound>
                </div>
              )}
            </article>
          );
        })}
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
      {f.options.map((o, i) => (
        <article className="card lift flight" key={o.airline + i}>
          <div className="logo" style={{ background: "var(--navy)" }}>
            {o.airline.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="alrow">
              {o.airline}
              {i === 0 && (
                <Chip tone="gold" icon="spark">
                  La plus pertinente
                </Chip>
              )}
            </div>
            <div className="times">
              <span className="tt">{o.route}</span>
            </div>
            <div className="fmeta">
              <Chip icon="clock">{o.duration}</Chip>
              <Chip icon="plane">{o.stops}</Chip>
            </div>
            {o.note && <p className="note" style={{ marginTop: 10 }}>{o.note}</p>}
          </div>
          <div className="pcol">
            <div className="p">{eur(o.priceEur)}</div>
            <div className="pp">estimé · aller-retour / pers.</div>
          </div>
        </article>
      ))}

      <div className="card soft askrow" style={{ marginTop: 8 }}>
        <Icon name="info" />
        <span>
          Odyssea ne vend pas de billets. Ces prix sont des ordres de grandeur relevés à la
          composition — ouvrez la recherche pour les tarifs et disponibilités du jour.
        </span>
        <Outbound href={f.searchUrl}>Ouvrir la recherche de vols</Outbound>
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
      <div className="photogrid">
        {stays.map((s) => (
          <article className="pcard" key={s.stopName + s.area}>
            <div className="body">
              <div className="kicker steel">{s.stopName}</div>
              <h3 style={{ marginTop: 6 }}>{s.area}</h3>
              <div className="type">{s.why}</div>
              {s.examples?.length ? (
                <div className="tags">
                  {s.examples.map((e) => (
                    <Chip key={e}>{e}</Chip>
                  ))}
                </div>
              ) : null}
              <div className="pricerow">
                <div>
                  <div className="p">{eur(s.priceEurPerNight)}</div>
                  <div className="pn">estimé · la nuit</div>
                </div>
                <Outbound href={s.searchUrl}>Voir les disponibilités</Outbound>
              </div>
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
        <div key={s.name} style={{ marginBottom: 26 }}>
          <div className="kicker steel" style={{ marginBottom: 10 }}>
            {s.name}
          </div>
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
        <p className="photo-note">
          Les valeurs suivies de « ~ » sont des moyennes des cinq dernières années à la même date,
          pas des prévisions. Elles indiquent une tendance, jamais le temps qu&apos;il fera.
        </p>
      )}
    </Screen>
  );
}

/* Reprise locale de la table de correspondance : la météo est aussi rendue
   côté client, sans repasser par le module serveur. */
function conditionOf(code) {
  if (code === 0 || code === 1) return { icon: "sun" };
  if (code === 2) return { icon: "sun" };
  if (code === 3) return { icon: "cloud" };
  if (code >= 45 && code <= 48) return { icon: "cloud" };
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
  const people = trip.brief.adults + trip.brief.kids;

  return (
    <Screen
      kicker="Budget"
      title="Ce que ce voyage coûte vraiment."
      intro="Les postes marqués « confirmé » viennent d'un prix public relevé pendant la composition. Les autres sont des ordres de grandeur."
    >
      <div className="grid2">
        <div className="card">
          {b.lines.map((l) => (
            <div className="b-row" key={l.label}>
              <div className="b-line">
                <span className="l">
                  {l.label}
                  <Chip tone={l.confidence === "confirmé" ? "green" : "steel"}>{l.confidence}</Chip>
                </span>
                <span className="v">{eur(l.amountEur)}</span>
              </div>
              <div className="b-track">
                <i className="b-fill" style={{ width: `${(l.amountEur / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card navy-card b-total">
          <div className="t-num">{eur(b.totalEur)}</div>
          <div className="t-label">Total du voyage</div>
          <div className="pp">
            soit ≈ {eur(Math.round(b.totalEur / people))} par personne, pour {people} voyageur
            {people > 1 ? "s" : ""}
          </div>
        </div>
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
        <>
          <div className="kicker gold" style={{ marginBottom: 12 }}>
            Ce qui coince dans cet itinéraire
          </div>
          {p.watchouts.map((w) => (
            <article className={"card regret" + (w.severity === "fort" ? "" : " soft")} key={w.title}>
              <span className="imp">Impact {w.severity}</span>
              <b>{w.title}</b>
              <p>{w.detail}</p>
              <div className="rec">
                <b>Correctif</b> {w.fix}
              </div>
            </article>
          ))}
        </>
      ) : null}

      {p.transport?.options?.length ? (
        <>
          <div className="kicker steel" style={{ margin: "30px 0 12px" }}>
            Se déplacer sur place — {p.transport.verdict}
          </div>
          <div className="locgrid">
            {p.transport.options.map((o) => (
              <article className={"card loc-card" + (o.recommended ? " best" : "")} key={o.mode}>
                <div className="lic">
                  <Icon name="car" />
                </div>
                <h3>{o.mode}</h3>
                <div className="p">{o.priceEur ? `≈ ${eur(o.priceEur)}` : "—"}</div>
                <ul>
                  <li>
                    <Icon name="check" />
                    {o.pros}
                  </li>
                  <li>
                    <Icon name="alert" />
                    {o.cons}
                  </li>
                </ul>
                {o.recommended && (
                  <div className="reco">
                    <Chip tone="gold" icon="spark">
                      Conseillé pour ce voyage
                    </Chip>
                  </div>
                )}
              </article>
            ))}
          </div>
          {p.transport.warnings?.length ? (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="warnlist">
                {p.transport.warnings.map((w) => (
                  <div className="w" key={w.title}>
                    <Icon name="alert" />
                    <span>
                      <b>{w.title}</b> — {w.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="grid2" style={{ marginTop: 30 }}>
        <div>
          <div className="kicker steel" style={{ marginBottom: 12 }}>
            Check-list avant le départ
          </div>
          {p.checklist?.map((g) => (
            <article className="card" key={g.group} style={{ marginBottom: 14 }}>
              <div className="kicker" style={{ marginBottom: 8 }}>
                {g.group.toUpperCase()}
              </div>
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
          <div className="kicker steel" style={{ marginBottom: 12 }}>
            La valise
          </div>
          {p.packing?.map((g) => (
            <article className="card" key={g.group} style={{ marginBottom: 14 }}>
              <div className="kicker" style={{ marginBottom: 8 }}>
                {g.group.toUpperCase()}
              </div>
              {g.items.map((it) => (
                <div className="v-item" key={it.label}>
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
