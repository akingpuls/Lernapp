"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../lib/RoleGuard";
import { supabase } from "../../../../lib/supabaseClient";

function AufgabeSeite() {
  const { id } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null); // { correct: bool|null, explanation }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("assignments")
      .select(
        `id, status, is_wiederholung, note_from_pruefer,
         tasks ( id, type, question, options, correct_answer, explanation,
                 topics ( name, subjects ( name ) ) )`
      )
      .eq("id", id)
      .single();
    if (!error) setAssignment(data);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!answer.trim() || submitting) return;
    setSubmitting(true);

    const task = assignment.tasks;
    let isCorrect = null;
    let autoGraded = false;

    if (task.type === "multiple_choice" || task.type === "zahl") {
      autoGraded = true;
      const normalize = (s) => s.trim().toLowerCase().replace(",", ".");
      isCorrect = normalize(answer) === normalize(task.correct_answer || "");
    }

    const { error: subError } = await supabase.from("submissions").insert({
      assignment_id: assignment.id,
      answer,
      is_correct: isCorrect,
      auto_graded: autoGraded,
    });

    if (subError) {
      setSubmitting(false);
      return;
    }

    // Bei Freitext: Prüfer muss noch bewerten -> Aufgabe erst nach Bewertung "erledigt"
    // Bei automatisch bewerteten Aufgaben: sofort auswerten + Fehlerspeicher pflegen
    if (autoGraded) {
      await supabase
        .from("assignments")
        .update({ status: "erledigt" })
        .eq("id", assignment.id);

      if (isCorrect) {
        if (assignment.is_wiederholung) {
          await supabase
            .from("mistake_queue")
            .update({ resolved: true, resolved_at: new Date().toISOString() })
            .eq("task_id", task.id)
            .eq("resolved", false);
        }
      } else {
        await registerMistakeAndReassign(task.id);
      }
    } else {
      await supabase
        .from("assignments")
        .update({ status: "erledigt" })
        .eq("id", assignment.id);
    }

    setResult({ correct: isCorrect, explanation: task.explanation, autoGraded });
    setSubmitting(false);
  }

  async function registerMistakeAndReassign(taskId) {
    // Fehlerspeicher aktualisieren (times_wrong hochzählen oder neu anlegen)
    const { data: existing } = await supabase
      .from("mistake_queue")
      .select("id, times_wrong")
      .eq("task_id", taskId)
      .eq("resolved", false)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("mistake_queue")
        .update({
          times_wrong: existing.times_wrong + 1,
          last_wrong_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("mistake_queue").insert({ task_id: taskId });
    }

    // Neue Wiederholungs-Zuweisung anlegen, damit die Aufgabe wieder auftaucht
    await supabase.from("assignments").insert({
      task_id: taskId,
      is_wiederholung: true,
      status: "offen",
    });
  }

  if (loading) return <p>Lade...</p>;
  if (!assignment) return <p>Aufgabe nicht gefunden.</p>;

  const task = assignment.tasks;

  return (
    <div>
      <nav className="topnav">
        <a href="/schuelerin" onClick={(e) => { e.preventDefault(); router.push("/schuelerin"); }}>
          ← Zurück
        </a>
        <LogoutLink />
      </nav>

      <div style={{ fontSize: "0.85rem", color: "#888" }}>
        {task.topics?.subjects?.name} {task.topics?.name ? `· ${task.topics.name}` : ""}
      </div>
      <h1>{task.question}</h1>

      {assignment.note_from_pruefer && !result && (
        <div className="feedback-box">💬 Hinweis: {assignment.note_from_pruefer}</div>
      )}

      {!result && (
        <form onSubmit={handleSubmit} className="card">
          {task.type === "multiple_choice" && (
            <>
              {(task.options || []).map((opt, i) => (
                <label key={i} className="option-row" style={{ fontWeight: 400 }}>
                  <input
                    type="radio"
                    name="mc"
                    value={opt}
                    checked={answer === opt}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </>
          )}

          {task.type === "zahl" && (
            <input
              type="text"
              inputMode="decimal"
              placeholder="Deine Antwort (Zahl)"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          )}

          {task.type === "freitext" && (
            <textarea
              rows={5}
              placeholder="Schreib deine Antwort hier..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          )}

          <button className="btn full" type="submit" disabled={submitting || !answer}>
            {submitting ? "Wird gespeichert..." : "Abgeben"}
          </button>
        </form>
      )}

      {result && (
        <div className="card">
          {result.autoGraded ? (
            result.correct ? (
              <p className="result-correct">✅ Richtig, super gemacht!</p>
            ) : (
              <p className="result-wrong">❌ Das war leider nicht richtig.</p>
            )
          ) : (
            <p>📨 Antwort abgegeben. Dein Prüfer schaut sie sich bald an.</p>
          )}

          {result.explanation && (
            <div className="feedback-box">💡 {result.explanation}</div>
          )}

          {!result.correct && result.autoGraded && (
            <p style={{ fontSize: "0.9rem", color: "#888" }}>
              Diese Aufgabe kommt bald zur Wiederholung wieder.
            </p>
          )}

          <a href="/schuelerin" className="btn full" style={{ marginTop: 12 }}
             onClick={(e) => { e.preventDefault(); router.push("/schuelerin"); }}>
            Weiter zu den Aufgaben
          </a>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="schuelerin">
      <AufgabeSeite />
    </RoleGuard>
  );
}
