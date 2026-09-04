"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../../lib/RoleGuard";
import { supabase } from "../../../../../lib/supabaseClient";

function Zuweisen() {
  const { worksheetId } = useParams();
  const router = useRouter();
  const [worksheet, setWorksheet] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("worksheets").select("*").eq("id", worksheetId).single().then(({ data }) => setWorksheet(data));
  }, [worksheetId]);

  async function handleSubmit() {
    setSaving(true);
    const { error } = await supabase.from("assignments").insert({
      worksheet_id: worksheetId,
      status: "offen",
      due_date: dueDate || null,
      note_from_pruefer: note.trim() || null,
    });
    setSaving(false);
    setMessage(error ? "Fehler: " + error.message : "Zugewiesen!");
  }

  if (!worksheet) return <p>Lade...</p>;

  return (
    <div>
      <nav className="topnav">
        <a onClick={() => router.back()} style={{ cursor: "pointer" }}>← Zurück</a>
        <LogoutLink />
      </nav>
      <h1>Arbeitsblatt zuweisen</h1>
      <div className="card">
        <strong>{worksheet.title}</strong>
        <label>Fällig bis (optional)</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <label>Hinweis für die Schülerin (optional)</label>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn full" onClick={handleSubmit} disabled={saving}>
          {saving ? "Wird zugewiesen..." : "Zuweisen"}
        </button>
        {message && <p style={{ marginTop: 10 }}>{message}</p>}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <Zuweisen />
    </RoleGuard>
  );
}
