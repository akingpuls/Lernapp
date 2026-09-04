# Lern-App (privates Familien-Tool)

Eine schlanke Lern-App nach dem Vorbild von [anton.app](https://anton.app),
gebaut für die Begleitung des schulischen Lernens einer Schülerin der
5. Klasse (Gymnasium NRW, G9).

## Was die App kann

- **Prüfer-Ansicht:** Aufgaben mit Fach, Thema und Lernziel anlegen, der
  Schülerin zuweisen, Abgaben ansehen und bewerten, Anmerkungen schreiben.
- **Schülerinnen-Ansicht:** Offene Aufgaben direkt im Browser bearbeiten
  (Multiple Choice, Zahleneingabe, Freitext), sofortiges Feedback bei
  automatisch auswertbaren Aufgaben.
- **Fehlerspeicher:** Falsch beantwortete Aufgaben tauchen automatisch als
  "Wiederholung" wieder auf, bis sie richtig gelöst werden.
- Erreichbar von jedem Gerät mit Browser (Mac, iPhone, iPad), auf dem iPhone
  als Home-Bildschirm-App installierbar (PWA).

## Aufbau

```
App/
├── app/                  Next.js-Seiten (App Router)
│   ├── page.js           Login mit Code
│   ├── schuelerin/       Aufgabenliste + Bearbeitungsseite
│   └── pruefer/          Übersicht, Aufgaben anlegen, zuweisen, prüfen
├── lib/
│   ├── supabaseClient.js Verbindung zur Datenbank
│   ├── auth.js           Einfache Code-basierte Rollen-Erkennung
│   └── RoleGuard.js       Schützt Seiten je nach Rolle
├── public/
│   └── manifest.json     PWA-Manifest (Home-Bildschirm-Installation)
├── supabase/
│   └── schema.sql        Datenbankschema (im Supabase SQL Editor ausführen)
└── SETUP.md              Schritt-für-Schritt Einrichtung
```

## Einrichtung

Siehe **SETUP.md** – dort steht die komplette Anleitung (Supabase + Vercel).

## Lokal testen (optional, nur für technisch Interessierte)

```bash
npm install
# .env.local mit den gleichen 4 Variablen wie in SETUP.md anlegen
npm run dev
```

Danach ist die App unter http://localhost:3000 erreichbar.

## Nächste Ausbaustufen (Ideen, nicht umgesetzt)

- Automatische Erinnerungen (z. B. Push-Benachrichtigung bei neuer Aufgabe)
- Statistik/Verlauf pro Fach für den Prüfer
- Aufgaben-Import direkt aus den Lehrwerk-Themen des Schulprojekts
- Mehrere Kinder/Profile
