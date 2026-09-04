# Lern-App (privates Familien-Tool)

Eine schlanke Lern-App nach dem Vorbild von [anton.app](https://anton.app),
gebaut für die Begleitung des schulischen Lernens einer Schülerin der
5. Klasse (Gymnasium NRW, G9).

## Was die App kann

- **Echter Login** mit E-Mail + Passwort (Supabase Auth), serverseitig geprüft
- **Prüfer-Ansicht:** Arbeitsblätter mit mehreren Aufgaben anlegen (Multiple
  Choice, Zahleneingabe, Freitext, Bild anklicken), zuweisen, Abgaben ansehen
  und bewerten, Anmerkungen schreiben
- **Schülerinnen-Ansicht:** Arbeitsblätter als Ganzes bearbeiten und mit einem
  Klick abgeben; sofortiges Feedback bei automatisch auswertbaren Aufgaben
- **Mathematische Formeln** per LaTeX (z.B. `$7 \cdot 8 = ?$`), gerendert mit
  KaTeX; deutsche Schulschreibweise (Malpunkt/Doppelpunkt)
- **Bild-Klick-Aufgaben** für Geometrie: Bild hochladen, richtige Stelle
  markieren, automatische Auswertung per Abstand
- **Musterlösungen** für Freitext-Aufgaben sind Pflicht und werden dem Prüfer
  direkt bei der Bewertung angezeigt
- **Fehlerspeicher:** Falsch beantwortete Aufgaben tauchen automatisch als
  "Wiederholung" wieder auf, bis sie richtig gelöst werden
- **Druck-/PDF-/Word-Export** pro Arbeitsblatt (Aufgaben- und Lösungen-Version)
  zum Ausdrucken und Ausfüllen mit Stift
- Erreichbar von jedem Gerät mit Browser (Mac, iPhone, iPad), auf dem iPhone
  als Home-Bildschirm-App installierbar (PWA)

## Aufbau

```
App/
├── app/
│   ├── page.js                        Login (E-Mail + Passwort)
│   ├── schuelerin/
│   │   ├── page.js                    Fächer-Übersicht
│   │   ├── fach/[subjectId]/          Arbeitsblätter-Liste je Fach
│   │   ├── arbeitsblatt/[assignmentId]/  Arbeitsblatt lösen (alle Aufgaben)
│   │   └── wiederholung/[subjectId]/  Wiederholungs-Aufgaben lösen
│   └── pruefer/
│       ├── page.js                    Dashboard
│       ├── fach/[subjectId]/          Arbeitsblätter-Liste + "Neu"
│       ├── fach/[subjectId]/neu/      Arbeitsblatt anlegen (Aufgaben-Editor)
│       ├── arbeitsblatt/[worksheetId]/zuweisen/    Zuweisen
│       ├── arbeitsblatt/[worksheetId]/antworten/   Antworten ansehen
│       ├── arbeitsblatt/[worksheetId]/drucken/     Druck-/Word-Export
│       └── pruefen/                   Alle Abgaben chronologisch
├── lib/
│   ├── supabaseClient.js              Datenbank-Verbindung
│   ├── supabaseAuth.js                Login + Rollen-Ermittlung
│   ├── RoleGuard.js                   Schützt Seiten je nach Rolle
│   ├── mathRender.js                  LaTeX → statisches HTML (KaTeX)
│   ├── MathText.js                    React-Komponente für Formel-Anzeige
│   └── TaskInput.js                   Aufgaben-Eingabe (alle Typen) + Bewertung
├── public/manifest.json               PWA-Manifest
├── supabase/schema.sql                Datenbankschema + Row-Level-Security
└── SETUP.md                           Schritt-für-Schritt Einrichtung
```

## Einrichtung

Siehe **SETUP.md** – dort steht die komplette Anleitung (Supabase mit echtem
Login + Vercel-Hosting).

## Lokal testen (optional, nur für technisch Interessierte)

```bash
npm install
# .env.local mit NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY anlegen
npm run build   # Produktions-Build (empfohlen zum Prüfen auf Fehler)
npm run dev     # Entwicklungsserver unter http://localhost:3000
```

## Bekannte Einschränkungen

- Bilder für "Bild anklicken"-Aufgaben werden als Base64-Text in der
  Datenbank gespeichert (kein separater Datei-Speicher) - für den privaten
  Gebrauch ausreichend, bei sehr vielen/großen Bildern ggf. Umstellung auf
  Supabase Storage sinnvoll
- Word-Export: komplexere Formeln (Brüche) können in echtem MS Word optisch
  leicht abweichen, da Word nur eingeschränkt HTML/CSS unterstützt - der
  Browser-Druck/PDF-Weg ist zuverlässiger

## Nächste Ausbaustufen (Ideen, nicht umgesetzt)

- Stifteingabe/Handschrift für Rechenwege (Canvas-basiert)
- Statistik/Verlauf pro Fach für den Prüfer
- Erinnerungen/Benachrichtigungen bei neuen Arbeitsblättern
- Mehrere Kinder/Profile
