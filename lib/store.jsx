"use client";

/* État global d'Odyssea.
   Un seul contexte : l'état du voyage + les actions qui le modifient.
   Rien n'est persisté — la démo vit le temps de la session. */

import { createContext, useContext, useMemo, useRef, useState, useCallback } from "react";
import { DAYS, D6BREAK, REGRETS } from "./data";

const Ctx = createContext(null);

const initialState = {
  ob: {
    step: 0,
    from: "Paris — CDG",
    dest: "Malaisie",
    dep: "2026-10-03",
    ret: "2026-10-14",
    trav: 2,
    group: "Couple",
    occasion: null,
    include: { vol: true, hotel: true, act: true },
    booked: { vol: "non", hotel: "non", act: "non" },
    stylePri: "Gastronomie",
    styleSec: "Nature",
    budget: "Confort",
    food: ["Aucune restriction"],
    allerg: "",
    prefs: ["Éviter la foule", "Vivre local"],
  },
  started: false,
  day: 1,
  scenario: "eq",
  planApplied: false,
  regrets: { r1: null, r2: null, r3: null },
  esim: false,
  permis: false,
  dna: { pace: 1, stay: 1, ints: ["gastro", "nature", "plage"] },
  restoFilter: "tous",
  flightSort: "best",
  checks: { "0-0": true, "0-1": true },
  packed: {},
  cookies: { set: false, audience: false, perso: false },
};

export function OdysseaProvider({ children }) {
  const [S, setS] = useState(initialState);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [chat, setChat] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  const patch = useCallback((fn) => setS((s) => ({ ...s, ...fn(s) })), []);
  const patchOb = useCallback(
    (fn) => setS((s) => ({ ...s, ob: { ...s.ob, ...fn(s.ob) } })),
    []
  );

  const toast = useCallback((text) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  /* Les corrections du détecteur de regrets modifient réellement l'itinéraire. */
  const fixRegret = useCallback(
    (id) => {
      if (id === "r1") {
        const d = DAYS[11].items;
        const a = d.find((x) => x.id === "d12a");
        const b = d.find((x) => x.id === "d12b");
        const c = d.find((x) => x.id === "d12c");
        if (a) a.t = "09:00";
        if (b) b.t = "09:45";
        if (c) {
          c.t = "10:45";
          c.s = "Départ avancé — ~1 h 20 de marge à l'aéroport";
        }
      }
      if (id === "r2" && !DAYS[5].items.some((x) => x.id === "d6x")) {
        DAYS[5].items.splice(3, 0, D6BREAK);
      }
      if (id === "r3") {
        const a = DAYS[8].items.find((x) => x.id === "d9a");
        const b = DAYS[8].items.find((x) => x.id === "d9c");
        if (a) {
          a.dur = "3 h";
          a.s = "Créneau étendu (files du téléphérique)";
        }
        if (b) b.t = "15:30";
      }
      patch((s) => ({ regrets: { ...s.regrets, [id]: "fixed" } }));
      toast("Corrigé — l'itinéraire est à jour.");
    },
    [patch, toast]
  );

  const readiness = useMemo(() => {
    let open = 0;
    if (!S.planApplied) open++;
    REGRETS.forEach((r) => {
      if (!S.regrets[r.id]) open++;
    });
    if (!S.esim) open++;
    if (!S.permis) open++;
    return { pct: 100 - open * 4, open };
  }, [S.planApplied, S.regrets, S.esim, S.permis]);

  const value = useMemo(
    () => ({
      S,
      setS,
      patch,
      patchOb,
      readiness,
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
      actions: {
        applyPlan: () => {
          patch(() => ({ planApplied: true }));
          toast("Plan B appliqué — les jardins passent au matin.");
        },
        revertPlan: () => {
          patch(() => ({ planApplied: false }));
          toast("Plan initial rétabli.");
        },
        fixRegret,
        ignoreRegret: (id) => {
          patch((s) => ({ regrets: { ...s.regrets, [id]: "ignored" } }));
          toast("Ignoré — c'est vous le capitaine.");
        },
        fixEsim: () => {
          patch((s) => ({ esim: true, checks: { ...s.checks, "2-2": true } }));
          toast("eSIM notée — activez-la la veille du départ.");
        },
        fixPermis: () => {
          patch((s) => ({ permis: true, checks: { ...s.checks, "0-3": true } }));
          toast("Permis international ajouté à la check-list.");
        },
        toggleCheck: (k) =>
          patch((s) => {
            const checks = { ...s.checks, [k]: !s.checks[k] };
            const next = { checks };
            if (k === "2-2") next.esim = !!checks[k];
            if (k === "0-3") next.permis = !!checks[k];
            return next;
          }),
        togglePack: (k) =>
          patch((s) => ({ packed: { ...s.packed, [k]: !s.packed[k] } })),
        setDna: (kind, i) => {
          patch((s) => ({ dna: { ...s.dna, [kind]: i } }));
          toast("Trip DNA mis à jour — l'itinéraire s'ajustera.");
        },
        toggleInterest: (k) =>
          patch((s) => {
            const ints = s.dna.ints.includes(k)
              ? s.dna.ints.filter((x) => x !== k)
              : [...s.dna.ints, k];
            return { dna: { ...s.dna, ints } };
          }),
        pickScenario: (k) => {
          patch(() => ({ scenario: k }));
          toast("Scénario retenu — budget et hébergements ajustés.");
        },
        cookies: (all) => {
          patch(() => ({ cookies: { set: true, audience: all, perso: all } }));
          toast(
            all
              ? "Merci — mesure d'audience activée."
              : "Refusé — seuls les cookies nécessaires restent actifs."
          );
        },
      },
    }),
    [S, readiness, toasts, modal, chat, chatOpen, busy, patch, patchOb, toast, fixRegret]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOdyssea() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOdyssea doit être utilisé dans <OdysseaProvider>");
  return v;
}

export const frDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};
