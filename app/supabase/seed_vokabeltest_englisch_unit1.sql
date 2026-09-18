-- =====================================================================
-- Vokabeltest Englisch: Welcome-Kapitel 2-4 + Family (Topic vocab 1A)
-- Quellen: Welcome to Varndean School, Welcome to the Royal Pavilion
-- Gardens, Welcome to the world of pets and hobbies, Lily and her family
-- Im Supabase SQL Editor ausführen, NACHDEM schema.sql UND
-- migration_wort_typ.sql bereits ausgeführt wurden.
--
-- Enthält NUR Begriffe, die noch nicht im ersten Vokabeltest
-- ("Welcome to Brighton") vorkamen (z.B. Zahlen, cool/hot/cold, can,
-- Germany, Bye, garden, park, game, bag, seagull, palace... wurden
-- bewusst NICHT nochmal aufgenommen).
--
-- Kann gefahrlos mehrfach ausgeführt werden (räumt vorher auf).
-- =====================================================================

delete from topics
  where name = 'Unit 1: Varndean School, Pavilion Gardens, Pets & Hobbies, Family'
  and subject_id = (select id from subjects where name = 'Englisch');

do $$
declare
  v_subject_id bigint;
  v_topic_id bigint;
  v_worksheet_id bigint;
begin
  select id into v_subject_id from subjects where name = 'Englisch';

  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Unit 1: Varndean School, Pavilion Gardens, Pets & Hobbies, Family',
     'Farben, Gegenstände, Tiere, Hobbys und Familienwörter aus den Welcome-Kapiteln 2-4 sowie "Lily and her family" sicher auf Englisch wiedergeben können.')
    returning id into v_topic_id;

  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Klassenarbeit: Farben, Tiere, Hobbys & Familie',
     'Deutsch -> Englisch. Erst Karteikarten und Vokabeltrainer üben, dann die Klassenarbeit machen.', true)
    returning id into v_worksheet_id;

  -- ---- Multiple Choice (12) ----
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„neu“ - wie heißt das auf Englisch?',
     '["new","old","young"]'::jsonb, 'new');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„das Jahr“ (Schuljahrgang, z.B. „Year 7“) - wie heißt das auf Englisch?',
     '["year","month","week"]'::jsonb, 'year');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„buchstabieren“ - wie heißt das auf Englisch?',
     '["(to) spell","(to) write","(to) read"]'::jsonb, '(to) spell');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„lila“ - wie heißt das auf Englisch?',
     '["purple","pink","blue"]'::jsonb, 'purple');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„grau“ - wie heißt das auf Englisch?',
     '["grey","black","white"]'::jsonb, 'grey');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„rosa/pink“ - wie heißt das auf Englisch?',
     '["pink","purple","red"]'::jsonb, 'pink');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„das Meerschweinchen“ - wie heißt das auf Englisch?',
     '["guinea pig","hamster","rabbit"]'::jsonb, 'guinea pig');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„der Wellensittich“ - wie heißt das auf Englisch?',
     '["budgie","seagull","spider"]'::jsonb, 'budgie');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„langweilig“ - wie heißt das auf Englisch?',
     '["boring","cute","scary"]'::jsonb, 'boring');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„gruselig“ - wie heißt das auf Englisch?',
     '["scary","cute","boring"]'::jsonb, 'scary');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„klettern“ - wie heißt das auf Englisch?',
     '["climbing","swimming","running"]'::jsonb, 'climbing');
  insert into tasks (worksheet_id, type, question, options, correct_answer) values
    (v_worksheet_id, 'multiple_choice', '„der Cousin/die Cousine“ - wie heißt das auf Englisch?',
     '["cousin","uncle","aunt"]'::jsonb, 'cousin');

  -- ---- Tippen / 'wort' (40) ----
  -- Farben
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„rot“ - wie heißt das auf Englisch?', 'red');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„schwarz“ - wie heißt das auf Englisch?', 'black');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„braun“ - wie heißt das auf Englisch?', 'brown');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„gelb“ - wie heißt das auf Englisch?', 'yellow');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„blau“ - wie heißt das auf Englisch?', 'blue');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„grün“ - wie heißt das auf Englisch?', 'green');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„weiß“ - wie heißt das auf Englisch?', 'white');
  -- Gegenstände im Park
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„der Luftballon“ - wie heißt das auf Englisch?', 'balloon');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Biene“ - wie heißt das auf Englisch?', 'bee');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„der Baum“ - wie heißt das auf Englisch?', 'tree');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„der Hund“ - wie heißt das auf Englisch?', 'dog');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„das Skateboard“ - wie heißt das auf Englisch?', 'skateboard');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„das Fahrrad“ - wie heißt das auf Englisch?', 'bike');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Frisbeescheibe“ - wie heißt das auf Englisch?', 'frisbee');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Blume“ - wie heißt das auf Englisch?', 'flower');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„der Ball“ - wie heißt das auf Englisch?', 'ball');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„das Haus“ - wie heißt das auf Englisch?', 'house');
  -- Tiere
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„der Fisch“ - wie heißt das auf Englisch?', 'fish');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„das Kaninchen“ - wie heißt das auf Englisch?', 'rabbit');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Ratte“ - wie heißt das auf Englisch?', 'rat');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Katze“ - wie heißt das auf Englisch?', 'cat');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Spinne“ - wie heißt das auf Englisch?', 'spider');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„der Hamster“ - wie heißt das auf Englisch?', 'hamster');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Schlange“ - wie heißt das auf Englisch?', 'snake');
  -- Adjektiv + Hobbys
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„niedlich“ - wie heißt das auf Englisch?', 'cute');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„Hockey“ - wie heißt das auf Englisch?', 'hockey');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„Tanzen“ - wie heißt das auf Englisch?', 'dancing');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„Singen“ - wie heißt das auf Englisch?', 'singing');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„Fußball“ - wie heißt das auf Englisch?', 'football');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„Schwimmen“ - wie heißt das auf Englisch?', 'swimming');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„Laufen/Joggen“ - wie heißt das auf Englisch?', 'running');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„Lesen“ - wie heißt das auf Englisch?', 'reading');
  -- Familie
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Oma“ - wie heißt das auf Englisch?', 'grandma');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„der Opa“ - wie heißt das auf Englisch?', 'grandpa');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Mutter/Mama“ - wie heißt das auf Englisch?', 'mum');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„der Vater/Papa“ - wie heißt das auf Englisch?', 'dad');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Tante“ - wie heißt das auf Englisch?', 'aunt');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„der Onkel“ - wie heißt das auf Englisch?', 'uncle');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„der Bruder“ - wie heißt das auf Englisch?', 'brother');
  insert into tasks (worksheet_id, type, question, correct_answer) values (v_worksheet_id, 'wort', '„die Schwester“ - wie heißt das auf Englisch?', 'sister');

  insert into assignments (worksheet_id, status, note_from_pruefer) values
    (v_worksheet_id, 'offen', 'Übe zuerst mit Karteikarten und dem Vokabeltrainer, dann mach die Klassenarbeit. Viel Erfolg!');
end $$;
