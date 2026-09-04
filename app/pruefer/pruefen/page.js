"use client";

import { useEffect, useState } from "react";
import RoleGuard, { LogoutLink } from "../../../lib/RoleGuard";
import { supabase } from "../../../lib/supabaseClient";

function PruefenSeite() {
  const [submissions, setSubmissions] = useState([]);
  const [comments, setComments] = useState({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("submissions")
      .select(
        `id, answer, is_correct, auto_graded, submitted_at,
         assignments ( id, task_id,
           tasks ( question, type, topics ( name, subjects ( name ) ) ) ),
         feedback ( id, comment, created_at )`
      )
      .order("submitted_at", { ascending: false })
      .limit(30);
    setSubmissions(data || []);
  }

  async function grade(submissionId, correct, assignmentTaskId) {
    await supabase
      .from("submissions")
      .update({ is_correct: correct })
      .eq("id", submissionId);

    if (!correct) {
      const { data: existing } = await supabase
        .from("mistake_queue")
        .select("id, times_wrong")
        .eq("task_id", assignmentTaskId)
        .eq("resolved", false)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("mistake_queue")
          .update({ times_wrong: existing.times_wrong + 1, last_wrong_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("mistake_queue").insert({ task_id: assignmentTaskId });
      }

      await supabase.from("assignments").insert({
        task_id: assignmentTaskId,
        is_wiederholung: true,
        status: "offen",
      });
    }

    load();
  }

  async function addComment(submissionId) {
    const text = comments[submissionId];
    if (!text || !text.trim()) return;
    await supabase.from("feedback").insert({ submission_id: submissionId, comment: text });
    setComments((c) => ({ ...c, [submissionId]: "" }));
    load();
  }

  return (
    <div>
      <nav className="topnav">
        <a href="/pruefer">← Übersicht</a>
        <LogoutLink />
      </nav>
      <h1>Abgaben prüfen</h1>

      <div className="tabbar">
        <a href="/pruefer">Übersicht</a>
        <a href="/pruefer/aufgaben">Aufgaben</a>
        <a href="/pruefer/zuweisen">Zuweisen</a>
        <a className="active" href="/pruefer/pruefen">Prüfen</a>
      </div>

      {submissions.length === 0 && <p className="empty-state">Noch keine Abgaben.</p>}

      {submissions.map((s) => {
        const task = s.assignments?.tasks;
        const needsGrading = s.is_correct === null && !s.auto_graded;
        return (
          <div key={s.id} className="card">
            <div style={{ fontSize: "0.8rem", color: "#888" }}>
              {task?.topics?.subjects?.name} · {task?.topics?.name}
            </div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{task?.question}</div>
            <div style={{ marginTop: 6 }}>
              <strong>Antwort:</strong> {s.answer}
            </div>

            {s.is_correct === true && <p className="result-correct">✅ richtig</p>}
            {s.is_correct === false && <p className="result-wrong">❌ falsch</p>}

            {needsGrading && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => grade(s.id, true, s.assignments.task_id)}>
                  Als richtig markieren
                </button>
                <button className="btn secondary" onClick={() => grade(s.id, false, s.assignments.task_id)}>
                  Als falsch markieren
                </button>
              </div>
            )}

            {(s.feedback || []).map((f) => (
              <div key={f.id} className="feedback-box">💬 {f.comment}</div>
            ))}

            <textarea
              rows={2}
              placeholder="Anmerkung schreiben..."
              value={comments[s.id] || ""}
              onChange={(e) => setComments((c) => ({ ...c, [s.id]: e.target.value }))}
              style={{ marginTop: 8 }}
            />
            <button className="btn secondary" onClick={() => addComment(s.id)}>
              Anmerkung speichern
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <PruefenSeite />
    </RoleGuard>
  );
}
