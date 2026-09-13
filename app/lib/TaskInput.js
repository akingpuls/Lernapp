"use client";

import { useState, useRef } from "react";

export function TaskInput({ task, value, onChange }) {
  if (task.type === "multiple_choice") {
    return (
      <div>
        {(task.options || []).map((opt, i) => (
          <label key={i} className="option-row" style={{ fontWeight: 400 }}>
            <input
              type="radio"
              name={`task-${task.id}`}
              value={opt}
              checked={value === opt}
              onChange={(e) => onChange(e.target.value)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  if (task.type === "zahl") {
    return (
      <input
        type="text"
        placeholder="Deine Antwort (Zahl)"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (task.type === "wort") {
    return (
      <input
        type="text"
        placeholder="Deine Antwort (Englisch)"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (task.type === "bild_klick") {
    return <ImageClickInput task={task} value={value} onChange={onChange} />;
  }

  return (
    <textarea
      rows={5}
      placeholder="Schreib deine Antwort hier..."
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ImageClickInput({ task, value, onChange }) {
  const imgRef = useRef(null);
  const [pos, setPos] = useState(() => {
    if (!value) return null;
    const [x, y] = value.split(",").map(Number);
    return { x, y };
  });

  function handleClick(e) {
    const rect = imgRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    const rx = Math.round(xPercent * 10) / 10;
    const ry = Math.round(yPercent * 10) / 10;
    setPos({ x: rx, y: ry });
    onChange(`${rx},${ry}`);
  }

  return (
    <div>
      <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
        <img
          ref={imgRef}
          src={task.image_data}
          onClick={handleClick}
          style={{ width: "100%", borderRadius: 8, display: "block", cursor: "crosshair" }}
          alt="Aufgabe"
        />
        {pos && (
          <div
            style={{
              position: "absolute",
              width: 18,
              height: 18,
              margin: "-9px",
              borderRadius: "50%",
              background: "var(--color-primary)",
              border: "2px solid white",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
      <p className="hint">Klicke im Bild auf die richtige Stelle.</p>
    </div>
  );
}

export function ImageFeedback({ task, answer }) {
  const [ax, ay] = (answer || "").split(",").map(Number);
  const hasStudentPoint = !isNaN(ax) && !isNaN(ay);
  let isCorrect = false;
  if (hasStudentPoint && task.correct_x != null) {
    const dx = ax - task.correct_x;
    const dy = ay - task.correct_y;
    isCorrect = Math.sqrt(dx * dx + dy * dy) <= (task.tolerance || 8);
  }
  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%", marginTop: 8 }}>
      <img src={task.image_data} style={{ width: "100%", borderRadius: 8, display: "block" }} alt="Aufgabe" />
      {task.correct_x != null && (
        <div
          style={{
            position: "absolute",
            width: 18,
            height: 18,
            margin: "-9px",
            borderRadius: "50%",
            background: "var(--color-correct)",
            border: "2px solid white",
            left: `${task.correct_x}%`,
            top: `${task.correct_y}%`,
          }}
        />
      )}
      {hasStudentPoint && !isCorrect && (
        <div
          style={{
            position: "absolute",
            width: 18,
            height: 18,
            margin: "-9px",
            borderRadius: "50%",
            background: "var(--color-wrong)",
            border: "2px solid white",
            left: `${ax}%`,
            top: `${ay}%`,
          }}
        />
      )}
    </div>
  );
}

function normWort(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "");
}

export function gradeAnswer(task, answer) {
  if (task.type === "multiple_choice" || task.type === "zahl") {
    const norm = (s) => String(s).trim().toLowerCase().replace(",", ".");
    return norm(answer) === norm(task.correct_answer || "");
  }
  if (task.type === "wort") {
    return normWort(answer) === normWort(task.correct_answer || "");
  }
  if (task.type === "bild_klick") {
    const [ax, ay] = (answer || "").split(",").map(Number);
    if (isNaN(ax) || isNaN(ay) || task.correct_x == null) return false;
    const dx = ax - task.correct_x;
    const dy = ay - task.correct_y;
    return Math.sqrt(dx * dx + dy * dy) <= (task.tolerance || 8);
  }
  return null; // freitext: manuell zu bewerten
}

export function isAutoGraded(task) {
  return (
    task.type === "multiple_choice" ||
    task.type === "zahl" ||
    task.type === "bild_klick" ||
    task.type === "wort"
  );
}
