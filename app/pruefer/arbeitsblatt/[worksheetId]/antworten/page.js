"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../../lib/RoleGuard";
import { supabase } from "../../../../../lib/supabaseClient";
import { ImageFeedback } from "../../../../../lib/TaskInput";
import MathText from "../../../../../lib/MathText";

function AntwortenAnsehen() {
  const { worksheetId } = useParams();
  const router = useRouter();
  const [worksheet, setWorksheet] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId]);

  async function load() {
    setLoading(true);
    const { data: ws } = await supabase.from("worksheets").select("*").eq("id", worksheetId).single();
    setWorksheet(ws);

    const { data: t } = await supabase.from("tasks").select("*").eq("worksheet_id", worksheetId).order("id");
    setTasks(t || []);

    const taskIds = (t || []).map((x) => x.id);
    if (taskIds.length > 0) {
      const { data: subs } = await supabase
        .from("submissions")
        .select("*")
        .in("task_id", taskIds)
        .order("submitted_at", { ascending: true });
      setSubmissions(subs || []);

      const subIds = (subs || []).map((s) => s.id);
      if (subIds.length > 0) {
        const { data: fb } = await supabase.from("feedback").select("*").in("submission_id", subIds);
        setFeedback(fb || []);
      }
    }
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

  if (loading) return <p>Lade...</p>;
  if (!worksheet) return <p>Arbeitsblatt nicht gefunden.</p>;

  const byAssignment = new Map();
  const wdhSubs = [];
  submissions.forEach((s) => {
    if (s.assignment_id) {
      if (!byAssignment.has(s.assignment_id)) byAssignment.set(s.assignment_id, []);
      byAssignment.get(s.assignment_id).push(s);
    } else {
      wdhSubs.push(s);
    }
  });

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  function renderRow(sub) {
    const task = taskMap.get(sub.task_id);
    if (!task) return null;
    const needsGrading = sub.is_correct === null && !sub.auto_graded;
    const fbList = feedback.filter((f) => f.submission_id === sub.id);

    return (
      <div key={sub.id} style={{ padding: "8px 0", borderTop: "1px solid #eee" }}>
        <div style={{ fontWeight: 600 }}><MathText text={task.question} /></div>
        {task.type === "bild_klick" ? (
          <ImageFeedback task={task} answer={sub.answer} />
        ) : (
          <div style={{ marginTop: 4 }}><strong>Antwort:</strong> {sub.answer}</div>
        )}
        {sub.is_correct === true && <p className="result-correct">richtig</p>}
        {sub.is_correct === false && <p className="result-wrong">falsch</p>}
        {task.explanation && (
          <div className="feedback-box"><strong>Musterlösung/Erklärung:</strong> <MathText text={task.explanation} /></div>
        )}
        {needsGrading && (
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => grade(sub.id, true, task.id)}>Als richtig markieren</button>
            <button className="btn secondary" onClick={() => grade(sub.id, false, task.id)}>Als falsch markieren</button>
          </div>
        )}
        {fbList.map((f) => (
          <div key={f.id} className="feedback-box">{f.comment}</div>
        ))}
        <textarea
          rows={2}
          placeholder="Anmerkung schreiben..."
          value={comments[sub.id] || ""}
          onChange={(e) => setComments((c) => ({ ...c, [sub.id]: e.target.value }))}
          style={{ marginTop: 8 }}
        />
        <button className="btn secondary" onClick={() => addComment(sub.id)}>Anmerkung speichern</button>
      </div>
    );
  }

  return (
    <div>
      <nav className="topnav">
        <a onClick={() => router.back()} style={{ cursor: "pointer" }}>← Zurück</a>
        <LogoutLink />
      </nav>
      <h1>{worksheet.title}</h1>
      <p className="subtitle">Alle bisher eingegangenen Antworten zu diesem Arbeitsblatt.</p>

      {submissions.length === 0 && <p className="empty-state">Noch keine Antworten zu diesem Arbeitsblatt.</p>}

      {[...byAssignment.entries()].map(([assignmentId, subs]) => (
        <div key={assignmentId} className="card">
          <strong>Abgabe vom {new Date(subs[0].submitted_at).toLocaleDateString("de-DE")}</strong>
          <div style={{ marginTop: 8 }}>{tasks.map((t) => renderRow(subs.find((s) => s.task_id === t.id)))}</div>
        </div>
      ))}

      {wdhSubs.length > 0 && (
        <div className="card wiederholung">
          <strong>Antworten aus Wiederholungen</strong>
          <div style={{ marginTop: 8 }}>{wdhSubs.map((s) => renderRow(s))}</div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <AntwortenAnsehen />
    </RoleGuard>
  );
}
