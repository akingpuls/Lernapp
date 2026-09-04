"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RoleGuard, { LogoutLink } from "../../../../lib/RoleGuard";
import { supabase } from "../../../../lib/supabaseClient";

function PrueferArbeitsblaetter() {
  const { subjectId } = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState(null);
  const [worksheets, setWorksheets] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
  const [answerCounts, setAnswerCounts] = useState({});
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  async function load() {
    setLoading(true);
    const { data: subjectData } = await supabase.from("subjects").select("*").eq("id", subjectId).single();
    setSubject(subjectData);

    const { data: topics } = await supabase.from("topics").select("id, name").eq("subject_id", subjectId);
    const topicIds = (topics || []).map((t) => t.id);
    const topicMap = new Map((topics || []).map((t) => [t.id, t.name]));

    let ws = [];
    if (topicIds.length > 0) {
      const { data } = await supabase
        .from("worksheets")
        .select("*")
        .in("topic_id", topicIds)
        .order("created_at", { ascending: false });
      ws = (data || []).map((w) => ({ ...w, topic_name: topicMap.get(w.topic_id) }));
    }
    setWorksheets(ws);

    const wsIds = ws.map((w) => w.id);
    if (wsIds.length > 0) {
      const { data: tasks } = await supabase.from("tasks").select("id, worksheet_id").in("worksheet_id", wsIds);
      const tCounts = {};
      const taskToWs = new Map();
      (tasks || []).forEach((t) => {
        tCounts[t.worksheet_id] = (tCounts[t.worksheet_id] || 0) + 1;
        taskToWs.set(t.id, t.worksheet_id);
      });
      setTaskCounts(tCounts);

      const { data: assignments } = await supabase
        .from("assignments")
        .select("worksheet_id, status")
        .in("worksheet_id", wsIds)
        .eq("status", "offen");
      setAssignedIds(new Set((assignments || []).map((a) => a.worksheet_id)));

      const taskIds = (tasks || []).map((t) => t.id);
      if (taskIds.length > 0) {
        const { data: submissions } = await supabase.from("submissions").select("task_id").in("task_id", taskIds);
        const aCounts = {};
        (submissions || []).forEach((s) => {
          const wsId = taskToWs.get(s.task_id);
          aCounts[wsId] = (aCounts[wsId] || 0) + 1;
        });
        setAnswerCounts(aCounts);
      }
    }
    setLoading(false);
  }

  if (loading) return <p>Lade...</p>;

  return (
    <div>
      <nav className="topnav">
        <a onClick={() => router.push("/pruefer")} style={{ cursor: "pointer" }}>← Fächer</a>
        <LogoutLink />
      </nav>
      <h1>{subject?.name}</h1>

      <Link href={`/pruefer/fach/${subjectId}/neu`} className="btn full" style={{ display: "block", marginBottom: 16 }}>
        + Neues Arbeitsblatt
      </Link>

      {worksheets.length === 0 && <p className="empty-state">Noch keine Arbeitsblätter für dieses Fach.</p>}

      {worksheets.map((ws) => (
        <div key={ws.id} className="card">
          <div style={{ fontSize: "0.8rem", color: "#888" }}>{ws.topic_name}</div>
          <strong>{ws.title}</strong>
          <span className="badge">{taskCounts[ws.id] || 0} Aufgabe(n)</span>
          {assignedIds.has(ws.id) && (
            <span className="badge" style={{ background: "#dcf0e0", color: "#29612f" }}>zugewiesen</span>
          )}
          {ws.is_general && (
            <span className="badge" style={{ background: "#fde8cf", color: "#8a5a1a" }} title="Noch nicht mit eurem Schulbuch abgeglichen">
              Allgemein
            </span>
          )}
          <div style={{ marginTop: 8 }}>
            <Link href={`/pruefer/arbeitsblatt/${ws.id}/zuweisen`} className="btn secondary">Zuweisen</Link>{" "}
            <Link href={`/pruefer/arbeitsblatt/${ws.id}/antworten`} className="btn secondary">
              Antworten ansehen ({answerCounts[ws.id] || 0})
            </Link>
          </div>
          <div style={{ marginTop: 6 }}>
            <Link href={`/pruefer/arbeitsblatt/${ws.id}/drucken?mode=aufgaben`} className="btn secondary">🖨️ Arbeitsblatt</Link>{" "}
            <Link href={`/pruefer/arbeitsblatt/${ws.id}/drucken?mode=loesungen`} className="btn secondary">🖨️ Lösungen</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <PrueferArbeitsblaetter />
    </RoleGuard>
  );
}
