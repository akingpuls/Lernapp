"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard, { LogoutLink } from "../../lib/RoleGuard";
import { supabase } from "../../lib/supabaseClient";

function PrueferDashboard() {
  const [stats, setStats] = useState({ offen: 0, zuBewerten: 0 });
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: subjectsData } = await supabase.from("subjects").select("*").order("sort_order");
    setSubjects(subjectsData || []);

    const { count: offen } = await supabase
      .from("assignments")
      .select("*", { count: "exact", head: true })
      .eq("status", "offen");

    const { count: zuBewerten } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .is("is_correct", null);

    setStats({ offen: offen || 0, zuBewerten: zuBewerten || 0 });
  }

  return (
    <div>
      <nav className="topnav">
        <span>Prüfer-Ansicht</span>
        <LogoutLink />
      </nav>
      <h1>Übersicht</h1>

      <div className="tabbar">
        <a className="active">Übersicht</a>
        <Link href="/pruefer/pruefen">Prüfen</Link>
      </div>

      <div className="card"><strong>{stats.offen}</strong> offene Arbeitsblatt-Zuweisung(en)</div>
      <div className="card"><strong>{stats.zuBewerten}</strong> Abgabe(n) warten auf deine Bewertung</div>

      <h2>Fächer</h2>
      {subjects.map((s) => (
        <Link
          key={s.id}
          href={`/pruefer/fach/${s.id}`}
          className="card clickable fach-card"
          style={{ display: "flex", textDecoration: "none", color: "inherit" }}
        >
          <strong>{s.name}</strong>
          <span>›</span>
        </Link>
      ))}
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
