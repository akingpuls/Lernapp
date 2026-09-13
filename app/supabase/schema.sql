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

-- Arbeitsblätter: bündeln mehrere zusammengehörige Aufgaben eines Themas
create table if not exists worksheets (
  id bigint generated always as identity primary key,
  topic_id bigint not null references topics(id) on delete cascade,
  title text not null,
  description text,
  is_general boolean not null default false,
  created_at timestamptz not null default now()
);

-- Aufgaben (gehören zu einem Arbeitsblatt statt direkt zu einem Thema)
-- type: 'multiple_choice' | 'freitext' | 'zahl'
-- question/explanation: können LaTeX-Formeln zwischen $...$ enthalten (Rendering per KaTeX im Frontend)
create table if not exists tasks (
  id bigint generated always as identity primary key,
  worksheet_id bigint not null references worksheets(id) on delete cascade,
  sort_order int not null default 0,
  type text not null check (type in ('multiple_choice', 'freitext', 'zahl', 'bild_klick')),
  question text not null,
  options jsonb,              -- nur bei multiple_choice: ["Antwort A", "Antwort B", ...]
  correct_answer text,        -- bei multiple_choice: exakter Options-Text; bei zahl: Zahl als Text
  explanation text,           -- optionale Erklärung/Musterlösung, wird nach Beantwortung gezeigt
  image_data text,            -- nur bei bild_klick: Bild als Base64-Data-URL
  correct_x numeric,          -- nur bei bild_klick: richtige X-Position in % (0-100)
  correct_y numeric,          -- nur bei bild_klick: richtige Y-Position in % (0-100)
  tolerance numeric,          -- nur bei bild_klick: Toleranzradius in %
  created_at timestamptz not null default now()
);

-- Zuweisungen: ein ganzes Arbeitsblatt wird der Schülerin mit Fälligkeit zugewiesen
-- status: 'offen' | 'erledigt' (erledigt = komplettes Arbeitsblatt abgegeben)
create table if not exists assignments (
  id bigint generated always as identity primary key,
  worksheet_id bigint not null references worksheets(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  due_date date,
  status text not null default 'offen' check (status in ('offen', 'erledigt')),
  note_from_pruefer text        -- optionaler Hinweis bei Zuweisung ("Bitte genau lesen!")
);

-- Abgegebene Antworten der Schülerin (eine Zeile pro Aufgabe innerhalb eines Arbeitsblatts)
-- assignment_id ist null, wenn die Abgabe aus dem dynamischen "Wiederholungen"-Block stammt
-- (dort wird nicht das ganze Arbeitsblatt erneut zugewiesen, sondern nur die einzelne Aufgabe)
create table if not exists submissions (
  id bigint generated always as identity primary key,
  assignment_id bigint references assignments(id) on delete cascade,
  task_id bigint not null references tasks(id) on delete cascade,
  is_wiederholung boolean not null default false,
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
-- Row Level Security mit echtem Login (Supabase Auth)
-- Zwei Rollen: 'pruefer' und 'schuelerin'. Jede Person bekommt ein eigenes
-- Konto (E-Mail + Passwort) über Supabase Auth. Die Rolle wird in der
-- Tabelle "profiles" hinterlegt und mit auth.uid() verknüpft.
-- =====================================================================

-- Verknüpft einen Supabase-Auth-Nutzer mit einer Rolle
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('pruefer', 'schuelerin')),
  display_name text
);

alter table profiles enable row level security;
create policy "eigenes Profil lesen" on profiles for select using (auth.uid() = id);

-- Hilfsfunktion: prüft, ob der eingeloggte Nutzer die Rolle "pruefer" hat
create or replace function is_pruefer()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'pruefer'
  );
$$;

alter table subjects enable row level security;
alter table topics enable row level security;
alter table worksheets enable row level security;
alter table tasks enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table feedback enable row level security;
alter table mistake_queue enable row level security;

-- Fächer/Themen/Arbeitsblätter/Aufgaben: beide Rollen dürfen lesen,
-- nur der Prüfer darf anlegen/ändern/löschen
create policy "lesen - subjects" on subjects for select using (auth.uid() is not null);
create policy "schreiben - subjects" on subjects for all using (is_pruefer()) with check (is_pruefer());

create policy "lesen - topics" on topics for select using (auth.uid() is not null);
create policy "schreiben - topics" on topics for insert with check (is_pruefer());
create policy "aendern - topics" on topics for update using (is_pruefer());
create policy "loeschen - topics" on topics for delete using (is_pruefer());

create policy "lesen - worksheets" on worksheets for select using (auth.uid() is not null);
create policy "schreiben - worksheets" on worksheets for insert with check (is_pruefer());
create policy "aendern - worksheets" on worksheets for update using (is_pruefer());
create policy "loeschen - worksheets" on worksheets for delete using (is_pruefer());

create policy "lesen - tasks" on tasks for select using (auth.uid() is not null);
create policy "schreiben - tasks" on tasks for insert with check (is_pruefer());
create policy "aendern - tasks" on tasks for update using (is_pruefer());
create policy "loeschen - tasks" on tasks for delete using (is_pruefer());

-- Zuweisungen: beide dürfen lesen; nur der Prüfer legt an/ändert die Fälligkeit,
-- die Schülerin darf den Status auf "erledigt" setzen (beim Abgeben)
create policy "lesen - assignments" on assignments for select using (auth.uid() is not null);
create policy "anlegen - assignments" on assignments for insert with check (is_pruefer());
create policy "aendern - assignments" on assignments for update using (auth.uid() is not null);

-- Abgaben: beide dürfen lesen; beide dürfen neue Abgaben einfügen
-- (die Schülerin beim Abgeben); nur der Prüfer darf nachträglich die
-- Bewertung (is_correct) ändern
create policy "lesen - submissions" on submissions for select using (auth.uid() is not null);
create policy "anlegen - submissions" on submissions for insert with check (auth.uid() is not null);
create policy "aendern - submissions" on submissions for update using (is_pruefer());

-- Anmerkungen: beide dürfen lesen, nur der Prüfer darf schreiben
create policy "lesen - feedback" on feedback for select using (auth.uid() is not null);
create policy "schreiben - feedback" on feedback for insert with check (is_pruefer());

-- Fehlerspeicher: beide dürfen lesen und aktualisieren (wird automatisch
-- durch die App gepflegt, nicht manuell durch eine Person)
create policy "lesen - mistake_queue" on mistake_queue for select using (auth.uid() is not null);
create policy "schreiben - mistake_queue" on mistake_queue for insert with check (auth.uid() is not null);
create policy "aendern - mistake_queue" on mistake_queue for update using (auth.uid() is not null);
