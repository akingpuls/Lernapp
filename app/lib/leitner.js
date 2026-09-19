// Leitner-System für Spaced Repetition beim Vokabellernen.
// Phase 1-6, mit steigenden Wiederholungsabständen (in Tagen).
// Phase 0 bedeutet "noch nicht eingeführt" (nur beim Einprägen gesehen).

export const MAX_PHASE = 6;
export const PHASE_INTERVALS_DAYS = [1, 3, 7, 16, 35, 90]; // Index 0 = Phase 1

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function intervalForPhase(phase) {
  const idx = Math.min(Math.max(phase, 1), MAX_PHASE) - 1;
  return PHASE_INTERVALS_DAYS[idx];
}

// Wird nach einer richtigen Antwort aufgerufen: eine Phase weiter nach oben,
// neues Fälligkeitsdatum entsprechend dem Intervall der neuen Phase.
export function onCorrect(progress) {
  const newPhase = Math.min((progress.phase || 0) + 1, MAX_PHASE);
  return {
    phase: newPhase,
    next_due_at: addDaysISO(intervalForPhase(newPhase)),
    times_correct: (progress.times_correct || 0) + 1,
    times_wrong: progress.times_wrong || 0,
    introduced: true,
    last_seen_at: new Date().toISOString(),
  };
}

// Wird nach einer falschen Antwort aufgerufen: sofort zurück auf Phase 1,
// wird am selben Tag oder beim nächsten Öffnen erneut abgefragt.
export function onWrong(progress) {
  return {
    phase: 1,
    next_due_at: todayISO(),
    times_correct: progress.times_correct || 0,
    times_wrong: (progress.times_wrong || 0) + 1,
    introduced: true,
    last_seen_at: new Date().toISOString(),
  };
}

// Eine Vokabel ist "fällig", wenn sie noch nie eingeführt wurde, oder wenn
// ihr next_due_at heute oder in der Vergangenheit liegt.
export function isDue(progress, today) {
  if (!progress) return true; // noch keine Fortschritts-Zeile -> neu
  if (!progress.introduced) return true;
  if (!progress.next_due_at) return true;
  return progress.next_due_at <= today;
}
