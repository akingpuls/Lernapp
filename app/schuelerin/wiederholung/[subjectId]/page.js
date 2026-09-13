"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../lib/RoleGuard";
import { supabase } from "../../../../lib/supabaseClient";
import { TaskInput, ImageFeedback, gradeAnswer, isAutoGraded } from "../../../../lib/TaskInput";
import MathText from "../../../../lib/MathText";

function WiederholungLoesen() {
  const { subjectId } = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  async function load() {
    setLoading(true);
    const { data: s } = await supabase.from("subjects").select("*").eq("id", subjectId).single();
    setSubject(s);

    const { data: topics } = await supabase.from("topics").select("id").eq("subject_id", subjectId);
    const topicIds = (topics || []).map((t) => t.id);
    let worksheetIds = [];
    if (topicIds.length > 0) {
      const { data: worksheets } = await supabase.from("worksheets").select("id").in("topic_id", topicIds);
      worksheetIds = (worksheets || []).map((w) => w.id);
    }

    let allTasks = [];
    if (worksheetIds.length > 0) {
      const { data: t } = await supabase.from("tasks").select("*").in("worksheet_id", worksheetIds);
      allTasks = t || [];
    }

    const { data: mistakes } = await supabase.from("mistake_queue").select("task_id").eq("resolved", false);
    const mistakeTaskIds = new Set((mistakes || []).map((m) => m.task_id));

    setTasks(allTasks.filter((t) => mistakeTaskIds.has(t.id)));
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
        assignment_id: null,
        task_id: t.id,
        answer,
        is_correct: isCorrect,
        auto_graded: autoGraded,
        is_wiederholung: true,
      });

      if (autoGraded) {
        const { data: existing } = await supabase
          .from("mistake_queue")
          .select("id, times_wrong")
          .eq("task_id", t.id)
          .eq("resolved", false)
          .maybeSingle();

        if (isCorrect) {
          if (existing) {
            await supabase
              .from("mistake_queue")
              .update({ resolved: true, resolved_at: new Date().toISOString() })
              .eq("id", existing.id);
          }
        } else if (existing) {
          await supabase
            .from("mistake_queue")
            .update({ times_wrong: existing.times_wrong + 1, last_wrong_at: new Date().toISOString() })
            .eq("id", existing.id);
        }
      }

      newResults[t.id] = { isCorrect, autoGraded };
    }

    setResults({ perTask: newResults, correctCount, autoGradedCount });
    setSubmitting(false);
  }

  if (loading) return <p>Lade...</p>;

  return (
    <div>
      <nav className="topnav">
        <a onClick={() => router.push(`/schuelerin/fach/${subjectId}`)} style={{ cursor: "pointer" }}>← Zurück</a>
        <LogoutLink />
      </nav>
      <div style={{ fontSize: "0.85rem", color: "#888" }}>{subject?.name}</div>
      <h1>Wiederholung</h1>
      <p className="subtitle">Diese Aufgaben hattest du vorher falsch beantwortet. Versuch es nochmal!</p>

      {tasks.length === 0 && <p className="empty-state">Keine Wiederholungsaufgaben mehr - super!</p>}

      {tasks.map((t, i) => {
        const res = results?.perTask?.[t.id];
        return (
          <div key={t.id} className="card">
            <div style={{ fontSize: "0.85rem", color: "#888" }}>Aufgabe {i + 1}</div>
            <div style={{ fontWeight: 600, margin: "6px 0 12px" }}>
              <MathText text={t.question} />
            </div>
            <TaskInput task={t} value={answers[t.id]} onChange={(v) => setAnswer(t.id, v)} />
            {results && t.type === "bild_klick" && <ImageFeedback task={t} answer={answers[t.id]} />}
            {res && (
              <div style={{ marginTop: 8 }}>
                {res.autoGraded ? (
                  res.isCorrect ? <p className="result-correct">Richtig!</p> : <p className="result-wrong">Leider falsch.</p>
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

      {!results && tasks.length > 0 && (
        <button className="btn full" onClick={handleSubmitAll} disabled={submitting}>
          {submitting ? "Wird abgegeben..." : "Antworten abgeben"}
        </button>
      )}

      {results && (
        <div className="card">
          <strong>Abgegeben!</strong>
          {results.autoGradedCount > 0 && (
            <p>{results.correctCount} von {results.autoGradedCount} richtig.</p>
          )}
          <button className="btn full" style={{ marginTop: 8 }} onClick={() => router.push(`/schuelerin/fach/${subjectId}`)}>
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
      <WiederholungLoesen />
    </RoleGuard>
  );
}
