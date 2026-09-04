# UPDATE.md – Diese neue Version installieren

Diese Änderungen sind enthalten:
- Überschrift "Lotta's Lern-App" (Anmeldeseite, Browser-Tab-Titel, App-Icon-Name)
- Anmeldung: erst Rolle wählen (Schülerin/Prüfer), danach E-Mail/Passwort
- Beispiel-Arbeitsblätter für alle 7 Fächer (als "Allgemein" gekennzeichnet)

Du musst zwei Dinge tun: **Code aktualisieren** (GitHub Desktop) und **Beispielinhalte
in die Datenbank einfügen** (Supabase SQL Editor). Beides einmalig, ca. 10 Minuten.

---

## Teil 1: Code aktualisieren

1. Öffne den Ordner, den du beim letzten Mal mit GitHub Desktop angelegt hast
   (der lokale "Lernapp"-Ordner auf deinem Mac).
2. Entpacke die neue `Schulprojekt_NRW.zip`, öffne darin `App/`.
3. Kopiere diese 3 Dateien aus dem neuen `App`-Ordner in deinen lokalen
   "Lernapp"-Ordner und **überschreibe** die vorhandenen Dateien mit gleichem Namen:
   - `app/page.js`
   - `app/layout.js`
   - `public/manifest.json`
4. Öffne GitHub Desktop. Dort werden jetzt die geänderten Dateien angezeigt.
5. Schreibe unten links eine kurze Beschreibung (z.B. "Login mit Rollenauswahl,
   Titel Lotta's Lern-App") und klicke auf **"Commit to main"**.
6. Klicke oben auf **"Push origin"**.
7. Fertig – Vercel erkennt die Änderung automatisch und veröffentlicht sie
   innerhalb von ca. 1 Minute (das hattest du beim letzten Mal schon erlebt,
   diesmal sollte es ohne die vorherigen Stolpersteine funktionieren, da
   Framework Preset und Umgebungsvariablen ja jetzt korrekt eingestellt sind).

## Teil 2: Beispielinhalte in die Datenbank einfügen

**Falls du Supabase schon ganz am Anfang eingerichtet hast** (bevor die
Arbeitsblatt-Struktur eingeführt wurde), fehlt dir wahrscheinlich die Tabelle
"worksheets". Erkennbar an der Fehlermeldung `relation "worksheets" does not
exist`. In dem Fall zuerst diesen Zwischenschritt:

0. **Nur falls obiger Fehler auftritt:** SQL Editor → New query → kompletten
   Inhalt von `supabase/reset.sql` einfügen → Run. Das entfernt die veraltete
   Struktur (unbedenklich, da noch keine echten Daten drin sind). Danach:
   New query → kompletten Inhalt von `supabase/schema.sql` NOCHMAL einfügen
   → Run (baut jetzt alles vollständig neu auf, inkl. `worksheets`-Tabelle).
   **Wichtig:** Da dabei auch die `profiles`-Tabelle neu angelegt wird, musst
   du die beiden Zuordnungen (Prüfer/Schülerin zu den jeweiligen Konten)
   erneut eintragen: Authentication → Users → UUID der beiden Konten
   kopieren → Table Editor → profiles → je eine Zeile mit `id` (UUID) und
   `role` ('pruefer' bzw. 'schuelerin') neu anlegen (wie in SETUP.md Schritt 8
   beschrieben).

Dann normal weiter:

1. Gehe zu deinem Supabase-Projekt (supabase.com → dein Projekt).
2. Öffne links **SQL Editor → New query**.
3. Öffne die Datei `supabase/seed_beispiele.sql` aus dem neuen `App`-Ordner,
   kopiere den **gesamten Inhalt** hinein.
4. Klicke **Run**.
5. Es sollte "Success. No rows returned" o.ä. erscheinen. Falls eine
   Fehlermeldung kommt, sag mir genau, was dort steht.

Das fügt 9 Arbeitsblätter mit insgesamt 18 Aufgaben in alle 7 Fächer ein
(Mathematik x2, Deutsch x2, Englisch, Biologie, Physik, Politik/Wirtschaft,
Religion je 1), inklusive einer Bild-Klick-Aufgabe in Mathematik (Geometrie).

**Wichtig:** Dieses Skript kannst du nur **einmal** ausführen. Führst du es
ein zweites Mal aus, werden die Arbeitsblätter doppelt angelegt (es gibt
keine "nur einfügen, falls noch nicht vorhanden"-Prüfung wie im Haupt-Schema).
Falls das passiert: einfach die doppelten Einträge im Supabase Table Editor
unter der Tabelle `worksheets` (und zugehörige `topics`/`tasks`) manuell löschen.

## Danach testen

1. Öffne eure App-Adresse (z.B. `https://lernapp-indol.vercel.app`).
2. Du solltest zuerst "Wer bist du?" mit zwei Buttons sehen, nicht direkt
   das Anmeldeformular.
3. Nach Auswahl der Rolle: E-Mail/Passwort eingeben, anmelden.
4. Als Schülerin: Bei den Fächern sollten jetzt überall Arbeitsblätter mit
   "Allgemein"-Badge auftauchen (nicht mehr leer).
5. Als Prüfer: Ebenso - unter jedem Fach ein oder zwei Arbeitsblätter.

Falls irgendwas nicht wie erwartet aussieht, schick mir einen Screenshot.
