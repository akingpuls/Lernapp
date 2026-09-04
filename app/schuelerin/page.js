"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard, { LogoutLink } from "../../lib/RoleGuard";
import { supabase } from "../../lib/supabaseClient";

function SchuelerinDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("assignments")
      .select(
        `id, due_date, status, is_wiederholung, note_from_pruefer,
         tasks ( id, type, question, topics ( name, subjects ( name ) ) )`
      )
      .eq("status", "offen")
      .order("is_wiederholung", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false });

    if (!error) setAssignments(data || []);
    setLoading(false);
  }

  const neueAufgaben = assignments.filter((a) => !a.is_wiederholung);
  const wiederholungen = assignments.filter((a) => a.is_wiederholung);

  return (
    <div>
      <nav className="topnav">
        <span>👋 Hallo!</span>
        <LogoutLink />
      </nav>
      <h1>Deine Aufgaben</h1>
      <p className="subtitle">Hier siehst du, was gerade zu tun ist.</p>

      {loading && <p>Lade...</p>}

      {!loading && wiederholungen.length > 0 && (
        <>
          <h2>🔁 Wiederholen</h2>
          {wiederholungen.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </>
      )}

      {!loading && (
        <>
          <h2>📝 Neue Aufgaben</h2>
          {neueAufgaben.length === 0 && (
            <p className="empty-state">Aktuell keine offenen Aufgaben. Gut gemacht!</p>
          )}
          {neueAufgaben.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </>
      )}
    </div>
  );
}

function AssignmentCard({ assignment }) {
  const task = assignment.tasks;
  const fach = task?.topics?.subjects?.name;
  const thema = task?.topics?.name;

  return (
    <Link
      href={`/schuelerin/aufgabe/${assignment.id}`}
      className={`card ${assignment.is_wiederholung ? "wiederholung" : ""}`}
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div style={{ fontSize: "0.8rem", color: "#888" }}>
        {fach} {thema ? `· ${thema}` : ""}
      </div>
      <div style={{ fontWeight: 600, marginTop: 4 }}>{task?.question}</div>
      {assignment.note_from_pruefer && (
        <div className="feedback-box">💬 {assignment.note_from_pruefer}</div>
      )}
      {assignment.due_date && (
        <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 6 }}>
          Fällig bis {assignment.due_date}
        </div>
      )}
    </Link>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="schuelerin">
      <SchuelerinDashboard />
    </RoleGuard>
  );
}
