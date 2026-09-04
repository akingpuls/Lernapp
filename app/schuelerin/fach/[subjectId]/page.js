"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RoleGuard, { LogoutLink } from "../../../../lib/RoleGuard";
import { supabase } from "../../../../lib/supabaseClient";

function SchuelerinArbeitsblaetter() {
  const { subjectId } = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [mistakeCount, setMistakeCount] = useState(0);
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

      const { data: tasks } = await supabase.from("tasks").select("id").in("worksheet_id", worksheetIds);
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
    } else {
      setAssignments([]);
      setMistakeCount(0);
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
        <Link
          key={a.id}
          href={`/schuelerin/arbeitsblatt/${a.id}`}
          className="card clickable"
          style={{ display: "block", textDecoration: "none", color: "inherit" }}
        >
          <strong>{a.worksheets?.title}</strong>
          {a.worksheets?.description && <div style={{ marginTop: 6 }}>{a.worksheets.description}</div>}
          {a.note_from_pruefer && <div className="feedback-box">Hinweis: {a.note_from_pruefer}</div>}
          {a.due_date && <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 6 }}>Fällig bis {a.due_date}</div>}
        </Link>
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
