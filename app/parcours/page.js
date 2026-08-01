import { Suspense } from "react";
import Onboarding from "../../components/Onboarding";

export const metadata = { title: "Composer mon voyage — Odyssea" };

/* Le parcours lit ?resume=… pour reprendre une composition interrompue.
   Next impose une frontière de suspense autour de la lecture des paramètres
   d'URL, sinon toute la page bascule en rendu dynamique. */
export default function ParcoursPage() {
  return (
    <Suspense fallback={null}>
      <Onboarding />
    </Suspense>
  );
}
