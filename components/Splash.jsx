/* L'écran d'attente.

   L'emblème d'Odyssea porte déjà un rivage : on le prolonge, et la mer monte
   sous lui. Trois houles se croisent à des vitesses différentes — c'est ce
   décalage qui donne l'impression d'une eau vivante plutôt que d'un motif qui
   défile.

   Rien à charger : un PNG déjà en cache et des tracés SVG. Aucun script non
   plus — le composant est rendu côté serveur, ce qui est la moindre des
   choses pour un écran censé s'afficher avant tout le reste.

   Il apparaît avec un retard volontaire : une navigation instantanée ne doit
   pas provoquer un éclair. */

/* Une période de houle, répétée trois fois. Le groupe se décale d'exactement
   une période : la boucle est donc invisible. */
const WAVE =
  "M0 46 C 120 8, 360 84, 480 46 C 600 8, 840 84, 960 46 C 1080 8, 1320 84, 1440 46 L1440 140 L0 140 Z";

function Houle({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 1440 140"
      preserveAspectRatio="none" aria-hidden="true">
      <g>
        <path d={WAVE} />
      </g>
    </svg>
  );
}

export default function Splash({ note = "Un instant" }) {
  return (
    <div className="splash" role="status" aria-live="polite">
      <div className="splash-sky" aria-hidden="true" />
      <div className="splash-sun" aria-hidden="true" />

      <div className="splash-mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/odyssea-logo-white.png" alt="" aria-hidden="true" />
        <span className="splash-word" aria-hidden="true">
          <span className="l">Odysse</span>
          <span className="v">V</span>
        </span>
        <span className="splash-note">{note}</span>
        <span className="sr-only">Chargement en cours</span>
      </div>

      <div className="splash-sea" aria-hidden="true">
        <Houle className="h h3" />
        <Houle className="h h2" />
        <Houle className="h h1" />
        <span className="glint" />
        <span className="foam" />
      </div>
    </div>
  );
}
