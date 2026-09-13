-- =====================================================================
-- Vokabeltest Englisch: "Welcome to Brighton" (Lambacher/Klett-Vokabelseiten
-- 225, Unit "Welcome" - 35 markierte Testvokabeln)
-- Im Supabase SQL Editor ausführen, NACHDEM schema.sql UND
-- migration_wort_typ.sql bereits ausgeführt wurden.
--
-- Format: Deutsch -> Englisch (wie gewünscht), Mix aus:
--   - 'multiple_choice' (3 Auswahlmöglichkeiten)
--   - 'wort' (Antwort eintippen, automatische Bewertung, Groß-/Klein-
--     schreibung und Leerzeichen am Rand egal)
-- Beide Aufgabentypen liefern zugleich die Karteikarten für die
-- "Karteikarten üben"-Ansicht (Frage = Vorderseite, correct_answer =
-- Rückseite), es ist also keine gesonderte Karteikarten-Tabelle nötig.
-- =====================================================================

do $$
declare
  v_subject_id bigint;
  v_topic_id bigint;
  v_worksheet_id bigint;
begin
  select id into v_subject_id from subjects where name = 'Englisch';

  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Unit: Welcome to Brighton (Vokabeln)',
     'Die 35 Testvokabeln aus "Welcome to Brighton" sicher auf Englisch wiedergeben können.')
    returning id into v_topic_id;

  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Vokabeltest: Welcome to Brighton',
     'Deutsch -> Englisch. Erst Karteikarten üben, dann den Test machen.', true)
    returning id into v_worksheet_id;

  -- ---- Multiple Choice (14) ----
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', 'Wie heißt „Willkommen in Brighton.“ auf Englisch?',
     '["Welcome to Brighton.","Welcome in Brighton.","Welcome at Brighton."]'::jsonb, 'Welcome to Brighton.');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', 'Wie heißt „Ich heiße Alice.“ auf Englisch?',
     '["My name is Alice.","I am named Alice.","I heiße Alice."]'::jsonb, 'My name is Alice.');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', 'Wie heißt „Ich bin aus Brighton.“ auf Englisch?',
     '["I''m from Brighton.","I''m at Brighton.","I''m of Brighton."]'::jsonb, 'I''m from Brighton.');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', 'Wie heißt „Ich bin elf Jahre alt.“ auf Englisch?',
     '["I''m eleven years old.","I''m eleven years.","I have eleven years."]'::jsonb, 'I''m eleven years old.');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„am Meer“ - wie heißt das auf Englisch?',
     '["by the sea","at the sea","in the sea"]'::jsonb, 'by the sea');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„mein Freund / meine Freundin“ - wie heißt das auf Englisch?',
     '["my friend","my friendship","my friends"]'::jsonb, 'my friend');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„eine Stadt“ - wie heißt das auf Englisch?',
     '["a city","a town","a village"]'::jsonb, 'a city');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„in England“ - wie heißt das auf Englisch?',
     '["in England","at England","on England"]'::jsonb, 'in England');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„auch“ - wie heißt das auf Englisch?',
     '["too","two","also"]'::jsonb, 'too');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„der/die/das“ (bestimmter Artikel) - wie heißt das auf Englisch?',
     '["the","a","an"]'::jsonb, 'the');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„sehen; besuchen“ - wie heißt das auf Englisch?',
     '["(to) see","(to) look","(to) watch"]'::jsonb, '(to) see');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„denken, glauben, meinen“ - wie heißt das auf Englisch?',
     '["(to) think","(to) believe","(to) know"]'::jsonb, '(to) think');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„acht“ - wie heißt das auf Englisch?',
     '["eight","eighteen","eighty"]'::jsonb, 'eight');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„zwölf“ - wie heißt das auf Englisch?',
     '["twelve","twenty","two"]'::jsonb, 'twelve');

  -- ---- Tippen / 'wort' (21) ----
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„eins“ - wie heißt das auf Englisch?', 'one');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„zwei“ - wie heißt das auf Englisch?', 'two');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„drei“ - wie heißt das auf Englisch?', 'three');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„vier“ - wie heißt das auf Englisch?', 'four');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„fünf“ - wie heißt das auf Englisch?', 'five');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„sechs“ - wie heißt das auf Englisch?', 'six');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„sieben“ - wie heißt das auf Englisch?', 'seven');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„neun“ - wie heißt das auf Englisch?', 'nine');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„zehn“ - wie heißt das auf Englisch?', 'ten');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„elf“ - wie heißt das auf Englisch?', 'eleven');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„das Meer“ - wie heißt das auf Englisch?', 'sea');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„der Junge“ - wie heißt das auf Englisch?', 'boy');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„das Mädchen“ - wie heißt das auf Englisch?', 'girl');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„der Strand“ - wie heißt das auf Englisch?', 'beach');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„der Sand“ - wie heißt das auf Englisch?', 'sand');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„die Möwe“ - wie heißt das auf Englisch?', 'seagull');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„der Himmel“ - wie heißt das auf Englisch?', 'sky');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„der Stein“ - wie heißt das auf Englisch?', 'stone');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„mögen“ - wie heißt das auf Englisch?', 'like');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„das Bild“ - wie heißt das auf Englisch?', 'picture');
  insert into tasks (worksheet_id, type, question, correct_answer) values
    (v_worksheet_id, 'wort', '„nett, schön“ - wie heißt das auf Englisch?', 'nice');

  insert into assignments (worksheet_id, status, note_from_pruefer) values
    (v_worksheet_id, 'offen', 'Übe zuerst mit den Karteikarten, dann mach den Test. Viel Erfolg!');
end $$;
