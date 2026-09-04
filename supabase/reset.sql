-- =====================================================================
-- RESET: Entfernt eine ältere/veraltete Tabellenstruktur vollständig,
-- damit schema.sql anschließend sauber und vollständig neu aufbauen kann.
-- Nur nötig, wenn schema.sql bereits einmal (in einer älteren Version)
-- ausgeführt wurde, BEVOR die Arbeitsblatt-Struktur eingeführt wurde.
--
-- Achtung: Löscht alle bisherigen Daten in diesen Tabellen (Fächer, Themen,
-- Aufgaben, Zuweisungen, Antworten, Anmerkungen, Profile). Für den
-- aktuellen Testzeitpunkt unbedenklich.
--
-- Reihenfolge danach:
--   1. Dieses reset.sql ausführen
--   2. schema.sql erneut komplett ausführen
--   3. profiles-Einträge für die beiden Nutzerkonten neu anlegen (siehe SETUP.md)
--   4. seed_beispiele.sql ausführen
-- =====================================================================

drop table if exists mistake_queue cascade;
drop table if exists feedback cascade;
drop table if exists submissions cascade;
drop table if exists assignments cascade;
drop table if exists tasks cascade;
drop table if exists worksheets cascade;
drop table if exists topics cascade;
drop table if exists subjects cascade;
drop table if exists profiles cascade;
drop function if exists is_pruefer();
