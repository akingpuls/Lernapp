-- =====================================================================
-- Migration: Spaced-Repetition (Leitner-System) für Vokabeln
-- Ausführen im Supabase Dashboard unter: SQL Editor -> New Query -> Run
-- Kann gefahrlos mehrfach ausgeführt werden (idempotent).
-- =====================================================================

-- Markiert Aufgaben, die als Vokabel im Spaced-Repetition-System laufen
-- (aktuell: alle "wort"-Aufgaben mit hinterlegter Lösung)
alter table tasks add column if not exists is_vocab boolean not null default false;
update tasks set is_vocab = true where type = 'wort' and correct_answer is not null;

-- Fortschritt pro Vokabel (eine Zeile pro Aufgabe)
-- phase 0 = noch nicht eingeführt (nur "Einprägen" gesehen, falls introduced=false)
-- phase 1-6 = Leitner-Phasen, je höher desto seltener wird abgefragt
create table if not exists word_progress (
  id bigint generated always as identity primary key,
  task_id bigint not null references tasks(id) on delete cascade,
  phase int not null default 0,
  introduced boolean not null default false,
  next_due_at date,
  times_correct int not null default 0,
  times_wrong int not null default 0,
  last_seen_at timestamptz,
  unique (task_id)
);

alter table word_progress enable row level security;

drop policy if exists "lesen - word_progress" on word_progress;
drop policy if exists "anlegen - word_progress" on word_progress;
drop policy if exists "aendern - word_progress" on word_progress;

-- Beide Rollen dürfen lesen und schreiben: der Lernfortschritt wird
-- automatisch durch die App gepflegt, während die Schülerin lernt.
create policy "lesen - word_progress" on word_progress for select using (auth.uid() is not null);
create policy "anlegen - word_progress" on word_progress for insert with check (auth.uid() is not null);
create policy "aendern - word_progress" on word_progress for update using (auth.uid() is not null);
