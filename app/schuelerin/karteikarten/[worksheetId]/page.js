"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../lib/RoleGuard";
import { supabase } from "../../../../lib/supabaseClient";
import MathText from "../../../../lib/MathText";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Karteikarten() {
  const { worksheetId } = useParams();
  const router = useRouter();
  const [worksheet, setWorksheet] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [cards, setCards] = useState([]);
  const [order, setOrder] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [nochmal, setNochmal] = useState([]);
  const [gekonnt, setGekonnt] = useState(0);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId]);

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
      .select("id, question, correct_answer, type")
      .eq("worksheet_id", worksheetId)
      .order("id");

    const usable = (t || []).filter((x) => x.correct_answer);
    setCards(usable);
    setOrder(shuffle(usable.map((c) => c.id)));
    setLoading(false);
  }

  const current = useMemo(() => {
    if (!order.length || index >= order.length) return null;
    const id = order[index];
    return cards.find((c) => c.id === id) || null;
  }, [order, index, cards]);

  function next(knewIt) {
    if (!knewIt) setNochmal((prev) => [...prev, current.id]);
    else setGekonnt((prev) => prev + 1);

    setFlipped(false);
    if (index + 1 < order.length) {
      setIndex(index + 1);
    } else if (nochmal.length > 0 || !knewIt) {
      const restIds = knewIt ? nochmal : [...nochmal, current.id];
      if (restIds.length > 0) {
        setOrder(shuffle(restIds));
        setIndex(0);
        setNochmal([]);
        setRound((r) => r + 1);
      } else {
        setDone(true);
      }
    } else {
      setDone(true);
    }
  }

  function restart() {
    setOrder(shuffle(cards.map((c) => c.id)));
    setIndex(0);
    setFlipped(false);
    setNochmal([]);
    setGekonnt(0);
    setRound(1);
    setDone(false);
  }

  if (loading) return <p>Lade...</p>;
  if (!worksheet) return <p>Arbeitsblatt nicht gefunden.</p>;
  if (cards.length === 0) return <p>Für dieses Arbeitsblatt gibt es keine Karteikarten.</p>;

  return (
    <div>
      <nav className="topnav">
        <a onClick={() => router.back()} style={{ cursor: "pointer" }}>← Zurück</a>
        <LogoutLink />
      </nav>
      <h1>Karteikarten üben</h1>
      <p className="subtitle">{worksheet.title}</p>

      {!done && current && (
        <>
          <div style={{ fontSize: "0.85rem", color: "#888", marginBottom: 8 }}>
            Karte {index + 1} von {order.length}
            {round > 1 ? ` · Runde ${round}` : ""}
          </div>

          <div
            onClick={() => setFlipped((f) => !f)}
            className="card"
            style={{
              minHeight: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              cursor: "pointer",
              fontSize: "1.2rem",
              fontWeight: 600,
              userSelect: "none",
            }}
          >
            <MathText text={flipped ? current.correct_answer : current.question} />
          </div>
          <p className="hint" style={{ textAlign: "center" }}>
            {flipped ? "Englisch" : "Deutsch"} · Tippen zum Umdrehen
          </p>

          {!flipped && (
            <button className="btn full" onClick={() => setFlipped(true)}>
              Karte umdrehen
            </button>
          )}

          {flipped && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn secondary"
                style={{ flex: 1 }}
                onClick={() => next(false)}
              >
                Nochmal üben
              </button>
              <button className="btn full" style={{ flex: 1 }} onClick={() => next(true)}>
                Kann ich!
              </button>
            </div>
          )}
        </>
      )}

      {done && (
        <div className="card">
          <strong>Geschafft!</strong>
          <p>Du hast alle Karten mindestens einmal richtig gewusst.</p>
          <button className="btn full" onClick={restart}>
            Nochmal von vorne
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
      <Karteikarten />
    </RoleGuard>
  );
}
