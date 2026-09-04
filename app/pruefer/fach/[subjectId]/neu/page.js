"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../../lib/RoleGuard";
import { supabase } from "../../../../../lib/supabaseClient";
import { mathToStaticHtml } from "../../../../../lib/mathRender";

function blankDraft() {
  return {
    localId: Math.random().toString(36).slice(2),
    type: "multiple_choice",
    question: "",
    options: ["", ""],
    correctAnswer: "",
    explanation: "",
    imageData: null,
    correctX: null,
    correctY: null,
    tolerance: 8,
  };
}

function NeuesArbeitsblatt() {
  const { subjectId } = useParams();
  const router = useRouter();
  const [topics, setTopics] = useState([]);
  const [topicMode, setTopicMode] = useState("existing");
  const [topicId, setTopicId] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicLernziel, setNewTopicLernziel] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [drafts, setDrafts] = useState([blankDraft()]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("topics")
      .select("*")
      .eq("subject_id", subjectId)
      .order("name")
      .then(({ data }) => setTopics(data || []));
  }, [subjectId]);

  function updateDraft(localId, patch) {
    setDrafts((prev) => prev.map((d) => (d.localId === localId ? { ...d, ...patch } : d)));
  }

  function updateOption(localId, idx, value) {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.localId !== localId) return d;
        const opts = [...d.options];
        opts[idx] = value;
        return { ...d, options: opts };
      })
    );
  }

  function addOption(localId) {
    setDrafts((prev) =>
      prev.map((d) => (d.localId === localId ? { ...d, options: [...d.options, ""] } : d))
    );
  }

  function addTask() {
    setDrafts((prev) => [...prev, blankDraft()]);
  }

  function removeTask(localId) {
    setDrafts((prev) => prev.filter((d) => d.localId !== localId));
  }

  function handleImageUpload(localId, file) {
    const reader = new FileReader();
    reader.onload = () => {
      updateDraft(localId, { imageData: reader.result, correctX: null, correctY: null });
    };
    reader.readAsDataURL(file);
  }

  function handleImageClick(localId, e, imgEl) {
    const rect = imgEl.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    updateDraft(localId, { correctX: x, correctY: y });
  }

  async function handleSave() {
    setMessage("");
    if (!title.trim()) {
      setMessage("Bitte einen Titel für das Arbeitsblatt angeben.");
      return;
    }

    let finalTopicId = topicId;
    if (topicMode === "new") {
      if (!newTopicName.trim()) {
        setMessage("Bitte einen Themennamen eingeben.");
        return;
      }
    } else if (!topicId) {
      setMessage("Bitte ein Thema wählen.");
      return;
    }

    for (const d of drafts) {
      if (!d.question.trim()) {
        setMessage("Jede Aufgabe braucht eine Frage.");
        return;
      }
      if (d.type === "multiple_choice") {
        const opts = d.options.map((o) => o.trim()).filter(Boolean);
        if (opts.length < 2 || !d.correctAnswer.trim()) {
          setMessage("Multiple-Choice-Aufgaben brauchen mind. 2 Optionen und eine richtige Antwort.");
          return;
        }
      }
      if (d.type === "zahl" && !d.correctAnswer.trim()) {
        setMessage("Bitte bei Zahlenaufgaben die richtige Antwort angeben.");
        return;
      }
      if (d.type === "bild_klick" && (!d.imageData || d.correctX == null)) {
        setMessage("Bitte ein Bild hochladen und die richtige Stelle anklicken.");
        return;
      }
      if (d.type === "freitext" && !d.explanation.trim()) {
        setMessage("Bitte bei Freitext-Aufgaben eine Musterlösung angeben, damit der Prüfer die Antwort abgleichen kann.");
        return;
      }
    }

    setSaving(true);

    if (topicMode === "new") {
      const { data, error } = await supabase
        .from("topics")
        .insert({ subject_id: subjectId, name: newTopicName.trim(), lernziel: newTopicLernziel.trim() || null })
        .select()
        .single();
      if (error) {
        setMessage("Fehler beim Anlegen des Themas: " + error.message);
        setSaving(false);
        return;
      }
      finalTopicId = data.id;
    }

    const { data: ws, error: wsError } = await supabase
      .from("worksheets")
      .insert({ topic_id: finalTopicId, title: title.trim(), description: description.trim() || null, is_general: false })
      .select()
      .single();

    if (wsError) {
      setMessage("Fehler beim Anlegen des Arbeitsblatts: " + wsError.message);
      setSaving(false);
      return;
    }

    for (const d of drafts) {
      await supabase.from("tasks").insert({
        worksheet_id: ws.id,
        type: d.type,
        question: d.question.trim(),
        options: d.type === "multiple_choice" ? d.options.map((o) => o.trim()).filter(Boolean) : null,
        correct_answer: d.type === "freitext" || d.type === "bild_klick" ? null : d.correctAnswer.trim(),
        explanation: d.explanation.trim() || null,
        image_data: d.type === "bild_klick" ? d.imageData : null,
        correct_x: d.type === "bild_klick" ? d.correctX : null,
        correct_y: d.type === "bild_klick" ? d.correctY : null,
        tolerance: d.type === "bild_klick" ? d.tolerance : null,
      });
    }

    setSaving(false);
    router.push(`/pruefer/fach/${subjectId}`);
  }

  return (
    <div>
      <nav className="topnav">
        <a onClick={() => router.push(`/pruefer/fach/${subjectId}`)} style={{ cursor: "pointer" }}>← Zurück</a>
        <LogoutLink />
      </nav>
      <h1>Neues Arbeitsblatt</h1>

      <div className="card">
        <label>Thema</label>
        <div className="option-row">
          <label style={{ fontWeight: 400 }}>
            <input type="radio" checked={topicMode === "existing"} onChange={() => setTopicMode("existing")} /> Vorhandenes Thema
          </label>
          <label style={{ fontWeight: 400 }}>
            <input type="radio" checked={topicMode === "new"} onChange={() => setTopicMode("new")} /> Neues Thema
          </label>
        </div>
        {topicMode === "existing" ? (
          <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            <option value="">Bitte wählen...</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        ) : (
          <>
            <input type="text" placeholder="Name des neuen Themas" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} />
            <label>Lernziel (optional)</label>
            <textarea rows={2} placeholder="Was soll gelernt werden?" value={newTopicLernziel} onChange={(e) => setNewTopicLernziel(e.target.value)} />
          </>
        )}

        <label>Titel des Arbeitsblatts</label>
        <input type="text" placeholder="z.B. Arbeitsblatt 1: Kopfrechnen" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label>Beschreibung (optional)</label>
        <textarea rows={2} placeholder="Kurzer Hinweis, was zu tun ist" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <h2>Aufgaben</h2>
      <p className="hint">
        Für mathematische Formeln: LaTeX zwischen Dollarzeichen schreiben, z.B. <code>$7 \cdot 8 = ?$</code> oder <code>{'$\\frac{3}{4}$'}</code>.
        Bitte deutsche Schulschreibweise verwenden: <code>\cdot</code> für Malnehmen (Punkt, kein "x") und <code>:</code> für Geteilt (kein "÷").
      </p>

      {drafts.map((d) => (
        <TaskDraftEditor
          key={d.localId}
          draft={d}
          canRemove={drafts.length > 1}
          onChange={(patch) => updateDraft(d.localId, patch)}
          onOptionChange={(idx, val) => updateOption(d.localId, idx, val)}
          onAddOption={() => addOption(d.localId)}
          onRemove={() => removeTask(d.localId)}
          onImageUpload={(file) => handleImageUpload(d.localId, file)}
          onImageClick={(e, imgEl) => handleImageClick(d.localId, e, imgEl)}
        />
      ))}

      <button type="button" className="btn secondary" onClick={addTask}>+ weitere Aufgabe</button>

      <button className="btn full" style={{ marginTop: 16 }} onClick={handleSave} disabled={saving}>
        {saving ? "Speichert..." : "Arbeitsblatt speichern"}
      </button>
      {message && <p style={{ color: "var(--color-wrong)" }}>{message}</p>}
    </div>
  );
}

function TaskDraftEditor({ draft, canRemove, onChange, onOptionChange, onAddOption, onRemove, onImageUpload, onImageClick }) {
  const previewHtml = mathToStaticHtml(draft.question || "(Vorschau erscheint hier)");

  return (
    <div className="task-block">
      {canRemove && (
        <button type="button" className="remove-task" onClick={onRemove}>Entfernen</button>
      )}
      <label>Aufgabentyp</label>
      <select value={draft.type} onChange={(e) => onChange({ type: e.target.value })}>
        <option value="multiple_choice">Multiple Choice</option>
        <option value="zahl">Zahleneingabe (z.B. Mathe)</option>
        <option value="freitext">Freitext-Antwort</option>
        <option value="bild_klick">Bild anklicken (z.B. Geometrie)</option>
      </select>

      <label>Frage / Aufgabenstellung</label>
      <textarea
        className="latex"
        rows={2}
        placeholder='z.B. Berechne: $7 \cdot 8 = ?$'
        value={draft.question}
        onChange={(e) => onChange({ question: e.target.value })}
      />
      <div className="math-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />

      {draft.type === "multiple_choice" && (
        <>
          <label>Antwortoptionen</label>
          {draft.options.map((opt, i) => (
            <input key={i} type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => onOptionChange(i, e.target.value)} />
          ))}
          <button type="button" className="btn secondary" onClick={onAddOption} style={{ marginBottom: 12 }}>+ weitere Option</button>
          <label>Richtige Antwort (exakter Text einer Option)</label>
          <input type="text" value={draft.correctAnswer} onChange={(e) => onChange({ correctAnswer: e.target.value })} />
        </>
      )}

      {draft.type === "zahl" && (
        <>
          <label>Richtige Antwort (Zahl)</label>
          <input type="text" value={draft.correctAnswer} onChange={(e) => onChange({ correctAnswer: e.target.value })} />
        </>
      )}

      {draft.type === "bild_klick" && (
        <div>
          <label>Bild hochladen</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && onImageUpload(e.target.files[0])} />
          <p className="hint">Klicke danach im Bild auf die Stelle, die die richtige Antwort ist (z.B. den rechten Winkel).</p>
          {draft.imageData && (
            <div style={{ position: "relative", display: "inline-block", width: "100%", marginBottom: 12 }}>
              <img
                src={draft.imageData}
                style={{ width: "100%", borderRadius: 8, display: "block", cursor: "crosshair" }}
                onClick={(e) => onImageClick(e, e.target)}
                alt="Aufgabe"
              />
              {draft.correctX != null && (
                <div
                  style={{
                    position: "absolute",
                    width: 16,
                    height: 16,
                    margin: "-8px",
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                    border: "2px solid white",
                    left: `${draft.correctX}%`,
                    top: `${draft.correctY}%`,
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          )}
          <label>Toleranzbereich</label>
          <select value={draft.tolerance} onChange={(e) => onChange({ tolerance: parseInt(e.target.value, 10) })}>
            <option value={5}>eng (genau treffen)</option>
            <option value={8}>mittel</option>
            <option value={14}>großzügig</option>
          </select>
        </div>
      )}

      <label>{draft.type === "freitext" ? "Musterlösung (Pflichtfeld – damit der Prüfer die Antwort abgleichen kann)" : "Erklärung / Lösungsweg (optional)"}</label>
      <textarea className="latex" rows={2} value={draft.explanation} onChange={(e) => onChange({ explanation: e.target.value })} />
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <NeuesArbeitsblatt />
    </RoleGuard>
  );
}
