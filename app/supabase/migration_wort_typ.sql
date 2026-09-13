-- =====================================================================
-- Migration: neuer Aufgabentyp 'wort' (Tippen mit automatischer Bewertung)
-- Ausführen im Supabase Dashboard unter: SQL Editor -> New Query -> Run
-- NACH schema.sql, VOR seed_vokabeltest_englisch_welcome.sql
--
-- Unterschied zu 'freitext': 'freitext' ist für offene Antworten gedacht
-- und wird manuell vom Prüfer bewertet. 'wort' ist für kurze, eindeutige
-- Antworten (z.B. ein englisches Vokabelwort) und wird wie 'zahl' sofort
-- automatisch bewertet (Groß-/Kleinschreibung und Leerzeichen am Rand
-- werden ignoriert).
-- =====================================================================

alter table tasks drop constraint if exists tasks_type_check;
alter table tasks add constraint tasks_type_check
  check (type in ('multiple_choice', 'freitext', 'zahl', 'bild_klick', 'wort'));
