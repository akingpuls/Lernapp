"use client";

// Sehr einfache Rollen-Erkennung über einen Code (kein echtes Auth-System).
// Passend für ein privates Familien-Tool mit genau zwei Rollen.
// Die Codes werden in Vercel als Umgebungsvariablen gesetzt (siehe SETUP.md).

const STORAGE_KEY = "lernapp_role";

export function checkCode(code) {
  const pruefercode = process.env.NEXT_PUBLIC_PRUEFER_CODE;
  const schuelerincode = process.env.NEXT_PUBLIC_SCHUELERIN_CODE;

  if (code && pruefercode && code === pruefercode) return "pruefer";
  if (code && schuelerincode && code === schuelerincode) return "schuelerin";
  return null;
}

export function setRole(role) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, role);
  }
}

export function getRole() {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(STORAGE_KEY);
  }
  return null;
}

export function clearRole() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
