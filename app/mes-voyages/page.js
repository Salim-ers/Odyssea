import Link from "next/link";
import { redirect } from "next/navigation";
import Wordmark from "../../components/Wordmark";
import LogoutButton from "../../components/LogoutButton";
import { currentUser } from "../../lib/auth";
import { listTrips } from "../../lib/trips";
import { Icon } from "../../lib/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes voyages — Odyssea" };

const fr = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const STATUS = {
  pending: ["En attente", "steel"],
  planning: ["Plan écrit", "steel"],
  building: ["En composition", "gold"],
  ready: ["Prêt", "green"],
  failed: ["Interrompu", "red"],
};

export default async function MesVoyagesPage() {
  const user = await currentUser();
  if (!user) redirect("/compte");

  let trips = [];
  let error = null;
  try {
    trips = await listTrips(user.id);
  } catch (e) {
    error = e.message;
  }

  return (
    <main className="app">
      <div className="app-bar">
        <Wordmark />
        <div className="right">
          <span className="saved">{user.name}</span>
          <LogoutButton />
          <Link className="btn btn-gold small" href="/parcours">
            <Icon name="spark" />
            Nouveau voyage
          </Link>
        </div>
      </div>

      <section className="screen">
        <header className="shead">
          <div className="kicker steel">Votre bibliothèque</div>
          <h1>Mes voyages</h1>
          <p>Chaque voyage reste accessible ici, avec son itinéraire, son budget et ses sources.</p>
        </header>

        {error && (
          <div className="card soft" style={{ color: "var(--muted)" }}>
            Base de données indisponible : {error}
          </div>
        )}

        {!error && !trips.length && (
          <div className="card soft" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "var(--muted)" }}>Vous n&apos;avez composé aucun voyage pour l&apos;instant.</p>
            <Link className="btn btn-gold" href="/parcours" style={{ marginTop: 18 }}>
              Composer mon premier voyage
            </Link>
          </div>
        )}

        <div className="photogrid">
          {trips.map((t) => {
            const [label, tone] = STATUS[t.status] || STATUS.pending;
            return (
              <Link className="pcard" key={t.id} href={`/voyage/${t.id}`}>
                <div className="body">
                  <div className="kicker steel">
                    {fr(t.brief.dep)} → {fr(t.brief.ret)}
                  </div>
                  <h3 style={{ marginTop: 6 }}>{t.plan?.destination?.name || t.brief.dest}</h3>
                  <div className="type">
                    {t.plan?.destination?.tagline || "Composition en attente"}
                  </div>
                  <div className="tags">
                    <span className={"chip " + tone}>{label}</span>
                    <span className="chip">
                      {t.brief.adults + t.brief.kids} voyageur
                      {t.brief.adults + t.brief.kids > 1 ? "s" : ""}
                    </span>
                    {t.days.length ? <span className="chip">{t.days.length} journées</span> : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
