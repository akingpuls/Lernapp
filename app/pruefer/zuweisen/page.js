"use client";

import { useEffect, useState } from "react";
import RoleGuard, { LogoutLink } from "../../../lib/RoleGuard";
import { supabase } from "../../../lib/supabaseClient";

function ZuweisenSeite() {
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("tasks")
      .select("id, question, topics ( name, subjects ( name ) )")
      .order("created_at", { ascending: false })
      .then(({ data }) => setTasks(data || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("assignments").insert({
      task_id: taskId,
      due_date: dueDate || null,
      note_from_pruefer: note || null,
      status: "offen",
      is_wiederholung: false,
    });
    setSaving(false);
    setMessage(error ? "Fehler: " + error.message : "✅ Aufgabe zugewiesen!");
    if (!error) {
      setTaskId("");
      setDueDate("");
      setNote("");
    }
  }

  return (
    <div>
      <nav className="topnav">
        <a href="/pruefer">← Übersicht</a>
        <LogoutLink />
      </nav>
      <h1>Aufgabe zuweisen</h1>

      <div className="tabbar">
        <a href="/pruefer">Übersicht</a>
        <a href="/pruefer/aufgaben">Aufgaben</a>
        <a className="active" href="/pruefer/zuweisen">Zuweisen</a>
        <a href="/pruefer/pruefen">Prüfen</a>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <label>Aufgabe</label>
        <select value={taskId} onChange={(e) => setTaskId(e.target.value)} required>
          <option value="">Bitte wählen...</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              [{t.topics?.subjects?.name}] {t.question.slice(0, 50)}
            </option>
          ))}
        </select>

        <label>Fällig bis (optional)</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

        <label>Hinweis für die Schülerin (optional)</label>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />

        <button className="btn full" type="submit" disabled={saving || !taskId}>
          {saving ? "Wird zugewiesen..." : "Zuweisen"}
        </button>
        {message && <p style={{ marginTop: 10 }}>{message}</p>}
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <ZuweisenSeite />
    </RoleGuard>
  );
}
