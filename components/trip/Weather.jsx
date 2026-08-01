"use client";
import { WX, CITY } from "../../lib/data";
import { Icon } from "../../lib/icons";
import { Screen, WeatherAlert } from "./Chrome";
import Reveal from "../Reveal";

export default function Weather({ setTab, setDay }) {
  return (
    <Screen kicker="Météo" title="Elle décide avec vous, jamais pour vous."
      intro="Octobre en Malaisie : matinées lumineuses, averses orageuses brèves en fin d'après-midi. L'itinéraire est déjà construit autour.">
      <div className="wxstrip">
        {WX.map((w, i) => {
          const [hi, lo] = w.t.split("|");
          return (
            <Reveal as="button" key={w.n} delay={Math.min(i * 35, 300)}
              className={"wx" + (w.alert ? " al" : "") + (w.i === "rain" ? " rainy" : "")}
              title={"Voir le jour " + w.n} onClick={() => { setDay(i); setTab("itin"); }}>
              <div className="d">J{w.n} · {w.c === "fly" ? "vol" : CITY[w.c].split(" ")[0]}</div>
              <Icon name={w.i} />
              <div className="t">{hi}{lo ? <i> / {lo}°</i> : ""}</div>
              <div className="r">{w.r}</div>
            </Reveal>
          );
        })}
      </div>

      <WeatherAlert />

      <div className="grid2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="kicker" style={{ marginBottom: 12 }}>LA RÈGLE ODYSSEA SOUS LES TROPIQUES</div>
          <div className="wxrule"><Icon name="sun" /><span><b>Extérieur le matin</b> — canopée de KL, balades UNESCO et kayak sont calés avant 14 h, quand le ciel est le plus fiable.</span></div>
          <hr className="rule" />
          <div className="wxrule"><Icon name="rain" /><span><b>À couvert de 15 h à 17 h</b> — musées, pauses à l&apos;hôtel et kopitiams occupent le créneau à risque.</span></div>
          <hr className="rule" />
          <div className="wxrule"><Icon name="sun" /><span><b>Le soir vous appartient</b> — Maghrib entre 19:07 et 19:13 selon la ville : les dîners sont posés pile dessus.</span></div>
        </div>
        <div className="card">
          <div className="kicker gold" style={{ marginBottom: 12 }}>CE QUE ÇA CHANGE POUR VOUS</div>
          <ul className="oklist">
            <li><Icon name="check" />Jour 4 : seul créneau vraiment exposé — plan B prêt, un clic pour l&apos;appliquer</li>
            <li><Icon name="check" />K-way et poche étanche déjà ajoutés à votre valise</li>
            <li><Icon name="check" />En scooter à Langkawi : vérifiez le ciel avant 15 h</li>
          </ul>
          <div className="acts">
            <button className="btn btn-line small" onClick={() => setTab("valise")}>Voir la valise</button>
            <button className="btn btn-line small" onClick={() => setTab("loc")}>Voir la location</button>
          </div>
          <p className="note" style={{ marginTop: 12 }}>Prévisions de démonstration — pas de replanification sans votre accord.</p>
        </div>
      </div>
    </Screen>
  );
}
