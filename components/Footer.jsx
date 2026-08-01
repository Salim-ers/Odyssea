"use client";
import Link from "next/link";
import { LEGAL, ENTITY } from "../lib/data";
import { useOdyssea } from "../lib/store";

export default function Footer() {
  const { setModal, toast } = useOdyssea();

  const legal = (k) => {
    const [title, body] = LEGAL[k];
    setModal(
      <>
        <div className="kicker steel">Odyssea · informations légales</div>
        <h3 style={{ marginTop: 8 }}>{title}</h3>
        {/* Les identifiants de l'entreprise vivent ici, pas dans le pied de page. */}
        {k === "mentions" && (
          <dl className="legal-dl">
            {[
              ["Éditeur", `${ENTITY.name} · ${ENTITY.legalForm}`],
              ["SIREN", ENTITY.siren, true],
              ["SIRET du siège", ENTITY.siret, true],
              ["TVA intracommunautaire", ENTITY.vat, true],
              ["Code APE", ENTITY.ape],
              ["Immatriculation", ENTITY.created],
              ["Convention collective", ENTITY.convention],
            ].map(([dt, dd, mono]) => (
              <div key={dt}><dt>{dt}</dt><dd className={mono ? "mono" : undefined}>{dd}</dd></div>
            ))}
            <div>
              <dt>Contact</dt>
              <dd><a href={`mailto:${ENTITY.email}`}>{ENTITY.email}</a></dd>
            </div>
          </dl>
        )}
        <p style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.7, color: "var(--muted)" }}>{body}</p>
      </>
    );
  };

  const prefs = () => setModal(<CookiePrefs />);

  return (
    <footer className="foot">
      <div className="in">
        <div className="foot-top">
          <div className="foot-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/odyssea-logo-white.png" alt="Odyssea" />
            <p>Le compagnon qui compose votre voyage entier — vols, séjour, journées — et veille dessus jusqu&apos;au retour.</p>
            <div className="tag">Planifiez. Explorez. Vivez.</div>
          </div>
          <div>
            <h5>Produit</h5>
            <ul>
              <li><Link href="/parcours">Composer un voyage</Link></li>
              <li><a href="#galerie">Explorer les destinations</a></li>
              <li><a href="#methode">Exemple : Malaisie</a></li>
              <li><Link href="/voyage">Mon voyage</Link></li>
            </ul>
          </div>
          <div>
            <h5>Ressources</h5>
            <ul>
              <li><a href="#methode">Comment ça marche</a></li>
              <li><button onClick={() => toast("Bientôt disponible.")}>Questions fréquentes</button></li>
              <li><a href={`mailto:${ENTITY.email}`}>Nous écrire</a></li>
            </ul>
          </div>
          <div>
            <h5>Légal &amp; données</h5>
            <ul>
              <li><button onClick={() => legal("mentions")}>Mentions légales</button></li>
              <li><button onClick={() => legal("confidentialite")}>Politique de confidentialité</button></li>
              <li><button onClick={() => legal("donnees")}>Vos droits (RGPD)</button></li>
              <li><button onClick={() => legal("cookies")}>Politique cookies</button></li>
              <li><button onClick={() => legal("cgu")}>Conditions d&apos;utilisation</button></li>
              <li><button onClick={() => legal("accessibilite")}>Accessibilité</button></li>
              <li><button onClick={prefs}>Gérer mes cookies</button></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 {ENTITY.name}. Tous droits réservés.</span>
          <span className="right">
            <span>Conçu en France</span>
            <span>Aucune donnée revendue</span>
            <button onClick={() => legal("mentions")}>Mentions légales</button>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function CookiePrefs() {
  const { S, patch, setModal, actions } = useOdyssea();
  const t = (k) => patch((s) => ({ cookies: { ...s.cookies, [k]: !s.cookies[k] } }));
  return (
    <>
      <div className="kicker steel">Confidentialité</div>
      <h3 style={{ marginTop: 8 }}>Gérer mes cookies</h3>
      <p className="note" style={{ margin: "10px 0 6px" }}>
        Aucun traceur publicitaire, aucune revente de données. Vos choix s&apos;appliquent immédiatement.
      </p>
      <div className="ck-toggle">
        <div><b>Strictement nécessaires</b><span>Affichage de l&apos;interface et mémorisation de vos réponses pendant la session.</span></div>
        <button className="switch on" disabled aria-label="Toujours actifs" />
      </div>
      <div className="ck-toggle">
        <div><b>Mesure d&apos;audience</b><span>Statistiques anonymes de fréquentation, pour savoir quels écrans améliorer.</span></div>
        <button className={"switch" + (S.cookies.audience ? " on" : "")} aria-pressed={S.cookies.audience} onClick={() => t("audience")} />
      </div>
      <div className="ck-toggle">
        <div><b>Personnalisation</b><span>Mémorise vos préférences de voyage pour vous les reproposer.</span></div>
        <button className={"switch" + (S.cookies.perso ? " on" : "")} aria-pressed={S.cookies.perso} onClick={() => t("perso")} />
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 9, justifyContent: "flex-end" }}>
        <button className="btn btn-gold small" onClick={() => { actions.cookies(S.cookies.audience || S.cookies.perso); setModal(null); }}>
          Enregistrer mes choix
        </button>
      </div>
    </>
  );
}
