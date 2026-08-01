"use client";
import { useEffect, useRef, useState } from "react";
import { useOdyssea, eur, frDate } from "../../lib/store";
import { Icon } from "../../lib/icons";

/* L'assistant répond à partir du voyage réellement composé : il reçoit le
   plan et le programme, pas un contexte inventé. Il ne réserve rien. */

const SUGGESTIONS = [
  "Que faire s'il pleut le troisième jour ?",
  "Comment économiser 200 € sur ce voyage ?",
  "Une alternative pour la journée la plus chargée ?",
  "Qu'est-ce que je dois réserver dès maintenant ?",
];

export default function Assistant({ trip }) {
  const { chat, setChat, chatOpen, setChatOpen, busy, setBusy } = useOdyssea();
  const box = useRef(null);
  const input = useRef(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [chat, busy]);

  useEffect(() => {
    if (chatOpen) setTimeout(() => input.current?.focus(), 320);
  }, [chatOpen]);

  useEffect(() => {
    if (chatOpen && !chat.length) {
      setChat([
        {
          role: "assistant",
          txt: `Bonjour ! Je connais chaque détail de votre voyage ${trip.plan.destination.name} — itinéraire, budget, adresses, horaires. Posez-moi tout.`,
        },
      ]);
    }
  }, [chatOpen, chat.length, setChat, trip]);

  const system = () => {
    const { brief, plan, days, practical } = trip;
    const programme = days
      .map(
        (d) =>
          `J${d.n} ${d.date} (${d.stopName}) : ${d.items
            .map((i) => `${i.time} ${i.title}`)
            .join(" ; ")}`
      )
      .join("\n");

    return `Tu es l'assistant Odyssea. Tu connais le voyage ci-dessous et rien d'autre. Tu écris en français, en vouvoyant.

VOYAGE
- Destination : ${plan.destination.name} (${plan.destination.country})
- Dates : ${brief.dep} → ${brief.ret}
- Voyageurs : ${brief.adults} adulte(s), ${brief.kids} enfant(s) — ${brief.group}
- Départ depuis : ${brief.from}
- Étapes : ${plan.stops.map((s) => `${s.name} (${s.nights} nuits)`).join(", ")}
- Hébergement : ${plan.stays.map((s) => `${s.stopName} — quartier ${s.area}`).join(" ; ")}
- Budget : ${eur(plan.budget?.totalEur)} au total
- Saison : ${plan.season?.verdict} — ${plan.season?.detail}
${brief.food?.length ? `- Alimentation : ${brief.food.join(", ")}` : ""}
${brief.allerg ? `- Allergies : ${brief.allerg}` : ""}

PROGRAMME
${programme}

${practical?.watchouts?.length ? `POINTS DE VIGILANCE\n${practical.watchouts.map((w) => `- ${w.title} : ${w.fix}`).join("\n")}` : ""}

RÈGLES
- Appuie-toi sur ce voyage précis. Cite les jours et les lieux réels.
- Si l'information n'y est pas, dis-le plutôt que de l'inventer.
- Tu ne peux pas réserver : tu proposes, tu expliques, l'utilisateur décide.
- Respecte les restrictions alimentaires déclarées, sans en inventer d'autres.
- Reste neutre : aucune suggestion fondée sur une appartenance religieuse, politique ou communautaire.
- 150 mots maximum.`;
  };

  const send = async (text) => {
    const msg = (text || draft).trim();
    if (!msg || busy) return;
    setDraft("");
    const next = [...chat, { role: "user", txt: msg }];
    setChat(next);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          system: system(),
          messages: next.map((m) => ({ role: m.role, content: m.txt })),
        }),
      });
      const data = await res.json();
      setChat([
        ...next,
        data.text
          ? { role: "assistant", txt: data.text }
          : { role: "assistant", txt: data.error || "Assistant indisponible.", err: true },
      ]);
    } catch (e) {
      setChat([...next, { role: "assistant", txt: "Assistant indisponible : " + e.message, err: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button id="fab" aria-label="Ouvrir l'assistant" onClick={() => setChatOpen(!chatOpen)}>
        <Icon name={chatOpen ? "check" : "spark"} />
      </button>

      <div id="chatpanel" className={chatOpen ? "open" : ""}>
        <div className="ch-head">
          <span className="ch-av">
            <Icon name="spark" />
          </span>
          <div>
            <b>Assistant Odyssea</b>
            <span className="ch-live">
              {trip.plan.destination.name} · {frDate(trip.brief.dep)}
            </span>
          </div>
          <button className="ch-x" aria-label="Fermer" onClick={() => setChatOpen(false)}>
            <Icon name="check" />
          </button>
        </div>

        <div id="chatm" ref={box}>
          {chat.map((m, i) => (
            <div key={i} className={"msg " + (m.role === "user" ? "u" : "a") + (m.err ? " err" : "")}>
              {m.txt}
            </div>
          ))}
          {busy && (
            <div className="typing">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>

        {!busy && chat.length <= 1 && (
          <div id="chatchips">
            {SUGGESTIONS.map((s) => (
              <button className="chip" key={s} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          className="ch-in"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Posez votre question…"
            aria-label="Votre question"
          />
          <button type="submit" aria-label="Envoyer" disabled={busy}>
            <Icon name="send" />
          </button>
        </form>
        <p className="ch-note">
          Les réponses peuvent comporter des erreurs. Vérifiez horaires et disponibilités auprès des
          prestataires.
        </p>
      </div>
    </>
  );
}
