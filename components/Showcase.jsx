import Link from "next/link";
import TripMap from "./TripMap";
import { kindOf, KINDS } from "../lib/kinds";
import { Icon } from "../lib/icons";

/* Vitrine de l'accueil : un vrai voyage composé, pas un exemple écrit à la
   main. Carte du trajet à gauche, programme jour par jour à droite — le même
   objet que celui qu'un utilisateur reçoit à la fin. */

const fr = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export default function Showcase({ trip, worldPath }) {
  if (!trip) return <Waiting worldPath={worldPath} />;

  const { plan, days, brief } = trip;
  const shown = days.slice(0, 3);
  const rest = days.length - shown.length;

  return (
    <section className="mapsec" id="methode">
      <div className="in">
        <div className="map-head">
          <div className="kicker gold">Un voyage réellement composé</div>
          <h2>{plan.destination.tagline}</h2>
          <p>{plan.destination.summary}</p>
        </div>

        <div className="show-grid">
          <aside className="show-side">
            <TripMap stops={plan.stops} worldPath={worldPath} />

            <div className="card" style={{ marginTop: 18 }}>
              <div className="kicker steel">Le parcours</div>
              <ol className="show-stops">
                {plan.stops.map((s, i) => (
                  <li key={s.name}>
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <span>
                      <strong>{s.name}</strong>
                      {s.nights} nuit{s.nights > 1 ? "s" : ""} · {s.region}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="map-legend" style={{ marginTop: 16 }}>
                <span>
                  {fr(brief.dep)} → {fr(brief.ret)}
                </span>
                <span>{days.length} journées écrites</span>
              </div>
            </div>

            <ul className="kindkey" style={{ marginTop: 16 }}>
              {Object.entries(KINDS).map(([k, v]) => (
                <li key={k} style={{ "--kc": v.c }}>
                  <Icon name={v.icon} />
                  {v.label}
                </li>
              ))}
            </ul>

            {plan.sources?.length ? (
              <p className="map-credit">
                Composé à partir de {plan.sources.length} sources consultées en direct.
                Fond de carte © Natural Earth.
              </p>
            ) : (
              <p className="map-credit">Fond de carte © Natural Earth.</p>
            )}
          </aside>

          <div className="map-side">
            {shown.map((d) => (
              <article className="dayblock" key={d.n}>
                <header className="dhead">
                  <span className="dnum">Jour {d.n}</span>
                  <h4>{d.title}</h4>
                  <span className="ddate">{fr(d.date)}</span>
                </header>
                {d.items.slice(0, 5).map((it, i) => {
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
                      </div>
                    </div>
                  );
                })}
              </article>
            ))}

            <div className="show-more">
              <p>
                {rest > 0
                  ? `Et ${rest} journées de plus, avec les vols, l'hébergement, le budget et les pièges de l'itinéraire.`
                  : "Avec les vols, l'hébergement, le budget et les pièges de l'itinéraire."}
              </p>
              <Link className="btn btn-gold" href="/parcours">
                <Icon name="spark" />
                Composer le mien
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Tant qu'aucun voyage n'a été composé, la section montre ce qu'elle
   produira : la carte du monde, et ce qu'on obtient à l'arrivée. */
function Waiting({ worldPath }) {
  const teaser = [
    ["map", "La carte de votre trajet", "Chaque étape située, chaque trajet compté."],
    ["list", "Chaque journée, heure par heure", "Lieux réels, horaires vérifiés, et la raison d'être de chaque moment."],
    ["plane", "Les vols et l'hébergement", "Les compagnies qui desservent l'axe, le quartier où loger, les ordres de prix."],
    ["shield", "Les pièges de l'itinéraire", "Marges trop courtes, journées trop chargées, musées fermés ce jour-là."],
  ];

  return (
    <section className="mapsec" id="methode">
      <div className="in">
        <div className="map-head">
          <div className="kicker gold">Ce qu'Odyssea compose</div>
          <h2>Un voyage entier, écrit pour vous.</h2>
          <p>
            Pas un modèle rempli : une recherche menée sur le web au moment où vous la demandez,
            puis un itinéraire écrit heure par heure et vérifié.
          </p>
        </div>

        <div className="show-grid">
          <aside className="show-side">
            <TripMap
              worldPath={worldPath}
              stops={[
                { name: "Paris", lat: 48.86, lon: 2.35 },
                { name: "Lisbonne", lat: 38.72, lon: -9.14 },
                { name: "Marrakech", lat: 31.63, lon: -8.0 },
              ]}
            />
            <p className="map-credit">Fond de carte © Natural Earth.</p>
          </aside>

          <div className="map-side">
            {teaser.map(([icon, title, detail]) => (
              <article className="show-teaser" key={title}>
                <span className="ic">
                  <Icon name={icon} />
                </span>
                <div>
                  <b>{title}</b>
                  <span>{detail}</span>
                </div>
              </article>
            ))}
            <div className="show-more">
              <p>
                Cette vitrine affichera votre premier voyage composé, tel qu'il sort de la
                génération.
              </p>
              <Link className="btn btn-gold" href="/parcours">
                <Icon name="spark" />
                Composer mon voyage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
