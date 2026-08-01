import Link from "next/link";
import { notFound } from "next/navigation";
import TripApp from "../../../components/trip/TripApp";
import { getTrip, dayCount } from "../../../lib/trips";
import { currentUser } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const trip = await getTrip(params.id).catch(() => null);
  const name = trip?.plan?.destination?.name || trip?.brief?.dest;
  return { title: name ? `${name} — Odyssea` : "Votre voyage — Odyssea" };
}

export default async function VoyagePage({ params }) {
  let trip;
  try {
    trip = await getTrip(params.id);
  } catch (e) {
    return (
      <Fallback title="Base de données indisponible">
        {e.message}. Renseignez DATABASE_URL, ou lancez en local sans base : SQLite prend le relais.
      </Fallback>
    );
  }
  if (!trip) notFound();

  /* Rattaché à un compte, le voyage n'est lisible que par son auteur. */
  if (trip.userId) {
    const user = await currentUser();
    if (user?.id !== trip.userId) notFound();
  }

  if (trip.status === "failed") {
    return (
      <Fallback title="La composition s'est interrompue">
        {trip.error || "Une erreur est survenue."} Vous pouvez la relancer depuis le parcours.
      </Fallback>
    );
  }

  if (!trip.plan || trip.days.length < dayCount(trip.brief)) {
    return (
      <Fallback title="Ce voyage est encore en composition">
        {trip.plan
          ? `${trip.days.length} journée(s) sur ${dayCount(trip.brief)} déjà écrites.`
          : "La recherche vient de commencer."}{" "}
        Reprenez la composition pour aller au bout.
        <Link className="btn btn-gold" href={`/parcours?resume=${trip.id}`} style={{ marginTop: 18 }}>
          Reprendre la composition
        </Link>
      </Fallback>
    );
  }

  return <TripApp trip={{ ...trip, totalDays: dayCount(trip.brief) }} />;
}

function Fallback({ title, children }) {
  return (
    <main className="app" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div className="card" style={{ maxWidth: 520, textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--sora)", fontWeight: 300, fontSize: 26 }}>{title}</h1>
        <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>{children}</p>
        <div style={{ marginTop: 20 }}>
          <Link className="btn btn-line" href="/">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
