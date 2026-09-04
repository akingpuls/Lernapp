# Setup-Anleitung – Lern-App online bringen (mit echtem Login)

Diese Anleitung führt einmalig durch die Einrichtung. Danach ist die App über
einen festen Link von überall erreichbar (Mac, iPhone, iPad) – geschützt durch
echte Benutzerkonten (E-Mail + Passwort), serverseitig geprüft.

Dauer: ca. 25–30 Minuten. Alles ist kostenlos.

---

## Schritt 1: GitHub-Konto

1. Gehe zu https://github.com und erstelle ein kostenloses Konto (falls nötig).
2. Erstelle ein neues, **privates** Repository, z. B. `lernapp`.
3. Lade den Inhalt des `App`-Ordners in das Repository hoch (Drag & Drop über
   die GitHub-Weboberfläche, oder mit `git push`, falls vertraut damit).

## Schritt 2: Supabase-Projekt anlegen (Datenbank + Login)

1. Gehe zu https://supabase.com und erstelle ein kostenloses Konto.
2. Klicke auf "New Project", vergib einen Namen (z. B. `lernapp`) und ein
   Datenbank-Passwort (notieren, wird im Alltag aber nicht mehr gebraucht).
3. Warte, bis das Projekt erstellt ist (ca. 1–2 Minuten).
4. Öffne **SQL Editor → New query**, kopiere den kompletten Inhalt von
   `supabase/schema.sql` hinein und klicke **Run**. Das legt alle Tabellen,
   die 7 Fächer sowie die Zugriffsregeln (Row Level Security) an.
5. **E-Mail-Bestätigung deaktivieren** (vereinfacht die Einrichtung für ein
   privates 2-Personen-Tool): Gehe zu **Authentication → Settings** (bzw.
   "Sign In / Providers" je nach Supabase-Version) und schalte
   **"Confirm email"** aus. Ohne diesen Schritt müsste jede neu angelegte
   Person erst eine Bestätigungs-E-Mail anklicken.
6. Gehe zu **Authentication → Users → Add user** und lege zwei Konten an:
   - Eins für dich (Rolle: Prüfer), z. B. E-Mail `elternteil@deinedomain.de`
     und ein selbst gewähltes Passwort
   - Eins für deine Tochter (Rolle: Schülerin), z. B. E-Mail
     `kind@deinedomain.de` und ein eigenes, einfaches Passwort
   - Die E-Mail-Adressen müssen nicht wirklich empfangbar sein (nur gültig
     formatiert), da die Bestätigung ja deaktiviert wurde. Am einfachsten:
     eine eigene E-Mail-Adresse mit "+"-Zusatz nutzen, falls vorhanden
     (z. B. `deinname+kind@gmail.com` landet trotzdem in deinem Postfach).
7. Für jedes der beiden Konten die **User-ID (UUID)** aus der Nutzerliste
   kopieren (wird in der Tabelle angezeigt).
8. Gehe zu **Table Editor → profiles → Insert row** und lege für jede der
   beiden UUIDs eine Zeile an:
   - `id`: die kopierte UUID
   - `role`: `pruefer` bzw. `schuelerin`
   - `display_name`: z. B. "Mama/Papa" bzw. der Name deiner Tochter
9. Gehe zu **Project Settings → API**. Dort findest du:
   - **Project URL** (z. B. `https://xxxxx.supabase.co`)
   - **anon public key**

## Schritt 3: Bei Vercel deployen (Hosting)

1. Gehe zu https://vercel.com, melde dich mit deinem GitHub-Konto an.
2. **Add New → Project**, wähle dein `lernapp`-Repository.
3. Unter "Environment Variables" eintragen:

   | Name | Wert |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | die Project URL aus Schritt 2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | der anon public key aus Schritt 2 |

   (Die früheren `NEXT_PUBLIC_PRUEFER_CODE`/`NEXT_PUBLIC_SCHUELERIN_CODE`
   werden mit dem echten Login nicht mehr gebraucht.)

4. **Deploy** klicken. Nach ca. 1 Minute gibt es eine Adresse wie
   `https://lernapp-deinname.vercel.app`.

## Schritt 4: Auf dem iPhone einrichten

1. Vercel-Adresse in **Safari** auf dem iPhone öffnen.
2. Teilen-Symbol → **"Zum Home-Bildschirm"**.
3. Fertig – ab jetzt ein App-Icon, das sich wie eine echte App öffnet und
   nach dem Login eingeloggt bleibt.

## Schritt 5: Anmelden

- Du meldest dich mit deiner E-Mail + Passwort an → Prüfer-Ansicht.
- Deine Tochter meldet sich mit ihrer E-Mail + Passwort an → Schülerinnen-Ansicht.

## Spätere Änderungen/Updates veröffentlichen

Ich (Claude) kann keine Datei direkt in dein GitHub-/Vercel-Konto hochladen
(kein Zugriff auf deine Zugangsdaten). Der Ablauf für Updates:

1. Ich bereite die geänderten Dateien vor und gebe sie dir zum Download
2. Du ersetzt die entsprechenden Dateien in deinem GitHub-Repository
   (Drag & Drop über die GitHub-Weboberfläche reicht)
3. Vercel erkennt die Änderung automatisch und veröffentlicht sie innerhalb
   von ca. 1 Minute – für euch beide sofort sichtbar

## Sicherheitshinweis

Mit echtem Login (E-Mail + Passwort über Supabase Auth) wird der Zugriff
**serverseitig** geprüft – nicht nur im Browser-Code wie bei der ursprünglich
einfacheren Code-Variante. Die Datenbank-Regeln (Row Level Security) sorgen
zusätzlich dafür, dass nur eingeloggte Personen überhaupt Daten sehen können,
und bestimmte Aktionen (z. B. neue Aufgaben anlegen, Bewertungen ändern) sind
ausschließlich der Rolle "Prüfer" vorbehalten.

Für einen noch höheren Schutz (z. B. bei Verlust des Passworts, oder falls
langfristig mehr Personen Zugriff bekommen sollen) ließe sich später
zusätzlich Zwei-Faktor-Authentifizierung in Supabase aktivieren – für den
aktuellen privaten Zweck ist das aber nicht notwendig.
