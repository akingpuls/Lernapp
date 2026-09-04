"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../lib/RoleGuard";
import { supabase } from "../../../../lib/supabaseClient";

function NeueAufgabeSeite() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [topicMode, setTopicMode] = useState("existing"); // "existing" | "new"
  const [topicId, setTopicId] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [lernziel, setLernziel] = useState("");
  const [type, setType] = useState("multiple_choice");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase
      .from("subjects")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setSubjects(data || []));
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    supabase
      .from("topics")
      .select("*")
      .eq("subject_id", subjectId)
      .order("name")
      .then(({ data }) => setTopics(data || []));
  }, [subjectId]);

  function updateOption(i, value) {
    const copy = [...options];
    copy[i] = value;
    setOptions(copy);
  }

  function addOption() {
    setOptions([...options, ""]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    let finalTopicId = topicId;

    if (topicMode === "new") {
      const { data, error } = await supabase
        .from("topics")
        .insert({ subject_id: subjectId, name: newTopicName, lernziel })
        .select()
        .single();
      if (error) {
        setMessage("Fehler beim Anlegen des Themas: " + error.message);
        setSaving(false);
        return;
      }
      finalTopicId = data.id;
    }

    const payload = {
      topic_id: finalTopicId,
      type,
      question,
      explanation: explanation || null,
      options: type === "multiple_choice" ? options.filter((o) => o.trim()) : null,
      correct_answer: type === "freitext" ? null : correctAnswer,
    };

    const { error } = await supabase.from("tasks").insert(payload);

    setSaving(false);
    if (error) {
      setMessage("Fehler: " + error.message);
    } else {
      setMessage("✅ Aufgabe gespeichert!");
      setQuestion("");
      setOptions(["", ""]);
      setCorrectAnswer("");
      setExplanation("");
    }
  }

  return (
    <div>
      <nav className="topnav">
        <a href="/pruefer" onClick={(e) => { e.preventDefault(); router.push("/pruefer"); }}>← Übersicht</a>
        <LogoutLink />
      </nav>
      <h1>Neue Aufgabe</h1>

      <form onSubmit={handleSubmit} className="card">
        <label>Fach</label>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
          <option value="">Bitte wählen...</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {subjectId && (
          <>
            <label>Thema</label>
            <div className="option-row">
              <label style={{ fontWeight: 400 }}>
                <input type="radio" checked={topicMode === "existing"}
                  onChange={() => setTopicMode("existing")} /> Vorhandenes Thema
              </label>
              <label style={{ fontWeight: 400 }}>
                <input type="radio" checked={topicMode === "new"}
                  onChange={() => setTopicMode("new")} /> Neues Thema
              </label>
            </div>

            {topicMode === "existing" ? (
              <select value={topicId} onChange={(e) => setTopicId(e.target.value)} required>
                <option value="">Bitte wählen...</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            ) : (
              <>
                <input type="text" placeholder="Name des neuen Themas"
                  value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} required />
                <label>Lernziel (optional)</label>
                <textarea rows={2} placeholder="Was soll gelernt werden?"
                  value={lernziel} onChange={(e) => setLernziel(e.target.value)} />
              </>
            )}
          </>
        )}

        <label>Aufgabentyp</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="zahl">Zahleneingabe (z.B. Mathe)</option>
          <option value="freitext">Freitext-Antwort</option>
        </select>

        <label>Frage / Aufgabenstellung</label>
        <textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} required />

        {type === "multiple_choice" && (
          <>
            <label>Antwortoptionen</label>
            {options.map((opt, i) => (
              <input key={i} type="text" placeholder={`Option ${i + 1}`}
                value={opt} onChange={(e) => updateOption(i, e.target.value)} />
            ))}
            <button type="button" className="btn secondary" onClick={addOption} style={{ marginBottom: 12 }}>
              + weitere Option
            </button>
            <label>Richtige Antwort (exakter Text einer Option)</label>
            <input type="text" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} required />
          </>
        )}

        {type === "zahl" && (
          <>
            <label>Richtige Antwort (Zahl)</label>
            <input type="text" inputMode="decimal" value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)} required />
          </>
        )}

        <label>Erklärung / Lösungsweg (optional, wird nach Abgabe gezeigt)</label>
        <textarea rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} />

        <button className="btn full" type="submit" disabled={saving}>
          {saving ? "Speichert..." : "Aufgabe speichern"}
        </button>
        {message && <p style={{ marginTop: 10 }}>{message}</p>}
      </form>
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <NeueAufgabeSeite />
    </RoleGuard>
  );
}
