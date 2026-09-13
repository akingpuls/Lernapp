-- =====================================================================
-- Beispiel-Arbeitsblätter für alle 7 Fächer ("Allgemein" - NRW-Kernlehrplan
-- Klasse 5, nicht buchspezifisch). Im Supabase SQL Editor ausführen,
-- NACHDEM schema.sql bereits ausgeführt wurde.
-- =====================================================================

do $$
declare
  v_subject_id bigint;
  v_topic_id bigint;
  v_worksheet_id bigint;
begin
  -- Mathematik: Kopfrechnen
  select id into v_subject_id from subjects where name = 'Mathematik';
  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Einmaleins & Grundrechenarten', 'Das kleine Einmaleins und die vier Grundrechenarten sicher anwenden.')
    returning id into v_topic_id;
  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Arbeitsblatt 1: Kopfrechnen', 'Rechne im Kopf. Schreib nur das Ergebnis auf.', true)
    returning id into v_worksheet_id;
  insert into tasks (worksheet_id, type, question, correct_answer, explanation) values
    (v_worksheet_id, 'zahl', '$7 \cdot 8 = \, ?$', '56', '$7 \cdot 8 = 56$');
  insert into tasks (worksheet_id, type, question, options, correct_answer, explanation) values
    (v_worksheet_id, 'multiple_choice', '$132 : 4 = \, ?$', '["23","33","43"]'::jsonb, '33', '$132 : 4 = 33$');
  insert into tasks (worksheet_id, type, question, correct_answer, explanation) values
    (v_worksheet_id, 'zahl', '$\frac{3}{4} + \frac{1}{4} = \, ?$ (als Dezimalzahl)', '1', '$\frac{3}{4} + \frac{1}{4} = 1$');
  insert into assignments (worksheet_id, status, note_from_pruefer) values
    (v_worksheet_id, 'offen', 'Viel Erfolg beim Kopfrechnen!');

  -- Mathematik: Geometrie (Bild-Klick)
  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Geometrische Grundbegriffe', 'Rechte Winkel und Dreiecksecken sicher erkennen.')
    returning id into v_topic_id;
  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Arbeitsblatt 2: Rechte Winkel erkennen', 'Schau dir das Dreieck an und klicke auf den rechten Winkel.', true)
    returning id into v_worksheet_id;
  insert into tasks (worksheet_id, type, question, explanation, image_data, correct_x, correct_y, tolerance) values
    (v_worksheet_id, 'bild_klick', 'In welcher Ecke des Dreiecks liegt der rechte Winkel?',
     'Der rechte Winkel liegt bei Punkt A, dort treffen die beiden Seiten im 90-Grad-Winkel aufeinander.',
     'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAGQCAIAAADX0QWRAAALPklEQVR4nO3du4tVVxjG4a0mKlqIprFRBwVtIxYqGJBUtsIgaQwDaRVb0RD/CGtRgo2grUoCyYTgDSQEbEYE0cZCsFYcmZNixCTjXM5l773W+tbzVKdchfzYvJ/ousFg0AAQy/rUDwCgfeIOEJC4AwQk7gABiTtAQOIOEJC4AwQk7gABiTtAQOIOEJC4AwQk7gABiTtAQOIOEJC4AwQk7gABiTtAQOIOEJC4AwQk7gABiTtAQOIOEJC4AwQk7gABiTtAQOIOEJC4AwQk7gABiTtAQOIOEJC4AwQk7gABiTtAQOIOEJC4AwQk7gABiTtAQOIOEJC4AwQk7gABiTtAQOIOEJC4AwQk7gABiTtAQOIOENAXqR8wrJs3b964cWPr1q1btmz56aefdu7cmfpFAPkqI+4PHjy4ffv29evXN23a9Oeff168ePHKlSupHwWQrzJmmatXr547d27Tpk1N03zzzTe7du368OFD6kcB5GvdYDBI/Ya1ffvtt3fv3t24cWPqhwCUoYwv94WFhdRPAChJGXGfmpqam5tb/D0YDC5cuJD2PQCZKyPu33333eXLl9+/f980zZ07dxZ/ALCSMv62zIkTJ16+fHnq1Knt27fv2LHjxx9/TP0igKyVcVAFYCRlzDIAjETcAQISd4CAxB0goOri/vX3P6R+AkDnqot7o+9ABWqMe6PvQHSVxr1pmq+//0HigajqjfsifQdCqj3ujb4DEYl70+g7EI64f2SCByKpOu5//7z0P2LVdyCGquPeNM3fP19Zknh9BwKoPe6L9B0IRtw/+rzvEg+US9z/ZYIHwhD3/zHBAzGI+zL0HSiduC9P34GiifuKnFiBcon7apxYgUKJ+xqcWIESiftQ9B0oi7gPywQPFETcR2CCB0oh7qMxwQNFEPdx6DuQOXEfkwkeyJm4j88ED2RL3CdiggfyJO4t0HcgN+LeDn0HsiLurXFiBfIh7m1yYgUyIe4tc2IFciDundB3IC1x74oJHkhI3DtkggdSEfdumeCBJMS9D/oO9Ezce2KCB/ok7v0xwQO9EfdemeCBfoh7AvoOdE3c09B3oFPinowTK9AdcU/JiRXoiLgn5sQKdEHcs6DvQLvEPRcmeKBF4p4REzzQFnHPiwkeaIW450jfgQmJe6ZM8MAkxD1fJnhgbOKeNRM8MB5xL4C+A6MS9zLoOzAScS+GEyswPHEviRMrMCRxL4wTKzAMcS+SvgOrE/dSmeCBVYh7wUzwwErEvWwmeGBZ4h6BvgNLiHsQJnjgv8Q9DhM88Im4h2KCBxaJe0D6Doh7TPoOlRP3sJxYoWbiHpkTK1RL3INzYoU6iXsV9B1qI+61MMFDVcS9IiZ4qIe418UED5UQ9xrpO4Qn7pUywUNs4l4vEzwEJu5VM8FDVOKOCR4CEneaRt8hHHHnIydWiETc+ZcTK4Qh7vyPEyvEIO4sQ9+hdOLO8kzwUDRxZ0UmeCiXuLMaEzwUStxZm75DccSdoZjgoSzizrBM8FAQcWcEJngohbgzMn2H/Ik749B3yJy4MyYnVsiZuDM+J1bIlrgzESdWyJO40wJ9h9yIO+0wwUNWxJ3WmOAhH+JOm0zwkAlxp336DsmJO50wwUNa4k5XTPCQkLjTIRM8pCLudE7foX/iTh/0HXom7vTEiRX6JO70x4kVeiPu9MqJFfoh7iSg79A1cScNEzx0StxJxgQP3RF3UjLBQ0fEnfT0HVon7mTBBA/tEndyYYKHFok7GTHBQ1vEnezoO0xO3MmRvsOExJ1MObHCJMSdfDmxwtjEnaw5scJ4xJ0C6DuMStwpgwkeRiLuFMMED8MTd0pigochiTvl0XdYk7hTJBM8rE7cKZUJHlYh7hTMBA8rEXeKp+/wOXEnAn2HJcSdIJxY4b/EnTicWOETcScUJ1ZYJO4EpO8g7sRkgqdy4k5YJnhqJu5EZoKnWuJOfPpOhcSdKpjgqY24UwsTPFURdypigqce4k519J0aiDs10nfCE3cq5cRKbOJOvZxYCUzcqZoTK1GJO5jgCUjcoWlM8IQj7vCRCZ5IxB3+ZYInDHGHpfSdAMQdlmGCp3TiDsszwVM0cYcVmeApl7jDGvSdEok7rE3fKY64w1CcWCmLuMOwnFgpiLjDCJxYKYW4w8j0nfyJO4zDBE/mxB3GZIInZ+IO4zPBky1xh0npOxkSd2iBCZ7ciDu0wwRPVsQdWmOCJx/iDi3Td3Ig7tA+fSc5cYdOOLGSlrhDV5xYSUjcoUNOrKQi7tA5fad/4g59MMHTM3GHnpjg6ZO4Q39M8PRG3KFv+k4PxB0SMMHTNXGHNEzwdErcIRkTPN0Rd0hM3+mCuEN6+k7rxB2y4MRKu8QdcuHESovEHTLixEpbxB2yo+9MTtwhRyZ4JiTukCkTPJMQd8iXCZ6xiTvkTt8Zg7hDAUzwjErcoQwmeEYi7lAMEzzDE3cojL4zDHGH8ug7axJ3KJITK6sTdyiVEyurEHcomBMrKxF3KJ6+8zlxhwhM8Cwh7hCECZ7/EneIwwTPJ+IO0eg7jbhDSCZ4xB1iMsFXTtwhLBN8zcQdgtP3Ook7xKfvFRJ3qIITa23EHWrhxFoVcYeKOLHWQ9yhOvpeA3GHGpngwxN3qJQJPjZxh3qZ4AMTd6idvock7oAJPiBxB5rGBB+OuAMfmeAjEXfgf/Q9BnEHltL3AMQdWIYTa+nEHVieE2vRxB1YkRNrucQdWIO+l0jcgbWZ4Isj7sBQTPBlEXdgWCb4gog7MBp9L4K4AyMzwedP3IFxmOAzJ+7AmEzwORN3YCL6nidxByal7xkSd6AFTqy5EXegHU6sWRF3oDVOrPkQd6Bl+p4DcQfaZ4JPTtyBTpjg0xJ3oCsm+ITEHeiWvich7kDnTPD9E3egDyb4nok70BMTfJ/EHeiVvvdD3IG+6XsPxB1IwIm1a+IOpOHE2ilxB5JxYu2OuAOJ6XsXxB1IzwTfOnEHsmCCb5e4A7kwwbdo3WAwSP2GXvmzAsX5/KOeNflyB3Jngh+DuANl0PeRiDtQDH0fXnWbO0ANfLkDBCTuAAGJO0BA4g4QkLgDBCTuAAGJO0BA4g4QkLgDBCTuAAEVHPdbt24dPHjwzZs3qR8CJHPo0KGZmZmZmZnp6enZ2dnUz8lIwf+2zNmzZ/fs2bNv376TJ0+mfguQxpEjRx4+fNg0zdOnT8+cOfPrr7+mflEuSv1yf/fu3du3b6enp//444/UbwHS279//4YNG1K/IiOlxv3evXvHjh2bmpp69erV/Px86ucAiT169Oj8+fOpX5GRL1I/YEy//fbb3NzcL7/88vr168ePHx89ejT1i4AE5ufnZ2Zm5ufnnzx5cvjw4ePHj6d+US6KjPvCwsKLFy9u3brVNM29e/dmZ2fFHer05ZdfXrt2rWmaZ8+enT59OvVzMlLkLPPXX38dOHBg8fehQ4fu37+f9j1Actu2bdu9e3fqV2SkyC/333///fDhw4u/N2/e/NVXXz1//nzv3r1pXwX0b3GWWb9+fdM0ly5dSv2cjBT8VyEBWEmRswwAqxN3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSAgcQcISNwBAhJ3gIDEHSCgfwCnemIqZ0JodAAAAABJRU5ErkJggg==', 16.0, 80.0, 10);
  insert into assignments (worksheet_id, status) values (v_worksheet_id, 'offen');

  -- Deutsch: Wortarten
  select id into v_subject_id from subjects where name = 'Deutsch';
  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Wortarten', 'Nomen, Verben und Adjektive sicher erkennen und benennen können.')
    returning id into v_topic_id;
  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Arbeitsblatt 1: Wortarten erkennen', 'Beantworte die Fragen in ganzen Sätzen.', true)
    returning id into v_worksheet_id;
  insert into tasks (worksheet_id, type, question, explanation) values
    (v_worksheet_id, 'freitext', 'Nenne ein Beispiel für ein Nomen und erkläre kurz, woran man es erkennt.',
     'Musterlösung: Zum Beispiel der Tisch. Nomen erkennt man daran, dass man einen Artikel davorsetzen kann (der Tisch) und sie großgeschrieben werden.');
  insert into assignments (worksheet_id, status) values (v_worksheet_id, 'offen');

  -- Deutsch: Satzglieder
  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Satzglieder', 'Subjekt und Prädikat in einfachen Sätzen bestimmen können.')
    returning id into v_topic_id;
  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Arbeitsblatt 2: Subjekt und Prädikat', 'Bestimme die markierten Satzglieder.', true)
    returning id into v_worksheet_id;
  insert into tasks (worksheet_id, type, question, options, correct_answer, explanation) values
    (v_worksheet_id, 'multiple_choice', 'Welches Wort ist das Subjekt im Satz "Der Hund bellt laut."?',
     '["Der Hund","bellt","laut"]'::jsonb, 'Der Hund',
     'Das Subjekt beantwortet die Frage "Wer oder was?" - hier: der Hund.');
  insert into tasks (worksheet_id, type, question, explanation) values
    (v_worksheet_id, 'freitext', 'Schreibe einen eigenen Satz und gib danach das Prädikat in Klammern an.',
     'Musterlösung: Zum Beispiel "Die Kinder spielen im Garten. (spielen)"');
  insert into assignments (worksheet_id, status) values (v_worksheet_id, 'offen');

  -- Englisch
  select id into v_subject_id from subjects where name = 'Englisch';
  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Greetings & Numbers', 'Sich auf Englisch vorstellen und bis 20 zählen können.')
    returning id into v_topic_id;
  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Worksheet 1: Introduce yourself', 'Answer the questions in English.', true)
    returning id into v_worksheet_id;
  insert into tasks (worksheet_id, type, question, options, correct_answer, explanation) values
    (v_worksheet_id, 'multiple_choice', 'What does "Goodbye" mean in German?',
     '["Guten Morgen","Auf Wiedersehen","Danke"]'::jsonb, 'Auf Wiedersehen',
     '"Goodbye" bedeutet "Auf Wiedersehen".');
  insert into tasks (worksheet_id, type, question, correct_answer, explanation) values
    (v_worksheet_id, 'zahl', 'Write the number: "twelve" (as a digit)', '12', '"twelve" = 12');
  insert into tasks (worksheet_id, type, question, explanation) values
    (v_worksheet_id, 'freitext', 'Write two sentences to introduce yourself in English (name, age, one hobby).',
     'Sample answer: "My name is Anna. I am 11 years old and I like playing football."');
  insert into assignments (worksheet_id, status) values (v_worksheet_id, 'offen');

  -- Biologie
  select id into v_subject_id from subjects where name = 'Biologie';
  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Wirbeltiere', 'Die Wirbeltierklassen unterscheiden und Merkmale von Säugetieren benennen können.')
    returning id into v_topic_id;
  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Arbeitsblatt 1: Wirbeltiere unterscheiden', 'Ordne zu und beschreibe.', true)
    returning id into v_worksheet_id;
  insert into tasks (worksheet_id, type, question, options, correct_answer, explanation) values
    (v_worksheet_id, 'multiple_choice', 'Welches Tier gehört NICHT zu den Säugetieren?',
     '["Hund","Pferd","Adler","Katze"]'::jsonb, 'Adler',
     'Der Adler ist ein Vogel, die anderen sind Säugetiere.');
  insert into tasks (worksheet_id, type, question, explanation) values
    (v_worksheet_id, 'freitext', 'Nenne zwei typische Merkmale von Säugetieren.',
     'Zum Beispiel: Sie sind lebendgebärend und säugen ihre Jungen; sie sind meist behaart; sie sind gleichwarm.');
  insert into assignments (worksheet_id, status) values (v_worksheet_id, 'offen');

  -- Physik
  select id into v_subject_id from subjects where name = 'Physik';
  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Licht und Schatten', 'Erklären können, wie Schatten entstehen und wovon ihre Größe abhängt.')
    returning id into v_topic_id;
  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Arbeitsblatt 1: Licht und Schatten', 'Beantworte die Fragen zu Licht und Schatten.', true)
    returning id into v_worksheet_id;
  insert into tasks (worksheet_id, type, question, options, correct_answer, explanation) values
    (v_worksheet_id, 'multiple_choice', 'Was entsteht, wenn Licht auf einen undurchsichtigen Gegenstand trifft?',
     '["Ein Regenbogen","Ein Schatten","Ein Echo"]'::jsonb, 'Ein Schatten',
     'Undurchsichtige Gegenstände lassen kein Licht durch - dahinter entsteht ein Schatten.');
  insert into tasks (worksheet_id, type, question, explanation) values
    (v_worksheet_id, 'freitext', 'Erkläre: Warum ist ein Schatten manchmal größer und manchmal kleiner als der Gegenstand selbst?',
     'Die Schattengröße hängt vom Abstand zwischen Lichtquelle, Gegenstand und der Fläche ab, auf die der Schatten fällt.');
  insert into assignments (worksheet_id, status) values (v_worksheet_id, 'offen');

  -- Politik/Wirtschaft
  select id into v_subject_id from subjects where name = 'Politik/Wirtschaft';
  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Kinderrechte', 'Wichtige Kinderrechte benennen und erklären können, wer sie festgelegt hat.')
    returning id into v_topic_id;
  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Arbeitsblatt 1: Kinderrechte', 'Beantworte die Fragen zu den Rechten von Kindern.', true)
    returning id into v_worksheet_id;
  insert into tasks (worksheet_id, type, question, options, correct_answer, explanation) values
    (v_worksheet_id, 'multiple_choice', 'Welche Organisation hat die Kinderrechtskonvention verabschiedet?',
     '["Die Vereinten Nationen (UN)","Die Europäische Union (EU)","Der Bundestag"]'::jsonb,
     'Die Vereinten Nationen (UN)', 'Die UN-Kinderrechtskonvention wurde 1989 von den Vereinten Nationen verabschiedet.');
  insert into tasks (worksheet_id, type, question, explanation) values
    (v_worksheet_id, 'freitext', 'Nenne ein Recht, das Kinder laut der UN-Kinderrechtskonvention haben.',
     'Zum Beispiel: Recht auf Bildung, Recht auf Schutz, Recht auf Mitbestimmung, Recht auf Freizeit und Spiel.');
  insert into assignments (worksheet_id, status) values (v_worksheet_id, 'offen');

  -- Religion (katholisch)
  select id into v_subject_id from subjects where name = 'Religion';
  insert into topics (subject_id, name, lernziel) values
    (v_subject_id, 'Die Bibel kennenlernen', 'Den Aufbau der Bibel grob kennen und ein Beispiel für ein biblisches Buch nennen können.')
    returning id into v_topic_id;
  insert into worksheets (topic_id, title, description, is_general) values
    (v_topic_id, 'Arbeitsblatt 1: Die Bibel', 'Beantworte die Fragen zur Bibel.', true)
    returning id into v_worksheet_id;
  insert into tasks (worksheet_id, type, question, options, correct_answer, explanation) values
    (v_worksheet_id, 'multiple_choice', 'Aus wie vielen großen Teilen besteht die christliche Bibel?',
     '["Aus einem Teil","Aus zwei Teilen (Altes und Neues Testament)","Aus vier Teilen"]'::jsonb,
     'Aus zwei Teilen (Altes und Neues Testament)', 'Die christliche Bibel besteht aus dem Alten Testament und dem Neuen Testament.');
  insert into tasks (worksheet_id, type, question, explanation) values
    (v_worksheet_id, 'freitext', 'Nenne den Namen eines biblischen Buches oder einer biblischen Geschichte, die du kennst.',
     'Musterlösung: Zum Beispiel die Schöpfungsgeschichte, die Arche Noah, oder das Buch Genesis.');
  insert into assignments (worksheet_id, status) values (v_worksheet_id, 'offen');

end $$;
