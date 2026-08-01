"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Wordmark from "./Wordmark";
import { useOdyssea } from "../lib/store";
import { Icon } from "../lib/icons";

/* Inscription et connexion. Le mot de passe ne quitte jamais ce formulaire
   autrement que vers /api/auth, en HTTPS ; il n'est ni journalisé, ni
   conservé côté client. */

export default function AccountForm({ claimTripId }) {
  const [mode, setMode] = useState(claimTripId ? "signup" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const { setUser, toast } = useOdyssea();
  const router = useRouter();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: mode, ...form, claimTripId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || { form: data.error || "Une erreur est survenue." });
        return;
      }
      setUser(data.user);
      toast(mode === "signup" ? "Compte créé — bienvenue." : "Content de vous revoir.");
      router.push(claimTripId ? `/voyage/${claimTripId}` : "/mes-voyages");
      router.refresh();
    } catch (err) {
      setErrors({ form: "Connexion impossible : " + err.message });
    } finally {
      setBusy(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <main className="onb on-dark">
      <div className="onb-bar">
        <Wordmark />
        <Link className="btn btn-quiet small" href="/">
          Retour à l&apos;accueil
        </Link>
      </div>

      <div className="account-wrap">
        <div className="kicker gold">{isSignup ? "Créer un compte" : "Se connecter"}</div>
        <h1 className="ob-q" style={{ marginTop: 12 }}>
          {isSignup ? "Gardez vos voyages." : "Bon retour."}
        </h1>
        <p className="ob-sub">
          {claimTripId
            ? "Créez votre compte pour enregistrer le voyage que vous venez de composer et le retrouver plus tard."
            : isSignup
              ? "Un compte pour retrouver vos voyages composés, sur tous vos appareils."
              : "Retrouvez les voyages que vous avez composés."}
        </p>

        <form onSubmit={submit} className="account-form">
          {isSignup && (
            <label className="field">
              <span>Prénom ou nom</span>
              <input
                className="ob-input"
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
                required
              />
              {errors.name && <em>{errors.name}</em>}
            </label>
          )}

          <label className="field">
            <span>Adresse e-mail</span>
            <input
              className="ob-input"
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              required
            />
            {errors.email && <em>{errors.email}</em>}
          </label>

          <label className="field">
            <span>Mot de passe</span>
            <input
              className="ob-input"
              type="password"
              value={form.password}
              onChange={set("password")}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
            />
            {errors.password ? (
              <em>{errors.password}</em>
            ) : isSignup ? (
              <small>Au moins 10 caractères. Choisissez une phrase plutôt qu&apos;un mot.</small>
            ) : null}
          </label>

          {errors.form && <p className="form-error">{errors.form}</p>}

          <button className="btn btn-gold" type="submit" disabled={busy}>
            <Icon name="spark" />
            {busy ? "Un instant…" : isSignup ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        <p className="ob-note" style={{ textAlign: "left" }}>
          {isSignup ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}{" "}
          <button
            className="linkish"
            onClick={() => {
              setMode(isSignup ? "login" : "signup");
              setErrors({});
            }}
          >
            {isSignup ? "Se connecter" : "En créer un"}
          </button>
        </p>
      </div>
    </main>
  );
}
