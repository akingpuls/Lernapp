"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../lib/RoleGuard";
import { supabase } from "../../../../lib/supabaseClient";
import { TaskInput, gradeAnswer, isAutoGraded } from "../../../../lib/TaskInput";
import MathText from "../../../../lib/MathText";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Vokabeltrainer() {
  const { worksheetId } = useParams();
  const router = useRouter();
  const [worksheet, setWorksheet] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [queue, setQueue] = useState([]); // ids, in order to ask
  const [pos, setPos] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [seenOnce, setSeenOnce] = useState(new Set());
  const [retryIds, setRetryIds] = useState([]);
  const [totalWords, setTotalWords] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId]);

  useEffect(() => {
    if (!feedback && inputRef.current) inputRef.current.focus();
  }, [pos, feedback]);

  async function load() {
    setLoading(true);
    const { data: ws } = await supabase.from("worksheets").select("*").eq("id", worksheetId).single();
    setWorksheet(ws);
    if (ws) {
      const { data: topic } = await supabase.from("topics").select("subject_id").eq("id", ws.topic_id).single();
      setSubjectId(topic?.subject_id);
    }
    const { data: t } = await supabase
      .from("tasks")
      .select("*")
      .eq("worksheet_id", worksheetId)
      .order("id");
    const usable = (t || []).filter((x) => x.correct_answer);
    setAllTasks(usable);
    const ids = shuffle(usable.map((x) => x.id));
    setQueue(ids);
    setTotalWords(usable.length);
    setLoading(false);
  }

  const currentId = queue[pos];
  const current = allTasks.find((t) => t.id === currentId);

  function check() {
    if (!current) return;
    const val = current.type === "multiple_choice" ? answer : answer;
    const correct = gradeAnswer(current, val);
    const firstTime = !seenOnce.has(current.id);

    if (correct) {
      setFeedback("correct");
      setStreak((s) => {
        const n = s + 1;
        setBestStreak((b) => Math.max(b, n));
        return n;
      });
      if (firstTime) setFirstTryCorrect((c) => c + 1);
    } else {
      setFeedback("wrong");
      setStreak(0);
      setRetryIds((r) => [...r, current.id]);
    }
    setSeenOnce((s) => new Set(s).add(current.id));
  }

  function next() {
    setFeedback(null);
    setAnswer("");
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
    } else if (retryIds.length > 0) {
      setQueue(shuffle(retryIds));
      setRetryIds([]);
      setPos(0);
    } else {
      setDone(true);
    }
  }

  function restart() {
    const ids = shuffle(allTasks.map((x) => x.id));
    setQueue(ids);
    setPos(0);
    setAnswer("");
    setFeedback(null);
    setStreak(0);
    setBestStreak(0);
    setFirstTryCorrect(0);
    setSeenOnce(new Set());
    setRetryIds([]);
    setDone(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!feedback) check();
      else next();
    }
  }

  if (loading) return <p>Lade...</p>;
  if (!worksheet) return <p>Arbeitsblatt nicht gefunden.</p>;
  if (allTasks.length === 0) return <p>Für dieses Arbeitsblatt gibt es keine Vokabeln.</p>;

  const progress = totalWords > 0 ? Math.round((seenOnce.size / totalWords) * 100) : 0;

  return (
    <div>
      <nav className="topnav">
        <a onClick={() => router.back()} style={{ cursor: "pointer" }}>← Zurück</a>
        <LogoutLink />
      </nav>
      <h1>Vokabeltrainer</h1>
      <p className="subtitle">{worksheet.title}</p>

      {!done && current && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 8, background: "#eee", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  height: "100%",
                  background: "var(--color-primary)",
                  transition: "width 0.3s",
                }}
              />
            </div>
            {streak >= 3 && (
              <span style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>🔥 {streak}</span>
            )}
          </div>

          <div className="card">
            <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: 6 }}>
              Wie heißt das auf Englisch?
            </div>
            <div style={{ fontWeight: 600, fontSize: "1.15rem", marginBottom: 14 }}>
              <MathText text={current.question} />
            </div>

            <div onKeyDown={handleKeyDown}>
              <TaskInput task={current} value={answer} onChange={setAnswer} />
            </div>

            {feedback === "correct" && (
              <p className="result-correct">Richtig! 🎉</p>
            )}
            {feedback === "wrong" && (
              <div>
                <p className="result-wrong">Leider falsch.</p>
                <p className="feedback-box">
                  Richtige Antwort: <strong>{current.correct_answer}</strong>
                </p>
              </div>
            )}

            {!feedback && (
              <button
                className="btn full"
                onClick={check}
                disabled={!answer || !String(answer).trim()}
              >
                Prüfen
              </button>
            )}
            {feedback && (
              <button className="btn full" onClick={next} autoFocus>
                Weiter
              </button>
            )}
          </div>
        </>
      )}

      {done && (
        <div className="card">
          <strong>Fertig! 🏆</strong>
          <p>
            {firstTryCorrect} von {totalWords} Wörtern beim ersten Versuch richtig.
            {bestStreak >= 3 && <> Beste Serie: {bestStreak} in Folge!</>}
          </p>
          <button className="btn full" onClick={restart}>
            Nochmal üben
          </button>
          <button
            className="btn secondary full"
            style={{ marginTop: 8 }}
            onClick={() => router.push(subjectId ? `/schuelerin/fach/${subjectId}` : "/schuelerin")}
          >
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
      <Vokabeltrainer />
    </RoleGuard>
  );
}
