/* Identité de l'éditeur et textes légaux. */

export const ENTITY = {
  name: "Odyssea",
  legalForm: "Entrepreneur individuel",
  siren: "985 222 603",
  siret: "985 222 603 00039",
  vat: "FR27985222603",
  ape: "6202B — Tierce maintenance de systèmes et d'applications informatiques",
  created: "11 mai 2026",
  convention: "Bureaux d'études techniques, SYNTEC (IDCC 1486)",
  email: "contact@odyssea-trip.com",
};

const E = ENTITY;



export const LEGAL = {
  mentions: ["Mentions légales", "Directeur de la publication : le représentant légal de l'entreprise. Hébergeur du site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Les contenus, textes et visuels de ce site sont protégés ; toute reproduction sans accord préalable est interdite."],
  confidentialite: ["Politique de confidentialité", "Les réponses données pendant la composition d'un voyage restent dans votre navigateur pendant la session et ne sont transmises à aucun tiers. Aucun compte n'est créé. Si vous utilisez l'assistant, votre question et le contexte du voyage sont envoyés au fournisseur du modèle pour produire la réponse, puis ne sont pas conservés. Responsable de traitement : " + E.name + " — " + E.email + "."],
  donnees: ["Vos droits (RGPD)", `Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données. Aucune donnée n'étant conservée après la fermeture de l'onglet, l'effacement est immédiat. Pour toute demande, écrivez à ${E.email}. Vous pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).`],
  cookies: ["Politique cookies", "Seuls des cookies strictement nécessaires sont déposés par défaut. La mesure d'audience et la personnalisation ne sont activées qu'après accord explicite, révocable à tout moment depuis « Gérer mes cookies »."],
  cgu: ["Conditions générales d'utilisation", `Odyssea propose des itinéraires à titre indicatif. Horaires, prix, disponibilités et conditions d'entrée doivent être vérifiés auprès des prestataires avant tout déplacement. Odyssea n'agit pas en qualité d'agence de voyages et ne procède à aucune vente de forfait touristique. Pour toute question : ${E.email}.`],
  accessibilite: ["Accessibilité", "L'interface vise le niveau AA du RGAA : contrastes vérifiés, navigation au clavier, libellés explicites, respect de « réduire les animations ». Signalez-nous toute difficulté à " + E.email + "."],
};
