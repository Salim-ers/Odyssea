"use client";
import { useOdyssea } from "../lib/store";
import { Icon } from "../lib/icons";

export default function Toasts() {
  const { toasts } = useOdyssea();
  return (
    <div id="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <Icon name="check" />
          {t.text}
        </div>
      ))}
    </div>
  );
}
