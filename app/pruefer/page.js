"use client";

import { useEffect, useState } from "react";
import RoleGuard, { LogoutLink } from "../../lib/RoleGuard";
import { supabase } from "../../lib/supabaseClient";

function PrueferDashboard() {
  const [stats, setStats] = useState({
    offen: 0,
    zuBewerten: 0,
    wiederholungen: 0,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { count: offen } = await supabase
      .from("assignments")
      .select("*", { count: "exact", head: true })
      .eq("status", "offen")
      .eq("is_wiederholung", false);

    const { count: wiederholungen } = await supabase
      .from("assignments")
      .select("*", { count: "exact", head: true })
      .eq("status", "offen")
      .eq("is_wiederholung", true);

    const { count: zuBewerten } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .is("is_correct", null);

    setStats({
      offen: offen || 0,
      wiederholungen: wiederholungen || 0,
      zuBewerten: zuBewerten || 0,
    });
  }

  return (
    <div>
      <nav className="topnav">
        <span>🧑‍🏫 Prüfer-Ansicht</span>
        <LogoutLink />
      </nav>
      <h1>Übersicht</h1>

      <div className="tabbar">
        <a className="active" href="/pruefer">Übersicht</a>
        <a href="/pruefer/aufgaben">Aufgaben</a>
        <a href="/pruefer/zuweisen">Zuweisen</a>
        <a href="/pruefer/pruefen">Prüfen</a>
      </div>

      <div className="card">
        <strong>{stats.offen}</strong> offene neue Aufgabe(n)
      </div>
      <div className="card">
        <strong>{stats.wiederholungen}</strong> offene Wiederholung(en)
      </div>
      <div className="card">
        <strong>{stats.zuBewerten}</strong> Abgabe(n) warten auf deine Bewertung
      </div>

      <h2>Schnellzugriff</h2>
      <a href="/pruefer/aufgaben/neu" className="btn full" style={{ marginBottom: 10, display: "block" }}>
        ➕ Neue Aufgabe erstellen
      </a>
      <a href="/pruefer/zuweisen" className="btn secondary full" style={{ display: "block" }}>
        📌 Aufgabe zuweisen
      </a>
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <PrueferDashboard />
    </RoleGuard>
  );
}
