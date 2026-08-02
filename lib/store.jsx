"use client";

/* État partagé de l'application.

   Deux choses seulement vivent ici : le brief en cours de composition, et les
   éléments d'interface transverses (toasts, modales, session, assistant). Un
   voyage généré n'y est jamais copié — il vient du serveur, avec son
   identifiant, et c'est la page qui le porte. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const Ctx = createContext(null);

const inSevenDays = (from, days) => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const today = () => new Date();

export const initialBrief = () => ({
  q: null,
  from: "Paris — CDG",
  /* L adresse de depart, si elle est donnee : elle permet de tracer le
     trajet depuis chez soi jusqu a l aeroport, puis jusqu a l hebergement. */
  origin: null,
  /* Plusieurs destinations : un voyage peut enchaîner des escales, et le
     parcours répartit les nuits entre elles. */
  dests: [],
  dep: inSevenDays(today(), 60),
  ret: inSevenDays(today(), 70),
  adults: 2,
  kids: 0,
  trav: 2,
  group: "Couple",
  occasion: null,
  include: { vol: true, hotel: true, act: true },
  booked: { vol: "non", hotel: "non", act: "non" },
  /* Ce que la barre de recherche a arrêté. Le parcours ne le repose pas :
     il le rappelle, modifiable. Sans ce drapeau, on ne saurait pas
     distinguer une valeur choisie d'une valeur laissée par défaut. */
  fixed: {},
  split: {},
  stylePri: null,
  styleSec: null,
  pace: null,
  lodging: null,
  ground: null,
  budget: "Confort",
  food: [],
  allerg: "",
  care: [],
  prefs: [],
  wish: "",
});

/* Quitter l'accueil pour le parcours, c'est valider ce que la barre de
   recherche affiche : destinations, dates, équipage et périmètre y sont tous
   sous les yeux. Le questionnaire les rappelle donc au lieu de les reposer.
   Les dates n'échappent pas à la règle : elles sont visibles, même laissées
   par défaut. */
export const LOCKED = ["dest", "dates", "trav", "scope"];

/** Les nuits disponibles, et celles déjà réparties entre les escales. */
export const splitOf = (ob) => {
  const total = nights(ob.dep, ob.ret);
  const given = (ob.dests || []).reduce((sum, d) => sum + (ob.split?.[d] || 0), 0);
  return { total, given, left: total - given };
};

export function OdysseaProvider({ children, initialUser = null }) {
  const [ob, setOb] = useState(initialBrief);
  const [user, setUser] = useState(initialUser);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [chat, setChat] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cookiePrefs, setCookiePrefs] = useState({ set: false, audience: false, perso: false });
  const seq = useRef(0);

  const patchOb = useCallback((fn) => setOb((o) => ({ ...o, ...fn(o) })), []);

  const toast = useCallback((text) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  /* Le brief survit à un rechargement pendant la composition. */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("odyssea:brief");
      if (saved) setOb((o) => ({ ...o, ...JSON.parse(saved) }));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem("odyssea:brief", JSON.stringify(ob));
    } catch {}
  }, [ob]);

  const logout = useCallback(async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setUser(null);
    toast("Vous êtes déconnecté.");
  }, [toast]);

  const value = useMemo(
    () => ({
      ob,
      setOb,
      patchOb,
      user,
      setUser,
      logout,
      toast,
      toasts,
      modal,
      setModal,
      chat,
      setChat,
      chatOpen,
      setChatOpen,
      busy,
      setBusy,
      cookiePrefs,
      setCookiePrefs,
    }),
    [ob, user, logout, toast, toasts, modal, chat, chatOpen, busy, cookiePrefs, patchOb]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOdyssea() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOdyssea doit être utilisé dans <OdysseaProvider>");
  return v;
}

/* ---------- Formats ---------- */

export const frDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

export const frDateLong = (iso) => {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export const eur = (n) =>
  typeof n === "number" && Number.isFinite(n)
    ? n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €"
    : "—";

export const nights = (dep, ret) => {
  if (!dep || !ret) return 0;
  return Math.max(0, Math.round((new Date(ret) - new Date(dep)) / 86400000));
};
