-- =====================================================================
-- Lern-App Datenbankschema (Supabase / Postgres)
-- Ausführen im Supabase Dashboard unter: SQL Editor -> New Query -> Run
-- =====================================================================

-- Fächer (vorbefüllt gemäß Schulprojekt NRW, Klasse 5)
create table if not exists subjects (
  id bigint generated always as identity primary key,
  name text not null unique,
  sort_order int not null default 0
);

insert into subjects (name, sort_order) values
  ('Mathematik', 1),
  ('Deutsch', 2),
  ('Englisch', 3),
  ('Biologie', 4),
  ('Physik', 5),
  ('Politik/Wirtschaft', 6),
  ('Religion', 7)
on conflict (name) do nothing;

-- Themen innerhalb eines Fachs, inkl. Lernziel
create table if not exists topics (
  id bigint generated always as identity primary key,
  subject_id bigint not null references subjects(id) on delete cascade,
  name text not null,
  lernziel text,
  created_at timestamptz not null default now()
);

-- Aufgaben (gehören zu einem Thema)
-- type: 'multiple_choice' | 'freitext' | 'zahl'
create table if not exists tasks (
  id bigint generated always as identity primary key,
  topic_id bigint not null references topics(id) on delete cascade,
  type text not null check (type in ('multiple_choice', 'freitext', 'zahl')),
  question text not null,
  options jsonb,              -- nur bei multiple_choice: ["Antwort A", "Antwort B", ...]
  correct_answer text,        -- bei multiple_choice: exakter Options-Text; bei zahl: Zahl als Text
  explanation text,           -- optionale Erklärung/Lösungsweg, wird nach Beantwortung gezeigt
  created_at timestamptz not null default now()
);

-- Zuweisungen: eine Aufgabe wird der Schülerin mit Fälligkeit zugewiesen
-- status: 'offen' | 'erledigt'
-- is_wiederholung: true, wenn diese Zuweisung aus dem Fehlerspeicher stammt
create table if not exists assignments (
  id bigint generated always as identity primary key,
  task_id bigint not null references tasks(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  due_date date,
  status text not null default 'offen' check (status in ('offen', 'erledigt')),
  is_wiederholung boolean not null default false,
  note_from_pruefer text        -- optionaler Hinweis bei Zuweisung ("Bitte genau lesen!")
);

-- Abgegebene Antworten der Schülerin
create table if not exists submissions (
  id bigint generated always as identity primary key,
  assignment_id bigint not null references assignments(id) on delete cascade,
  answer text not null,
  is_correct boolean,           -- null = noch nicht bewertet (bei Freitext ggf. manuell)
  auto_graded boolean not null default false,
  submitted_at timestamptz not null default now()
);

-- Anmerkungen des Prüfers zu einer abgegebenen Antwort
create table if not exists feedback (
  id bigint generated always as identity primary key,
  submission_id bigint not null references submissions(id) on delete cascade,
  comment text not null,
  created_at timestamptz not null default now()
);

-- Fehlerspeicher: falsch beantwortete Aufgaben, die zur Wiederholung anstehen
create table if not exists mistake_queue (
  id bigint generated always as identity primary key,
  task_id bigint not null references tasks(id) on delete cascade,
  times_wrong int not null default 1,
  resolved boolean not null default false,
  last_wrong_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- =====================================================================
-- Row Level Security
-- Hinweis: Dies ist ein privates Familien-Tool (kein öffentliches Produkt).
-- Zugriff erfolgt ausschließlich über den privaten Supabase-Projekt-Key,
-- den nur ihr kennt. Daher sind die Policies bewusst einfach gehalten
-- (voller Zugriff für "anon"), statt eine komplexe Nutzerverwaltung
-- für zwei Personen aufzubauen.
-- =====================================================================

alter table subjects enable row level security;
alter table topics enable row level security;
alter table tasks enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table feedback enable row level security;
alter table mistake_queue enable row level security;

create policy "allow all - subjects" on subjects for all using (true) with check (true);
create policy "allow all - topics" on topics for all using (true) with check (true);
create policy "allow all - tasks" on tasks for all using (true) with check (true);
create policy "allow all - assignments" on assignments for all using (true) with check (true);
create policy "allow all - submissions" on submissions for all using (true) with check (true);
create policy "allow all - feedback" on feedback for all using (true) with check (true);
create policy "allow all - mistake_queue" on mistake_queue for all using (true) with check (true);
