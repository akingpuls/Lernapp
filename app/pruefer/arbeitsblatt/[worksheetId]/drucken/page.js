"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import RoleGuard, { LogoutLink } from "../../../../../lib/RoleGuard";
import { supabase } from "../../../../../lib/supabaseClient";
import { mathToStaticHtml } from "../../../../../lib/mathRender";

function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildBodyHtml(worksheet, topic, tasks, mode) {
  const isLoesung = mode === "loesungen";
  let html = `
    <div class="doc-header">
      <div class="doc-fach">${escapeHtml(worksheet.subject_name)}${topic ? " · " + escapeHtml(topic.name) : ""}</div>
      <h1>${escapeHtml(worksheet.title)}${isLoesung ? " – Lösungen" : ""}</h1>
      ${worksheet.description ? `<p class="doc-desc">${escapeHtml(worksheet.description)}</p>` : ""}
      ${topic && topic.lernziel ? `<p class="doc-lernziel"><em>Lernziel: ${escapeHtml(topic.lernziel)}</em></p>` : ""}
      ${isLoesung ? `<p class="doc-warning">Nur für den Prüfer – nicht an die Schülerin weitergeben.</p>` : `
      <div class="doc-fields"><span>Name: ______________________</span><span>Datum: ____________</span></div>`}
    </div>
  `;

  tasks.forEach((task, i) => {
    html += `<div class="doc-task"><div class="doc-question"><strong>Aufgabe ${i + 1}:</strong> ${mathToStaticHtml(task.question)}</div>`;

    if (task.type === "multiple_choice") {
      html += `<div class="doc-options">`;
      (task.options || []).forEach((opt) => {
        const isRight = isLoesung && String(opt).trim() === String(task.correct_answer).trim();
        html += `<div class="doc-option">${isLoesung ? (isRight ? "●" : "○") : "○"} ${escapeHtml(opt)}${isRight ? " <strong>(richtig)</strong>" : ""}</div>`;
      });
      html += `</div>`;
    } else if (task.type === "zahl") {
      html += isLoesung
        ? `<div class="doc-solution">Richtige Antwort: <strong>${escapeHtml(task.correct_answer)}</strong></div>`
        : `<div class="doc-lines"><div class="doc-line"></div><div class="doc-line"></div><div class="doc-line"></div></div>`;
    } else if (task.type === "bild_klick") {
      html += `<div class="doc-image-wrap"><img src="${task.image_data}" class="doc-image"></div>`;
      html += isLoesung
        ? `<div class="doc-hint">Richtige Stelle: ca. ${Math.round(task.correct_x)}% von links, ${Math.round(task.correct_y)}% von oben.</div>`
        : `<div class="doc-hint">Kreise die richtige Stelle im Bild mit dem Stift ein.</div>`;
    } else {
      html += isLoesung
        ? `<div class="doc-solution">Musterlösung: ${mathToStaticHtml(task.explanation) || "(keine Musterlösung hinterlegt)"}</div>`
        : `<div class="doc-lines"><div class="doc-line"></div><div class="doc-line"></div><div class="doc-line"></div><div class="doc-line"></div><div class="doc-line"></div></div>`;
    }

    if (isLoesung && task.explanation && task.type !== "freitext") {
      html += `<div class="doc-explanation">Erklärung: ${mathToStaticHtml(task.explanation)}</div>`;
    }
    html += `</div>`;
  });

  return html;
}

function DruckAnsicht() {
  const { worksheetId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") === "loesungen" ? "loesungen" : "aufgaben";
  const [bodyHtml, setBodyHtml] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worksheetId, mode]);

  async function load() {
    setLoading(true);
    const { data: ws } = await supabase.from("worksheets").select("*").eq("id", worksheetId).single();
    const { data: topic } = await supabase.from("topics").select("*").eq("id", ws.topic_id).single();
    const { data: subject } = await supabase.from("subjects").select("*").eq("id", topic.subject_id).single();
    const { data: tasks } = await supabase.from("tasks").select("*").eq("worksheet_id", worksheetId).order("id");

    const wsWithSubject = { ...ws, subject_name: subject.name };
    setBodyHtml(buildBodyHtml(wsWithSubject, topic, tasks || [], mode));
    setTitle(`${subject.name} - ${ws.title}${mode === "loesungen" ? " (Loesungen)" : ""}`);
    setLoading(false);
  }

  function handleWordDownload() {
    const fullDoc = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title></head><body>${bodyHtml}</body></html>`;
    const blob = new Blob(["\ufeff", fullDoc], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = title.replace(/[^a-zA-Z0-9äöüÄÖÜß _-]/g, "_") + ".doc";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  if (loading) return <p>Lade...</p>;

  return (
    <div>
      <nav className="topnav print-toolbar">
        <a onClick={() => router.back()} style={{ cursor: "pointer" }}>← Zurück</a>
        <LogoutLink />
      </nav>
      <div className="print-toolbar" style={{ marginBottom: 20 }}>
        <button onClick={() => window.print()}>🖨️ Drucken / Als PDF sichern</button>
        <button className="secondary" onClick={handleWordDownload}>💾 Als Word-Datei herunterladen</button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </div>
  );
}

export default function Page() {
  return (
    <RoleGuard requiredRole="pruefer">
      <Suspense fallback={<p>Lade...</p>}>
        <DruckAnsicht />
      </Suspense>
    </RoleGuard>
  );
}
