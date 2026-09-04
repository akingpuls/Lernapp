"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard, { LogoutLink } from "../../../lib/RoleGuard";
import { supabase } from "../../../lib/supabaseClient";
import { ImageFeedback } from "../../../lib/TaskInput";
import MathText from "../../../lib/MathText";

function Pruefen() {
  const [rows, setRows] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: submissions } = await supabase
      .from("submissions")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(50);

    const taskIds = [...new Set((submissions || []).map((s) => s.task_id))];
    const { data: tasks } = taskIds.length
      ? await supabase.from("tasks").select("*").in("id", taskIds)
      : { data: [] };
    const taskMap = new Map((tasks || []).map((t) => [t.id, t]));

    const worksheetIds = [...new Set((tasks || []).map((t) => t.worksheet_id))];
    const { data: worksheets } = worksheetIds.length
      ? await supabase.from("worksheets").select("*").in("id", worksheetIds)
      : { data: [] };
    const worksheetMap = new Map((worksheets || []).map((w) => [w.id, w]));

    const topicIds = [...new Set((worksheets || []).map((w) => w.topic_id))];
    const { data: topics } = topicIds.length
      ? await supabase.from("topics").select("*").in("id", topicIds)
      : { data: [] };
    const topicMap = new Map((topics || []).map((t) => [t.id, t]));

    const subjectIds = [...new Set((topics || []).map((t) => t.subject_id))];
    const { data: subjects } = subjectIds.length
      ? await supabase.from("subjects").select("*").in("id", subjectIds)
      : { data: [] };
    const subjectMap = new Map((subjects || []).map((s) => [s.id, s]));

    const subIds = (submissions || []).map((s) => s.id);
    const { data: feedbackData } = subIds.length
      ? await supabase.from("feedback").select("*").in("submission_id", subIds)
      : { data: [] };

    const merged = (submissions || []).map((s) => {
      const task = taskMap.get(s.task_id);
      const worksheet = task ? worksheetMap.get(task.worksheet_id) : null;
      const topic = worksheet ? topicMap.get(worksheet.topic_id) : null;
      const subject = topic ? subjectMap.get(topic.subject_id) : null;
      return {
        ...s,
        task,
        worksheet,
        subject,
        feedback: (feedbackData || []).filter((f) => f.submission_id === s.id),
      };
    });

    setRows(merged);
    setLoading(false);
  }

  async function grade(submissionId, correct, taskId) {
    await supabase.from("submissions").update({ is_correct: correct }).eq("id", submissionId);
    if (!correct) {
      const { data: existing } = await supabase
        .from("mistake_queue")
        .select("id, times_wrong")
        .eq("task_id", taskId)
        .eq("resolved", false)
        .maybeSingle();
      if (existing) {
        await supabase.from("mistake_queue").update({ times_wrong: existing.times_wrong + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("mistake_queue").insert({ task_id: taskId });
      }
    }
    load();
  }

  async function addComment(submissionId) {
    const text = comments[submissionId];
    if (!text || !text.trim()) return;
    await supabase.from("feedback").insert({ submission_id: submissionId, comment: text.trim() });
    setComments((c) => ({ ...c, [submissionId]: "" }));
    load();
  }

  return (
    <div>
      <nav className="topnav">
        <span>Prüfer-Ansicht</span>
        <LogoutLink />
      </nav>
      <h1>Abgaben prüfen</h1>
      <div className="tabbar">
        <Link href="/pruefer">Übersicht</Link>
        <a className="active">Prüfen</a>
      </div>

      {loading && <p>Lade...</p>}
      {!loading && rows.length === 0 && <p className="empty-state">Noch keine Abgaben.</p>}

      {rows.map((s) => {
        if (!s.task) return null;
        const needsGrading = s.is_correct === null && !s.auto_graded;
        return (
          <div key={s.id} className="card">
            <div style={{ fontSize: "0.8rem", color: "#888" }}>
              {s.subject?.name} · {s.worksheet?.title}
              {s.is_wiederholung && <span className="badge">Wiederholung</span>}
            </div>
            <div style={{ fontWeight: 600, marginTop: 4 }}><MathText text={s.task.question} /></div>
            {s.task.type === "bild_klick" ? (
              <ImageFeedback task={s.task} answer={s.answer} />
            ) : (
              <div style={{ marginTop: 6 }}><strong>Antwort:</strong> {s.answer}</div>
            )}
            {s.is_correct === true && <p className="result-correct">richtig</p>}
            {s.is_correct === false && <p className="result-wrong">falsch</p>}
            {s.task.explanation && (
              <div className="feedback-box"><strong>Musterlösung/Erklärung:</strong> <MathText text={s.task.explanation} /></div>
            )}
            {needsGrading && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => grade(s.id, true, s.task.id)}>Als richtig markieren</button>
                <button className="btn secondary" onClick={() => grade(s.id, false, s.task.id)}>Als falsch markieren</button>
              </div>
            )}
            {s.feedback.map((f) => (
              <div key={f.id} className="feedback-box">{f.comment}</div>
            ))}
            <textarea
              rows={2}
              placeholder="Anmerkung schreiben..."
              value={comments[s.id] || ""}
              onChange={(e) => setComments((c) => ({ ...c, [s.id]: e.target.value }))}
              style={{ marginTop: 8 }}
            />
            <button className="btn secondary" onClick={() => addComment(s.id)}>Anmerkung speichern</button>
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <Pruefen />
    </RoleGuard>
  );
}
