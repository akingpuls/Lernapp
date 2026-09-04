# Setup-Anleitung – Lern-App online bringen

Diese Anleitung führt einmalig durch die Einrichtung. Danach ist die App über
einen festen Link von überall erreichbar (Mac, iPhone, iPad).

Dauer: ca. 15–20 Minuten. Alles ist kostenlos.

---

## Schritt 1: GitHub-Konto (falls noch nicht vorhanden)

1. Gehe zu https://github.com und erstelle ein kostenloses Konto (falls nötig).
2. Erstelle ein neues, **privates** Repository, z. B. `lernapp`.
3. Lade den Inhalt dieses `App`-Ordners in das Repository hoch (per Drag & Drop
   über die GitHub-Weboberfläche, oder mit `git push`, falls vertraut damit).

## Schritt 2: Supabase-Projekt anlegen (Datenbank)

1. Gehe zu https://supabase.com und erstelle ein kostenloses Konto.
2. Klicke auf "New Project". Vergib einen Namen (z. B. `lernapp`) und ein
   Datenbank-Passwort (irgendwo notieren, wird aber im Alltag nicht mehr gebraucht).
3. Warte, bis das Projekt erstellt ist (ca. 1–2 Minuten).
4. Öffne im linken Menü **SQL Editor** → **New query**.
5. Öffne die Datei `supabase/schema.sql` aus diesem Projekt, kopiere den
   gesamten Inhalt hinein und klicke **Run**. Damit werden alle Tabellen
   angelegt und die 7 Fächer vorbefüllt.
6. Gehe im linken Menü zu **Project Settings → API**. Dort findest du:
   - **Project URL** (sieht aus wie `https://xxxxx.supabase.co`)
   - **anon public key** (ein langer Text-Schlüssel)

   Beide brauchst du gleich in Schritt 3.

## Schritt 3: Bei Vercel deployen (Hosting)

1. Gehe zu https://vercel.com und melde dich mit deinem GitHub-Konto an.
2. Klicke auf **Add New → Project** und wähle dein `lernapp`-Repository aus.
3. Vercel erkennt automatisch, dass es sich um eine Next.js-App handelt.
4. **Wichtig:** Klicke auf "Environment Variables" und trage folgende Werte ein:

   | Name | Wert |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | die Project URL aus Schritt 2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | der anon public key aus Schritt 2 |
   | `NEXT_PUBLIC_PRUEFER_CODE` | ein selbst gewählter Code für dich, z. B. `4711` |
   | `NEXT_PUBLIC_SCHUELERIN_CODE` | ein selbst gewählter Code für deine Tochter, z. B. `1234` |

5. Klicke auf **Deploy**. Nach ca. 1 Minute bekommst du eine Adresse wie
   `https://lernapp-deinname.vercel.app`.

**Das ist die feste Adresse, die von überall funktioniert.**

## Schritt 4: Auf dem iPhone einrichten

1. Öffne die Vercel-Adresse in **Safari** auf dem iPhone.
2. Tippe auf das Teilen-Symbol (Quadrat mit Pfeil nach oben).
3. Wähle **"Zum Home-Bildschirm"**.
4. Fertig – ab jetzt gibt es ein App-Icon, das sich wie eine echte App öffnet.

Auf dem Mac reicht ein Lesezeichen in Safari/Chrome, oder ebenfalls
"Zum Dock hinzufügen" in Safari (Ablage → Zum Dock hinzufügen).

## Schritt 5: Codes verteilen

- Du meldest dich mit dem `NEXT_PUBLIC_PRUEFER_CODE` an → Prüfer-Ansicht.
- Deine Tochter meldet sich mit dem `NEXT_PUBLIC_SCHUELERIN_CODE` an → Schülerinnen-Ansicht.

## Später etwas ändern?

- Code-Änderungen: Datei in GitHub ändern → Vercel deployt automatisch neu.
- Neue Umgebungsvariable ändern: In Vercel unter Project Settings → Environment
  Variables anpassen, danach einmal "Redeploy" klicken.

## Sicherheitshinweis

Diese App ist für den **privaten Familiengebrauch** konzipiert, nicht als
öffentliches Produkt. Die Zugriffs-Codes sind einfach gehalten (wie bei ANTON:
"Login mit Code"). Die Adresse ist nicht öffentlich auffindbar, aber auch nicht
durch ein vollwertiges Login-System geschützt. Für den beschriebenen Zweck
(zwei Personen, Schulaufgaben) ist das ein angemessener Kompromiss aus
Einfachheit und Sicherheit.
