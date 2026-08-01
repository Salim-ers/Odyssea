import fs from "node:fs/promises";
import path from "node:path";
import Navbar from "../components/Navbar";
import Stage from "../components/Stage";
import Gallery from "../components/Gallery";
import Showcase from "../components/Showcase";
import Footer from "../components/Footer";
import CookieBar from "../components/CookieBar";
import { getShowcase } from "../lib/trips";

export const dynamic = "force-dynamic";

/* Le fond de carte est lu une fois au démarrage du serveur : la vitrine est
   rendue côté serveur, complète, sans rien télécharger côté navigateur. */
let worldPromise = null;
function world() {
  if (!worldPromise) {
    worldPromise = fs
      .readFile(path.join(process.cwd(), "public", "data", "world-land.json"), "utf8")
      .then((raw) => JSON.parse(raw).d)
      .catch(() => null);
  }
  return worldPromise;
}

export default async function Home() {
  /* La vitrine prend le voyage désigné, sinon le dernier composé. */
  const [cached, worldPath] = await Promise.all([
    getShowcase("accueil").catch(() => null),
    world(),
  ]);

  return (
    <div className="home">
      <Navbar />
      <Stage />
      <Gallery />
      <Showcase trip={cached?.trip ?? null} worldPath={worldPath} />
      <Footer />
      <CookieBar />
    </div>
  );
}
