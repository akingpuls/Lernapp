"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard, { LogoutLink } from "../../lib/RoleGuard";
import { supabase } from "../../lib/supabaseClient";

function SchuelerinFaecher() {
  const [subjects, setSubjects] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: subjectsData } = await supabase.from("subjects").select("*").order("sort_order");
    const subs = subjectsData || [];
    setSubjects(subs);

    const [{ data: topics }, { data: worksheets }, { data: tasks }, { data: assignments }, { data: mistakes }] =
      await Promise.all([
        supabase.from("topics").select("id, subject_id"),
        supabase.from("worksheets").select("id, topic_id"),
        supabase.from("tasks").select("id, worksheet_id"),
        supabase.from("assignments").select("id, worksheet_id, status").eq("status", "offen"),
        supabase.from("mistake_queue").select("id, task_id, resolved").eq("resolved", false),
      ]);

    const topicToSubject = new Map((topics || []).map((t) => [t.id, t.subject_id]));
    const worksheetToTopic = new Map((worksheets || []).map((w) => [w.id, w.topic_id]));
    const taskToWorksheet = new Map((tasks || []).map((t) => [t.id, t.worksheet_id]));

    const newCounts = {};
    subs.forEach((s) => (newCounts[s.id] = { offen: 0, wdh: 0 }));

    (assignments || []).forEach((a) => {
      const topicId = worksheetToTopic.get(a.worksheet_id);
      const subjectId = topicToSubject.get(topicId);
      if (newCounts[subjectId]) newCounts[subjectId].offen += 1;
    });

    (mistakes || []).forEach((m) => {
      const worksheetId = taskToWorksheet.get(m.task_id);
      const topicId = worksheetToTopic.get(worksheetId);
      const subjectId = topicToSubject.get(topicId);
      if (newCounts[subjectId]) newCounts[subjectId].wdh += 1;
    });

    setCounts(newCounts);
    setLoading(false);
  }

  return (
    <div>
      <nav className="topnav">
        <span>Hallo!</span>
        <LogoutLink />
      </nav>
      <h1>Deine Fächer</h1>
      <p className="subtitle">Wähle ein Fach aus.</p>
      <div className="banner">
        Arbeitsblätter mit dem Hinweis "Allgemein" orientieren sich am typischen
        Lehrplan, aber noch nicht am genauen Inhalt eures Schulbuchs.
      </div>
      {loading && <p>Lade...</p>}
      {!loading &&
        subjects.map((s) => {
          const c = counts[s.id] || { offen: 0, wdh: 0 };
          return (
            <Link
              key={s.id}
              href={`/schuelerin/fach/${s.id}`}
              className="card clickable fach-card"
              style={{ display: "flex", textDecoration: "none", color: "inherit" }}
            >
              <div>
                <strong>{s.name}</strong>
                <br />
                <span style={{ fontSize: "0.85rem", color: "#888" }}>
                  {c.offen} offene(s) Arbeitsblatt/Arbeitsblätter
                  {c.wdh > 0 ? ` · ${c.wdh} zu wiederholen` : ""}
                </span>
              </div>
              <span>›</span>
            </Link>
          );
        })}
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="schuelerin">
      <SchuelerinFaecher />
    </RoleGuard>
  );
}
