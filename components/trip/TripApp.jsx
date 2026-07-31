"use client";
import { useState } from "react";
import Chrome from "./Chrome";
import Dashboard from "./Dashboard";
import Itinerary from "./Itinerary";
import Flights from "./Flights";
import Stays from "./Stays";
import Rentals from "./Rentals";
import Restaurants from "./Restaurants";
import Weather from "./Weather";
import Budget from "./Budget";
import Checklist from "./Checklist";
import Packing from "./Packing";
import Assistant from "./Assistant";
import { useOdyssea } from "../../lib/store";

export default function TripApp() {
  const [tab, setTab] = useState("dash");
  const [day, setDay] = useState(1);
  const { setChatOpen, chat, setChat } = useOdyssea();

  const openChat = (prefill) => {
    setChatOpen(true);
    if (!chat.length) {
      setChat([{ role: "assistant", hello: true, txt: "Bonjour ! Je connais chaque détail de votre voyage en Malaisie. Posez-moi tout." }]);
    }
    if (prefill) setTimeout(() => document.querySelector("#chatpanel input")?.focus(), 300);
  };

  const screens = {
    dash: <Dashboard setTab={setTab} openChat={openChat} />,
    itin: <Itinerary day={day} setDay={setDay} openChat={openChat} />,
    vols: <Flights />,
    hotels: <Stays />,
    loc: <Rentals setTab={setTab} />,
    restos: <Restaurants openChat={openChat} />,
    meteo: <Weather setTab={setTab} setDay={setDay} />,
    budget: <Budget openChat={openChat} />,
    check: <Checklist />,
    valise: <Packing />,
  };

  return (
    <>
      <Chrome tab={tab} setTab={setTab}>
        <div className="view-enter" key={tab}>{screens[tab]}</div>
      </Chrome>
      <Assistant />
    </>
  );
}
