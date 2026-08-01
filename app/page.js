import Navbar from "../components/Navbar";
import Stage from "../components/Stage";
import Gallery from "../components/Gallery";
import Showcase from "../components/Showcase";
import Footer from "../components/Footer";
import CookieBar from "../components/CookieBar";
import { getShowcase } from "../lib/trips";

export const dynamic = "force-dynamic";

export default async function Home() {
  /* La vitrine ne montre qu'un voyage explicitement désigné ; sinon,
     l'exemple tient sa place. */
  const cached = await getShowcase("accueil").catch(() => null);

  return (
    <div className="home">
      <Navbar />
      <Stage />
      <Gallery />
      <Showcase trip={cached?.trip ?? null} />
      <Footer />
      <CookieBar />
    </div>
  );
}
