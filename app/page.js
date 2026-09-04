"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkCode, setRole, getRole } from "../lib/auth";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const existing = getRole();
    if (existing === "pruefer") router.replace("/pruefer");
    if (existing === "schuelerin") router.replace("/schuelerin");
  }, [router]);

  function handleSubmit(e) {
    e.preventDefault();
    const role = checkCode(code.trim());
    if (!role) {
      setError("Code nicht erkannt. Bitte nochmal versuchen.");
      return;
    }
    setRole(role);
    router.push(role === "pruefer" ? "/pruefer" : "/schuelerin");
  }

  return (
    <div>
      <h1>📚 Lern-App</h1>
      <p className="subtitle">Bitte gib deinen Code ein, um loszulegen.</p>
      <form onSubmit={handleSubmit} className="card">
        <label htmlFor="code">Code</label>
        <input
          id="code"
          type="text"
          inputMode="text"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="z.B. 1234"
        />
        {error && <p style={{ color: "var(--color-wrong)" }}>{error}</p>}
        <button className="btn full" type="submit">
          Los geht's
        </button>
      </form>
    </div>
  );
}
