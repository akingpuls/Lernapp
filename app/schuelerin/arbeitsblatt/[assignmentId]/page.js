"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../lib/RoleGuard";
import { supabase } from "../../../../lib/supabaseClient";
import { TaskInput, ImageFeedback, gradeAnswer, isAutoGraded } from "../../../../lib/TaskInput";
import MathText from "../../../../lib/MathText";

function ArbeitsblattLoesen() {
  const { assignmentId } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);
  const [worksheet, setWorksheet] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  async function load() {
    setLoading(true);
    const { data: a } = await supabase
      .from("assignments")
      .select("id, note_from_pruefer, worksheet_id")
      .eq("id", assignmentId)
      .single();
    setAssignment(a);

    const { data: ws } = await supabase.from("worksheets").select("*").eq("id", a.worksheet_id).single();
    setWorksheet(ws);

    const { data: topic } = await supabase.from("topics").select("subject_id").eq("id", ws.topic_id).single();
    setSubjectId(topic?.subject_id);

    const { data: t } = await supabase.from("tasks").select("*").eq("worksheet_id", a.worksheet_id).order("id");
    setTasks(t || []);
    setLoading(false);
  }

  function setAnswer(taskId, val) {
    setAnswers((prev) => ({ ...prev, [taskId]: val }));
  }

  async function handleSubmitAll() {
    setError("");
    for (const t of tasks) {
      if (!answers[t.id] || !String(answers[t.id]).trim()) {
        setError("Bitte beantworte alle Aufgaben, bevor du abgibst.");
        return;
      }
    }
    setSubmitting(true);

    const newResults = {};
    let correctCount = 0;
    let autoGradedCount = 0;

    for (const t of tasks) {
      const answer = answers[t.id];
      const autoGraded = isAutoGraded(t);
      let isCorrect = null;
      if (autoGraded) {
        isCorrect = gradeAnswer(t, answer);
        autoGradedCount++;
        if (isCorrect) correctCount++;
      }

      await supabase.from("submissions").insert({
        assignment_id: assignment.id,
        task_id: t.id,
        answer,
        is_correct: isCorrect,
        auto_graded: autoGraded,
        is_wiederholung: false,
      });

      if (autoGraded) {
        if (isCorrect) {
          const { data: existing } = await supabase
            .from("mistake_queue")
            .select("id")
            .eq("task_id", t.id)
            .eq("resolved", false)
            .maybeSingle();
          if (existing) {
            await supabase
              .from("mistake_queue")
              .update({ resolved: true, resolved_at: new Date().toISOString() })
              .eq("id", existing.id);
          }
        } else {
          const { data: existing } = await supabase
            .from("mistake_queue")
            .select("id, times_wrong")
            .eq("task_id", t.id)
            .eq("resolved", false)
            .maybeSingle();
          if (existing) {
            await supabase
              .from("mistake_queue")
              .update({ times_wrong: existing.times_wrong + 1, last_wrong_at: new Date().toISOString() })
              .eq("id", existing.id);
          } else {
            await supabase.from("mistake_queue").insert({ task_id: t.id });
          }
        }
      }

      newResults[t.id] = { isCorrect, autoGraded };
    }

    await supabase.from("assignments").update({ status: "erledigt" }).eq("id", assignment.id);

    setResults({ perTask: newResults, correctCount, autoGradedCount });
    setSubmitting(false);
  }

  if (loading) return <p>Lade...</p>;
  if (!assignment || !worksheet) return <p>Arbeitsblatt nicht gefunden.</p>;

  return (
    <div>
      <nav className="topnav">
        <a onClick={() => router.back()} style={{ cursor: "pointer" }}>← Zurück</a>
        <LogoutLink />
      </nav>
      <h1>{worksheet.title}</h1>
      {worksheet.description && <p className="subtitle">{worksheet.description}</p>}
      {assignment.note_from_pruefer && !results && (
        <div className="feedback-box">Hinweis: {assignment.note_from_pruefer}</div>
      )}

      {tasks.map((t, i) => {
        const res = results?.perTask?.[t.id];
        return (
          <div key={t.id} className="card">
            <div style={{ fontSize: "0.85rem", color: "#888" }}>Aufgabe {i + 1}</div>
            <div style={{ fontWeight: 600, margin: "6px 0 12px" }}>
              <MathText text={t.question} />
            </div>
            <TaskInput
              task={t}
              value={answers[t.id]}
              onChange={(v) => setAnswer(t.id, v)}
            />
            {results && t.type === "bild_klick" && <ImageFeedback task={t} answer={answers[t.id]} />}
            {res && (
              <div style={{ marginTop: 8 }}>
                {res.autoGraded ? (
                  res.isCorrect ? (
                    <p className="result-correct">Richtig!</p>
                  ) : (
                    <p className="result-wrong">Leider falsch.</p>
                  )
                ) : (
                  <p style={{ color: "#888" }}>Wird von deinem Prüfer bewertet.</p>
                )}
                {t.explanation && (
                  <div className="feedback-box">
                    <MathText text={t.explanation} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {error && <div className="error-box">{error}</div>}

      {!results && (
        <button className="btn full" onClick={handleSubmitAll} disabled={submitting}>
          {submitting ? "Wird abgegeben..." : "Arbeitsblatt abgeben"}
        </button>
      )}

      {results && (
        <div className="card">
          <strong>Abgegeben!</strong>
          {results.autoGradedCount > 0 && (
            <p>
              {results.correctCount} von {results.autoGradedCount} automatisch bewerteten Aufgaben richtig.
            </p>
          )}
          <button className="btn full" style={{ marginTop: 8 }} onClick={() => router.push(subjectId ? `/schuelerin/fach/${subjectId}` : "/schuelerin")}>
            Zurück zu den Arbeitsblättern
          </button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="schuelerin">
      <ArbeitsblattLoesen />
    </RoleGuard>
  );
}
