"use client";
import { useEffect, useRef, useState } from "react";
import { DAYS, CITY, BPLAN, SCENARIOS, dayItems } from "../../lib/data";
import { useOdyssea } from "../../lib/store";
import { Icon } from "../../lib/icons";

const CANNED = [
  [/halal|manger|resto|dîner|table|soir/i, "Ce soir à KL, deux valeurs sûres : Kampung Baru pour le nasi lemak légendaire de Wanjo (5-8 €, un vrai moment local), ou le food court de Suria KLCC si vous voulez la climatisation. Les deux sont à moins de 15 minutes en Grab du Traders, et la mosquée de Kampung Baru est sur place pour l'Isha."],
  [/pleut|pluie|jour 4|plan b|météo/i, "Pour le jour 4, l'averse est annoncée entre 14 h et 17 h. Le plan B garde exactement les mêmes lieux : jardins botaniques dès 9 h, déjeuner à Brickfields, musée national au sec pendant la pluie, puis Thean Hou au coucher du soleil une fois le ciel rincé. Budget inchangé. Appliquez-le depuis l'alerte du tableau de bord — réversible à tout moment."],
  [/économis|budget|moins cher|200/i, "Trois pistes, environ 205 € au total : Turkish Airlines au lieu de Qatar (−66 €/personne, escale plus longue), trois dîners en street food plutôt qu'au restaurant (−35 €), et le créneau SkyCab de 9 h réservé en ligne qui évite le billet coupe-file (−12 €). Le spa et la croisière restent intouchés — c'est le cœur du voyage."],
  [/valise|bagage|emporter/i, "L'essentiel pour octobre : vêtements légers qui sèchent vite, une cape de pluie compacte (les averses durent 30 à 60 minutes), sandales tout-terrain, et une tenue couvrante par personne pour les mosquées. Anti-moustique dès le crépuscule, adaptateur type G, et gardez 1 kg de libre : le batik et le café blanc d'Ipoh remplissent les valises au retour."],
];

export default function Assistant() {
  const { S, chat, setChat, chatOpen, setChatOpen, busy, setBusy, readiness } = useOdyssea();
  const box = useRef(null);
  const input = useRef(null);
  const [draft, setDraft] = useState("");

  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [chat, busy]);
  useEffect(() => { if (chatOpen) setTimeout(() => input.current?.focus(), 320); }, [chatOpen]);

  const sysPrompt = () => {
    const o = S.ob, sc = SCENARIOS.find((x) => x.key === S.scenario);
    const days = DAYS.map((d) => `J${d.n} ${CITY[d.c]}: ${dayItems(d, S.planApplied).map((i) => i.f).join("; ")}`).join(" | ");
    return `Tu es l'assistant Odyssea, compagnon de voyage expert et chaleureux. Tu connais TOUT du voyage de l'utilisateur, et tu le vouvoies toujours.

CONTEXTE (démo Malaisie) :
- Voyageurs : ${o.trav} (${o.group}${o.occasion ? ", " + o.occasion : ""}), départ ${o.from}, du 3 au 14 octobre 2026.
- Parcours : Kuala Lumpur (4 nuits, Traders) → Penang/George Town (3 nuits, Campbell House) → Langkawi (4 nuits, Dash Resort).
- Scénario retenu : ${sc.label} (${sc.price} €). Budget max 3 500 €, plan à ${BPLAN} €.
- Profil : ${o.stylePri} (principal), ${o.styleSec || "—"} (secondaire), préférences : ${o.prefs.join(", ")}. Alimentation : ${o.food.join(", ")}${o.allerg ? ", allergies : " + o.allerg : ""}.
- Météo : inter-mousson, 31°, averses brèves. Alerte jour 4 : plan B ${S.planApplied ? "APPLIQUÉ" : "proposé, pas encore appliqué"}.
- Préparation : ${readiness.pct} %. Itinéraire : ${days}

RÈGLES :
- Réponds en français, en vouvoyant. Ton chaleureux et concret, 150 mots max.
- Appuie-toi sur les données ci-dessus et cite les jours et lieux précis.
- Tu ne peux PAS réserver : tu proposes, tu expliques, l'utilisateur décide.
- IMPÉRATIF : ne suggère JAMAIS bars, boîtes de nuit, alcool ou établissements non conformes à ce profil. Si on te le demande, propose avec élégance des alternatives sans alcool.`;
  };

  const send = async (text) => {
    const msg = (text || draft).trim();
    if (!msg || busy) return;
    setDraft("");
    const next = [...chat, { role: "user", txt: msg }];
    setChat(next);
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: sysPrompt(),
          messages: next.filter((c) => !c.err && !c.hello).map((c) => ({ role: c.role, content: c.txt })),
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.text) throw new Error(d.error || "réponse vide");
      setChat((c) => [...c, { role: "assistant", txt: d.text }]);
    } catch (e) {
      const hit = CANNED.find((c) => c[0].test(msg));
      setChat((c) => [...c, {
        role: "assistant",
        txt: hit ? hit[1] : "Je n'arrive pas à joindre le service depuis cet environnement — tout votre voyage reste consultable dans les onglets. Ajoutez ANTHROPIC_API_KEY et relancez pour activer l'assistant.",
        err: !hit,
      }]);
    } finally {
      setBusy(false);
    }
  };

  const open = () => {
    setChatOpen(true);
    if (!chat.length) {
      setChat([{ role: "assistant", hello: true, txt: "Bonjour ! Je connais chaque détail de votre voyage en Malaisie — itinéraire, budget, météo, adresses, horaires de prière. Posez-moi tout, ou touchez une suggestion." }]);
    }
  };

  return (
    <>
      <button id="fab" aria-label="Ouvrir l'assistant Odyssea" aria-expanded={chatOpen} onClick={open}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z" />
          <circle cx="19" cy="19" r="2.4" />
        </svg>
      </button>

      <section id="chatpanel" className={chatOpen ? "open" : ""} role="dialog" aria-label="Assistant Odyssea">
        <div className="ch-head">
          <span className="ch-av" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z" /></svg>
          </span>
          <div><b>Assistant Odyssea</b><span className="ch-live">connaît tout votre voyage</span></div>
          <button className="ch-x" onClick={() => setChatOpen(false)} aria-label="Fermer l&apos;assistant">✕</button>
        </div>

        <div id="chatm" ref={box}>
          {chat.map((c, i) => (
            <div key={i} className={"msg " + (c.role === "user" ? "u" : "a") + (c.err ? " err" : "")}>{c.txt}</div>
          ))}
          {busy && <div className="typing"><i /><i /><i /></div>}
        </div>

        <div id="chatchips">
          {chat.length <= 1 && ["Où manger ce soir à KL ?", "Il pleut jour 4, on fait quoi ?", "Où économiser 200 € ?"].map((q) => (
            <button key={q} className="chip" onClick={() => send(q)}>{q}</button>
          ))}
        </div>

        <div className="ch-in">
          <input ref={input} value={draft} placeholder="Posez votre question…" aria-label="Message pour l&apos;assistant"
            onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button onClick={() => send()} aria-label="Envoyer">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 20l18-8L3 4l4 8-4 8Z" /></svg>
          </button>
        </div>
        <p className="ch-note">Démo — réponses en direct si la clé API est configurée, réponses préparées sinon. Aucune réservation réelle.</p>
      </section>
    </>
  );
}
