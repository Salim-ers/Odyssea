import Navbar from "../components/Navbar";
import Stage from "../components/Stage";
import Gallery from "../components/Gallery";
import Showcase from "../components/Showcase";
import Footer from "../components/Footer";
import CookieBar from "../components/CookieBar";
import { getShowcase } from "../lib/trips";

export const dynamic = "force-dynamic";

export default async function Home() {
  /* La vitrine est un vrai voyage, généré une fois et mis en cache. Si elle
     n'existe pas encore (ou si la base n'est pas là), la section le dit. */
  let trip = null;
  try {
    const cached = await getShowcase("accueil");
    trip = cached?.trip ?? null;
  } catch {
    trip = null;
  }

  return (
    <div className="home">
      <Navbar />
      <Stage />
      <Gallery />
      <Showcase trip={trip} />
      <Footer />
      <CookieBar />
    </div>
  );
}
