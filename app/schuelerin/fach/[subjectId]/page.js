"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RoleGuard, { LogoutLink } from "../../../../lib/RoleGuard";
import { supabase } from "../../../../lib/supabaseClient";
import { todayISO, isDue } from "../../../../lib/leitner";

function SchuelerinArbeitsblaetter() {
  const { subjectId } = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [dueVocabCount, setDueVocabCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  async function load() {
    setLoading(true);
    const { data: subjectData } = await supabase.from("subjects").select("*").eq("id", subjectId).single();
    setSubject(subjectData);

    const { data: topics } = await supabase.from("topics").select("id").eq("subject_id", subjectId);
    const topicIds = (topics || []).map((t) => t.id);

    let worksheetIds = [];
    if (topicIds.length > 0) {
      const { data: worksheets } = await supabase.from("worksheets").select("id").in("topic_id", topicIds);
      worksheetIds = (worksheets || []).map((w) => w.id);
    }

    if (worksheetIds.length > 0) {
      const { data: assignmentData } = await supabase
        .from("assignments")
        .select("id, due_date, note_from_pruefer, worksheets(id, title, description)")
        .eq("status", "offen")
        .in("worksheet_id", worksheetIds);
      setAssignments(assignmentData || []);

      const { data: tasks } = await supabase.from("tasks").select("id, type, correct_answer").in("worksheet_id", worksheetIds);
      const taskIds = (tasks || []).map((t) => t.id);
      if (taskIds.length > 0) {
        const { count } = await supabase
          .from("mistake_queue")
          .select("*", { count: "exact", head: true })
          .eq("resolved", false)
          .in("task_id", taskIds);
        setMistakeCount(count || 0);
      } else {
        setMistakeCount(0);
      }

      const vocabTaskIds = (tasks || [])
        .filter((t) => t.type === "wort" && t.correct_answer)
        .map((t) => t.id);
      if (vocabTaskIds.length > 0) {
        const { data: progress } = await supabase
          .from("word_progress")
          .select("task_id, introduced, next_due_at")
          .in("task_id", vocabTaskIds);
        const progressMap = {};
        (progress || []).forEach((p) => (progressMap[p.task_id] = p));
        const today = todayISO();
        const due = vocabTaskIds.filter((id) => isDue(progressMap[id], today)).length;
        setDueVocabCount(due);
      } else {
        setDueVocabCount(0);
      }
    } else {
      setAssignments([]);
      setMistakeCount(0);
      setDueVocabCount(0);
    }
    setLoading(false);
  }

  if (loading) return <p>Lade...</p>;

  return (
    <div>
      <nav className="topnav">
        <a onClick={() => router.push("/schuelerin")} style={{ cursor: "pointer" }}>← Fächer</a>
        <LogoutLink />
      </nav>
      <h1>{subject?.name}</h1>

      {dueVocabCount > 0 && (
        <Link
          href={`/schuelerin/lernen/${subjectId}`}
          className="card clickable"
          style={{ display: "block", textDecoration: "none", color: "inherit", borderLeft: "4px solid var(--color-accent)" }}
        >
          <strong>🟠 Vokabeln lernen</strong>
          <br />
          <span style={{ fontSize: "0.85rem", color: "#888" }}>{dueVocabCount} Vokabel(n) heute fällig</span>
        </Link>
      )}

      {mistakeCount > 0 && (
        <Link
          href={`/schuelerin/wiederholung/${subjectId}`}
          className="card clickable wiederholung"
          style={{ display: "block", textDecoration: "none", color: "inherit" }}
        >
          <strong>Wiederholen</strong>
          <br />
          <span style={{ fontSize: "0.85rem", color: "#888" }}>{mistakeCount} Aufgabe(n), die du nochmal üben solltest</span>
        </Link>
      )}

      <h2>Arbeitsblätter</h2>
      {assignments.length === 0 && <p className="empty-state">Aktuell keine offenen Arbeitsblätter. Gut gemacht!</p>}
      {assignments.map((a) => (
        <div key={a.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
          <Link
            href={`/schuelerin/arbeitsblatt/${a.id}`}
            className="clickable"
            style={{ display: "block", textDecoration: "none", color: "inherit", padding: 16 }}
          >
            <strong>{a.worksheets?.title}</strong>
            {a.worksheets?.description && <div style={{ marginTop: 6 }}>{a.worksheets.description}</div>}
            {a.note_from_pruefer && <div className="feedback-box">Hinweis: {a.note_from_pruefer}</div>}
            {a.due_date && <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 6 }}>Fällig bis {a.due_date}</div>}
          </Link>
          {a.worksheets?.id && (
            <div style={{ display: "flex", borderTop: "1px solid #eee" }}>
              <Link
                href={`/schuelerin/karteikarten/${a.worksheets.id}`}
                style={{
                  flex: 1,
                  display: "block",
                  textAlign: "center",
                  padding: "10px 8px",
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  borderRight: "1px solid #eee",
                }}
              >
                🗂️ Karteikarten
              </Link>
              <Link
                href={`/schuelerin/vokabeltrainer/${a.worksheets.id}`}
                style={{
                  flex: 1,
                  display: "block",
                  textAlign: "center",
                  padding: "10px 8px",
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                🎮 Vokabeltrainer
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="schuelerin">
      <SchuelerinArbeitsblaetter />
    </RoleGuard>
  );
}
