"use client";
import { useState } from "react";
import Link from "next/link";
import Wordmark from "../Wordmark";
import Assistant from "./Assistant";
import { Overview, Itinerary, Flights, Stays, Weather, Budget } from "./screens";
import Prepare from "./Prepare";
import { useOdyssea } from "../../lib/store";
import { Icon } from "../../lib/icons";

const TABS = [
  ["dash", "compass", "Aperçu"],
  ["itin", "list", "Itinéraire"],
  ["vols", "plane", "Vols"],
  ["hotels", "bed", "Hébergement"],
  ["meteo", "cloud", "Météo"],
  ["budget", "wallet", "Budget"],
  ["preparer", "shield", "Préparer"],
];

export default function TripApp({ trip }) {
  const [tab, setTab] = useState("dash");
  const [day, setDay] = useState(1);
  const { user } = useOdyssea();

  const screens = {
    dash: <Overview trip={trip} setTab={setTab} />,
    itin: <Itinerary trip={trip} day={day} setDay={setDay} />,
    vols: <Flights trip={trip} />,
    hotels: <Stays trip={trip} />,
    meteo: <Weather trip={trip} />,
    budget: <Budget trip={trip} />,
    preparer: <Prepare trip={trip} />,
  };

  return (
    <div className="app">
      <div className="app-bar">
        <span className="onb-bar-side" />
        <Wordmark mark />
        <div className="right">
          {user ? (
            <Link className="btn btn-line small" href="/mes-voyages">
              Mes voyages
            </Link>
          ) : (
            <Link className="btn btn-line small" href={`/compte?claim=${trip.id}`}>
              Enregistrer ce voyage
            </Link>
          )}
          <Link className="btn btn-gold small" href="/parcours">
            <Icon name="spark" />
            Nouveau<span className="long">voyage</span>
          </Link>
        </div>
      </div>

      <div className="tabszone">
        <nav className="tabs" role="tablist">
          {TABS.map(([k, icon, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              className={"tab" + (tab === k ? " on" : "")}
              onClick={() => setTab(k)}
            >
              <Icon name={icon} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="view-enter" key={tab}>
        {screens[tab]}
      </div>

      <nav id="dock" role="tablist">
        {TABS.map(([k, icon, label]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            <Icon name={icon} />
            {label}
          </button>
        ))}
      </nav>

      <Assistant trip={trip} />
    </div>
  );
}
