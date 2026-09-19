"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../lib/RoleGuard";
import { supabase } from "../../../../lib/supabaseClient";
import { TaskInput, gradeAnswer } from "../../../../lib/TaskInput";
import MathText from "../../../../lib/MathText";
import { MAX_PHASE, todayISO, isDue, onCorrect, onWrong } from "../../../../lib/leitner";

const NEW_BATCH_SIZE = 8;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function VokabelnLernen() {
  const { subjectId } = useParams();
  const router = useRouter();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("loading"); // loading | leer | einpraegen | abfrage | done
  const [tasksById, setTasksById] = useState({});
  const [progressByTaskId, setProgressByTaskId] = useState({});

  const [einpraegenQueue, setEinpraegenQueue] = useState([]); // task ids
  const [einpraegenPos, setEinpraegenPos] = useState(0);
  const [einpraegenInput, setEinpraegenInput] = useState("");

  const [abfrageQueue, setAbfrageQueue] = useState([]); // task ids
  const [abfragePos, setAbfragePos] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [sessionSize, setSessionSize] = useState(0);

  const [phaseCounts, setPhaseCounts] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  useEffect(() => {
    if (step === "abfrage" && !feedback && inputRef.current) inputRef.current.focus();
  }, [step, abfragePos, feedback]);

  async function load() {
    setLoading(true);
    setStep("loading");

    const { data: subjectData } = await supabase.from("subjects").select("*").eq("id", subjectId).single();
    setSubject(subjectData);

    const { data: topics } = await supabase.from("topics").select("id").eq("subject_id", subjectId);
    const topicIds = (topics || []).map((t) => t.id);

    let worksheetIds = [];
    if (topicIds.length > 0) {
      const { data: worksheets } = await supabase.from("worksheets").select("id").in("topic_id", topicIds);
      worksheetIds = (worksheets || []).map((w) => w.id);
    }

    let vocabTasks = [];
    if (worksheetIds.length > 0) {
      const { data: t } = await supabase
        .from("tasks")
        .select("*")
        .in("worksheet_id", worksheetIds)
        .eq("type", "wort")
        .not("correct_answer", "is", null);
      vocabTasks = t || [];
    }

    if (vocabTasks.length === 0) {
      setTasksById({});
      setProgressByTaskId({});
      setStep("leer");
      setLoading(false);
      return;
    }

    const byId = {};
    vocabTasks.forEach((t) => (byId[t.id] = t));
    setTasksById(byId);

    const taskIds = vocabTasks.map((t) => t.id);
    const { data: existingProgress } = await supabase
      .from("word_progress")
      .select("*")
      .in("task_id", taskIds);

    const progressMap = {};
    (existingProgress || []).forEach((p) => (progressMap[p.task_id] = p));

    // Für Vokabeln ohne Fortschritts-Zeile: anlegen
    const missingIds = taskIds.filter((id) => !progressMap[id]);
    if (missingIds.length > 0) {
      const { data: inserted } = await supabase
        .from("word_progress")
        .insert(missingIds.map((task_id) => ({ task_id })))
        .select("*");
      (inserted || []).forEach((p) => (progressMap[p.task_id] = p));
    }
    setProgressByTaskId(progressMap);

    const today = todayISO();
    const newIds = taskIds.filter((id) => !progressMap[id]?.introduced);
    const dueIds = taskIds.filter(
      (id) => progressMap[id]?.introduced && isDue(progressMap[id], today)
    );

    const newBatch = shuffle(newIds).slice(0, NEW_BATCH_SIZE);
    setSessionSize(newBatch.length + dueIds.length);

    if (newBatch.length > 0) {
      setEinpraegenQueue(newBatch);
      setEinpraegenPos(0);
      setEinpraegenInput("");
      // Restliche fällige Wörter für danach merken
      setAbfrageQueue(shuffle([...dueIds]));
      setStep(newBatch.length > 0 ? "einpraegen" : "abfrage");
    } else if (dueIds.length > 0) {
      setAbfrageQueue(shuffle(dueIds));
      setAbfragePos(0);
      setStep("abfrage");
    } else {
      setStep("leer");
    }
    setLoading(false);
  }

  // --- Schritt 1: Einprägen ---

  async function nextEinpraegen() {
    setEinpraegenInput("");
    if (einpraegenPos + 1 < einpraegenQueue.length) {
      setEinpraegenPos(einpraegenPos + 1);
      return;
    }
    // Alle neuen Wörter angeschaut -> als eingeführt markieren und in die Abfrage aufnehmen
    const today = todayISO();
    const updates = einpraegenQueue.map((taskId) => ({
      task_id: taskId,
      introduced: true,
      phase: 1,
      next_due_at: today,
      last_seen_at: new Date().toISOString(),
    }));
    await supabase.from("word_progress").upsert(updates, { onConflict: "task_id" });

    setProgressByTaskId((prev) => {
      const next = { ...prev };
      einpraegenQueue.forEach((taskId) => {
        next[taskId] = { ...next[taskId], introduced: true, phase: 1, next_due_at: today };
      });
      return next;
    });

    const combined = shuffle([...abfrageQueue, ...einpraegenQueue]);
    setAbfrageQueue(combined);
    setAbfragePos(0);
    setStep(combined.length > 0 ? "abfrage" : "done");
    if (combined.length === 0) loadPhaseCounts();
  }

  // --- Schritt 2 + 3: Abfrage + Bewertung ---

  const currentAbfrageId = abfrageQueue[abfragePos];
  const currentTask = tasksById[currentAbfrageId];

  async function check() {
    if (!currentTask) return;
    const correct = gradeAnswer(currentTask, answer);
    const progress = progressByTaskId[currentTask.id] || {};
    const update = correct ? onCorrect(progress) : onWrong(progress);

    setFeedback(correct ? "correct" : "wrong");
    if (correct) setFirstTryCorrect((c) => c + 1);

    setProgressByTaskId((prev) => ({ ...prev, [currentTask.id]: { ...prev[currentTask.id], ...update } }));
    await supabase.from("word_progress").update(update).eq("task_id", currentTask.id);
  }

  function nextAbfrage() {
    setFeedback(null);
    setAnswer("");
    if (abfragePos + 1 < abfrageQueue.length) {
      setAbfragePos(abfragePos + 1);
    } else {
      setStep("done");
      loadPhaseCounts();
    }
  }

  async function loadPhaseCounts() {
    const taskIds = Object.keys(tasksById).map(Number);
    if (taskIds.length === 0) return;
    const { data } = await supabase.from("word_progress").select("phase, introduced").in("task_id", taskIds);
    const counts = { neu: 0 };
    for (let p = 1; p <= MAX_PHASE; p++) counts[p] = 0;
    (data || []).forEach((row) => {
      if (!row.introduced) counts.neu += 1;
      else counts[row.phase] = (counts[row.phase] || 0) + 1;
    });
    setPhaseCounts(counts);
  }

  function handleKeyDown(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (step === "einpraegen") nextEinpraegen();
    else if (step === "abfrage") {
      if (!feedback) check();
      else nextAbfrage();
    }
  }

  if (loading || step === "loading") return <p>Lade...</p>;

  const einpraegenTask = tasksById[einpraegenQueue[einpraegenPos]];

  return (
    <div onKeyDown={handleKeyDown}>
      <nav className="topnav">
        <a onClick={() => router.push(`/schuelerin/fach/${subjectId}`)} style={{ cursor: "pointer" }}>← {subject?.name || "Fach"}</a>
        <LogoutLink />
      </nav>
      <h1>Vokabeln lernen</h1>

      {step === "leer" && (
        <div className="card">
          <strong>Heute ist nichts fällig. 🎉</strong>
          <p style={{ marginTop: 8, color: "#666" }}>
            Alle Vokabeln sind gerade im Zeitplan. Wenn du trotzdem üben willst, nutze
            gern den Vokabeltrainer oder die Karteikarten auf der Fach-Seite.
          </p>
          <button className="btn full" onClick={() => router.push(`/schuelerin/fach/${subjectId}`)}>
            Zurück zum Fach
          </button>
        </div>
      )}

      {step === "einpraegen" && einpraegenTask && (
        <>
          <p className="subtitle">
            Neue Vokabel {einpraegenPos + 1} von {einpraegenQueue.length} – erst mal ankommen lassen
          </p>
          <div className="card">
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "0.8rem", color: "#888" }}>Deutsch</div>
                <div style={{ fontWeight: 600, fontSize: "1.2rem" }}>
                  <MathText text={einpraegenTask.question} />
                </div>
              </div>
              <div style={{ fontSize: "1.3rem", color: "#ccc" }}>→</div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: "0.8rem", color: "#888" }}>Englisch</div>
                <div style={{ fontWeight: 600, fontSize: "1.2rem", color: "var(--color-primary)" }}>
                  {einpraegenTask.correct_answer}
                </div>
              </div>
            </div>
            <label>Zum Kennenlernen einmal abtippen (optional):</label>
            <input
              type="text"
              placeholder="Englisches Wort eintippen..."
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={einpraegenInput}
              onChange={(e) => setEinpraegenInput(e.target.value)}
            />
            <button className="btn full" onClick={nextEinpraegen}>
              Weiter
            </button>
          </div>
        </>
      )}

      {step === "abfrage" && currentTask && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 8, background: "#eee", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${sessionSize > 0 ? Math.min(100, Math.round(((abfragePos + 1) / abfrageQueue.length) * 100)) : 0}%`,
                  height: "100%",
                  background: "var(--color-primary)",
                  transition: "width 0.3s",
                }}
              />
            </div>
            <span style={{ fontSize: "0.8rem", color: "#888", whiteSpace: "nowrap" }}>
              {abfragePos + 1} / {abfrageQueue.length}
            </span>
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: 4 }}>Deutsch</div>
                <div style={{ fontWeight: 600, fontSize: "1.15rem" }}>
                  <MathText text={currentTask.question} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: 4 }}>Englisch</div>
                {!feedback && <TaskInput task={currentTask} value={answer} onChange={setAnswer} />}
                {feedback && (
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      color: feedback === "correct" ? "var(--color-correct)" : "var(--color-wrong)",
                    }}
                  >
                    {currentTask.correct_answer}
                  </div>
                )}
              </div>
            </div>

            {feedback === "correct" && <p className="result-correct" style={{ marginTop: 12 }}>Richtig! 🎉</p>}
            {feedback === "wrong" && (
              <p className="result-wrong" style={{ marginTop: 12 }}>
                Fast! Deine Antwort war: <em>{answer || "(leer)"}</em>
              </p>
            )}

            {!feedback && (
              <button className="btn full" style={{ marginTop: 14 }} onClick={check} disabled={!answer || !String(answer).trim()}>
                Prüfen
              </button>
            )}
            {feedback && (
              <button className="btn full" style={{ marginTop: 14 }} onClick={nextAbfrage} autoFocus>
                Weiter
              </button>
            )}
          </div>
        </>
      )}

      {step === "done" && (
        <div className="card">
          <strong>Fertig! 🏆</strong>
          <p>
            {firstTryCorrect} von {sessionSize} Vokabeln beim ersten Versuch richtig.
          </p>

          {phaseCounts && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: 8 }}>
                Dein Fortschritt in diesem Fach:
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
                {["neu", 1, 2, 3, 4, 5, 6].map((key) => {
                  const count = phaseCounts[key] || 0;
                  const max = Math.max(1, ...Object.values(phaseCounts));
                  const height = Math.max(4, Math.round((count / max) * 80));
                  return (
                    <div key={key} style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          height,
                          background: key === "neu" ? "#ddd" : "var(--color-primary)",
                          borderRadius: 4,
                          marginBottom: 4,
                        }}
                        title={`${count} Vokabel(n)`}
                      />
                      <div style={{ fontSize: "0.7rem", color: "#888" }}>{key === "neu" ? "neu" : `P${key}`}</div>
                      <div style={{ fontSize: "0.7rem", color: "#555" }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button className="btn full" style={{ marginTop: 16 }} onClick={load}>
            Nochmal schauen
          </button>
          <button className="btn secondary full" style={{ marginTop: 8 }} onClick={() => router.push(`/schuelerin/fach/${subjectId}`)}>
            Zurück zum Fach
          </button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="schuelerin">
      <VokabelnLernen />
    </RoleGuard>
  );
}
