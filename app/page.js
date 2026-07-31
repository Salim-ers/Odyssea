import Navbar from "../components/Navbar";
import Stage from "../components/Stage";
import Gallery from "../components/Gallery";
import JourneyMap from "../components/JourneyMap";
import Footer from "../components/Footer";
import CookieBar from "../components/CookieBar";

export default function Home() {
  return (
    <div className="home">
      <Navbar />
      <Stage />
      <Gallery />
      <JourneyMap />
      <Footer />
      <CookieBar />
    </div>
  );
}
