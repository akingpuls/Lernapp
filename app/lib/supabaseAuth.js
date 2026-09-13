"use client";

import { supabase } from "./supabaseClient";

// Meldet die Person mit E-Mail + Passwort an und ermittelt anschließend
// ihre Rolle (pruefer/schuelerin) aus der "profiles"-Tabelle.
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "E-Mail oder Passwort ist falsch." };
  }
  const role = await fetchRole(data.user.id);
  if (!role) {
    return { error: "Für dieses Konto ist keine Rolle hinterlegt. Bitte den Prüfer/die Prüferin bitten, den Eintrag in der 'profiles'-Tabelle zu ergänzen." };
  }
  return { role };
}

// Liest die Rolle (pruefer/schuelerin) für eine eingeloggte Nutzer-ID.
export async function fetchRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data.role;
}

// Liefert die aktuelle Supabase-Sitzung (oder null, falls nicht eingeloggt).
export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signOutUser() {
  await supabase.auth.signOut();
}
