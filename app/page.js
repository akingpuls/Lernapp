"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { signIn, fetchRole } from "../lib/supabaseAuth";

const ROLE_LABELS = {
  schuelerin: "Schülerin",
  pruefer: "Prüfer",
};

export default function LoginPage() {
  const [step, setStep] = useState("role"); // "role" | "credentials"
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session) {
        const role = await fetchRole(data.session.user.id);
        if (!active) return;
        if (role === "pruefer") { router.replace("/pruefer"); return; }
        if (role === "schuelerin") { router.replace("/schuelerin"); return; }
      }
      setCheckingSession(false);
    });
    return () => { active = false; };
  }, [router]);

  function chooseRole(role) {
    setSelectedRole(role);
    setStep("credentials");
    setError("");
  }

  function goBack() {
    setStep("role");
    setSelectedRole(null);
    setError("");
    setEmail("");
    setPassword("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.role !== selectedRole) {
      setError(
        `Diese Zugangsdaten gehören zur Rolle "${ROLE_LABELS[result.role]}", nicht zu "${ROLE_LABELS[selectedRole]}". Bitte wähle oben die richtige Rolle aus.`
      );
      await supabase.auth.signOut();
      return;
    }

    router.push(result.role === "pruefer" ? "/pruefer" : "/schuelerin");
  }

  if (checkingSession) return null;

  return (
    <div>
      <h1>📚 Lotta's Lern-App</h1>

      {step === "role" && (
        <>
          <p className="subtitle">Wer bist du?</p>
          <div className="card">
            <button className="btn full" onClick={() => chooseRole("schuelerin")} style={{ marginBottom: 10 }}>
              Ich bin die Schülerin
            </button>
            <button className="btn secondary full" onClick={() => chooseRole("pruefer")}>
              Ich bin der Prüfer / die Prüferin
            </button>
          </div>
        </>
      )}

      {step === "credentials" && (
        <>
          <p className="subtitle">Anmeldung als {ROLE_LABELS[selectedRole]}</p>
          <form onSubmit={handleSubmit} className="card">
            <label htmlFor="email">E-Mail</label>
            <input
              id="email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@beispiel.de"
              required
            />
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p style={{ color: "var(--color-wrong)" }}>{error}</p>}
            <button className="btn full" type="submit" disabled={loading}>
              {loading ? "Anmelden..." : "Anmelden"}
            </button>
            <button type="button" className="btn secondary full" style={{ marginTop: 8 }} onClick={goBack}>
              ← Zurück
            </button>
          </form>
        </>
      )}
    </div>
  );
}
