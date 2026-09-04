"use client";

import { useEffect, useState } from "react";
import RoleGuard, { LogoutLink } from "../../../lib/RoleGuard";
import { supabase } from "../../../lib/supabaseClient";

const TYPE_LABELS = {
  multiple_choice: "Multiple Choice",
  zahl: "Zahl",
  freitext: "Freitext",
};

function AufgabenListe() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    supabase
      .from("tasks")
      .select("id, type, question, created_at, topics ( name, subjects ( name ) )")
      .order("created_at", { ascending: false })
      .then(({ data }) => setTasks(data || []));
  }, []);

  return (
    <div>
      <nav className="topnav">
        <a href="/pruefer">← Übersicht</a>
        <LogoutLink />
      </nav>
      <h1>Alle Aufgaben</h1>

      <div className="tabbar">
        <a href="/pruefer">Übersicht</a>
        <a className="active" href="/pruefer/aufgaben">Aufgaben</a>
        <a href="/pruefer/zuweisen">Zuweisen</a>
        <a href="/pruefer/pruefen">Prüfen</a>
      </div>

      <a href="/pruefer/aufgaben/neu" className="btn full" style={{ marginBottom: 16, display: "block" }}>
        ➕ Neue Aufgabe
      </a>

      {tasks.length === 0 && <p className="empty-state">Noch keine Aufgaben angelegt.</p>}

      {tasks.map((t) => (
        <div key={t.id} className="card">
          <div style={{ fontSize: "0.8rem", color: "#888" }}>
            {t.topics?.subjects?.name} · {t.topics?.name}
            <span className="badge">{TYPE_LABELS[t.type]}</span>
          </div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>{t.question}</div>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <AufgabenListe />
    </RoleGuard>
  );
}
