import Link from "next/link";
import { kindOf, KINDS } from "../lib/kinds";
import { Icon } from "../lib/icons";

/* Vitrine de l'accueil : un vrai voyage composé, pas un exemple écrit à la
   main. Il est généré une fois, mis en cache côté serveur, et rendu ici tel
   qu'un utilisateur le verrait. */

const fr = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export default function Showcase({ trip }) {
  if (!trip) {
    return (
      <section className="mapsec" id="methode">
        <div className="in">
          <div className="map-head">
            <div className="kicker gold">Un voyage composé</div>
            <h2>Voyez ce qu&apos;Odyssea produit.</h2>
            <p>
              La vitrine se compose au premier passage. En attendant, lancez la vôtre : donnez une
              destination, des dates, et regardez.
            </p>
            <Link className="btn btn-gold" href="/parcours" style={{ marginTop: 22 }}>
              <Icon name="spark" />
              Composer mon voyage
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { plan, days, brief } = trip;
  const shown = days.slice(0, 3);

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
            <div className="card">
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
              </p>
            ) : null}
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
                Et {days.length - shown.length} journées de plus, avec les vols, l&apos;hébergement, le
                budget et les pièges de l&apos;itinéraire.
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
