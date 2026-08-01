import "./globals.css";
import { OdysseaProvider } from "../lib/store";
import Toasts from "../components/Toasts";
import ModalHost from "../components/ModalHost";

export const metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  title: "Odyssea — Le voyage sur mesure, sans les semaines de préparation",
  description: "Dites-nous où, quand et avec qui : Odyssea compose les vols, les hébergements et chaque journée heure par heure. Planifiez. Explorez. Vivez.",
  icons: { icon: "/assets/odyssea-mark.png" },
  openGraph: {
    title: "Odyssea — Le voyage sur mesure, sans les semaines de préparation",
    description: "Vols, hébergements et journées composés heure par heure — vous gardez la main jusqu'au départ.",
    images: ["/assets/odyssea-logo.png"],
  },
};

export const viewport = { themeColor: "#03141A" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* Polices via CDN. Pour les auto-héberger (recommandé en production) :
            import { Sora, DM_Sans } from "next/font/google" — voir README. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,300..700&family=Cormorant+Garamond:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <OdysseaProvider>
          {children}
          <Toasts />
          <ModalHost />
        </OdysseaProvider>
      </body>
    </html>
  );
}
