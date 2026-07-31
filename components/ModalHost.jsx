"use client";
import { useEffect } from "react";
import { useOdyssea } from "../lib/store";

/* Une seule modale à la fois : le contenu est fourni par les écrans. */
export default function ModalHost() {
  const { modal, setModal } = useOdyssea();

  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => e.key === "Escape" && setModal(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, setModal]);

  if (!modal) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && setModal(null)}>
      <div className="modal-card view-enter">
        {modal}
        <div className="foot">
          <button className="btn btn-line small" onClick={() => setModal(null)}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
