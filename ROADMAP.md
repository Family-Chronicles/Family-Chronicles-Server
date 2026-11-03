# Roadmap – Fertigstellung von Family Chronicles

Dieser Plan beschreibt die Schritte bis zu einer nutzbaren Version 1.0 von Server (REST-API) und App (Web-UI).
Grundlage sind die Anforderungen aus [REQUIREMENTS.md](./REQUIREMENTS.md) sowie die offenen Issues.

Legende: ✅ erledigt · 🚧 in Arbeit · ⬜ offen

---

## Ausgangslage (Bestandsaufnahme)

- Express + MongoDB, Controller für `users`, `persons`, `familys`.
- Authentifizierung über **einen fest im Code hinterlegten Bearer-Token**, keine Rollenprüfung.
- Passwörter werden **im Klartext** gespeichert und über die API ausgeliefert.
- `DatabaseService` öffnet bei **jedem Aufruf eine neue MongoDB-Verbindung** (Verbindungsleck).
- Fehler in Controllern:
  - `update` übergibt ein Promise statt eines Filters an `updateOne` → Updates greifen nie.
  - `create` antwortet, bevor das Speichern abgeschlossen ist.
  - `PersonController.update` vertauscht `RelationshipIds` und `RelatedDataIds`.
  - Route `/person/name?firstName&lastName` kann nie matchen.
  - Such-Endpunkte löschen `_id` auf einem Array statt auf den Einträgen.
- Es fehlen: Beziehungen (Controller), Medien/Daten, Tagging, Familien-Mitgliedschaften mit Rollen,
  Mittelnamen, Todesursache, Start-/Enddatum von Verknüpfungen, Login, Tests.
- Konfiguration (inkl. DB-Zugangsdaten) liegt fest in `default.config.json`.
- Die App ist leer.

---

## Phase 1 – Server-Fundament stabilisieren ✅

- ✅ Konfiguration über Umgebungsvariablen (`.env`), JSON-Config nur noch als Default.
- ✅ Eine geteilte MongoDB-Verbindung, sauberes Starten/Beenden.
- ✅ Generische Repository-Schicht (`IRepository<T>`) mit MongoDB- und In-Memory-Implementierung
  (In-Memory für Tests und lokale Entwicklung ohne Datenbank).
- ✅ Generischer CRUD-Controller, einheitliche Fehlerantworten (`HttpError`, zentraler Error-Handler).
- ✅ Eingabevalidierung für alle Schreib-Endpunkte.
- ✅ Bestehende Bugs (siehe oben) behoben.
- ✅ CORS konfigurierbar, Rate-Limit konfigurierbar.
- ✅ API unter `/api/v1` gebündelt (alte Pfade bleiben vorerst nicht erhalten – Breaking Change in 0.x).

## Phase 2 – Authentifizierung & Rechte (Issue #34) ✅

- ✅ `POST /api/v1/auth/login` → JWT (Access-Token), `GET /api/v1/auth/me`.
- ✅ Passwort-Hashing mit `scrypt` (Node-Bordmittel), Passwörter verlassen nie die API.
- ✅ Rollen gemäß Anforderungen:
  - **Viewer**: lesen von Personen, Familien, Beziehungen, Medien
  - **Editor**: zusätzlich schreiben auf Personen, Familien, Beziehungen, Medien
  - **Admin**: zusätzlich Benutzerverwaltung
- ✅ Initialer Admin über `ADMIN_EMAIL` / `ADMIN_PASSWORD` beim ersten Start.

## Phase 3 – Datenmodell gemäß Anforderungen vervollständigen ✅

- ✅ Person: Vor-, Mittel- (mehrere) und Nachnamen, Geburts-/Sterbedatum, -ort, Todesursache, Geschlecht, Notizen.
- ✅ Beziehungen Person ↔ Person mit Typ, **Rolle** (Mutter, Sohn, Stiefkind, …), Start- und Enddatum.
- ✅ Mitgliedschaften Person ↔ Familie mit Rolle, Start- und Enddatum.
- ✅ Familie: Name, Beschreibung, Notizen, historische Namen; Nachnamen der Mitglieder abrufbar.
- ✅ Medien (Bilder, Videos, Texte, Dokumente) je Person mit Beschreibung, Datei-Upload, Download.
- ✅ Tagging von Personen auf Medien (optional mit Position im Bild).
- ✅ Suche: Personen nach Name, Geburtsdatum; Familienbaum-Endpunkt (`/persons/:id/tree`).
- ✅ Kaskadierendes Aufräumen (Löschen einer Person entfernt Beziehungen, Mitgliedschaften, Tags).

## Phase 4 – Qualitätssicherung ✅

- ✅ Test-Setup mit Vitest + Supertest gegen die In-Memory-Repositories.
- ✅ Tests für Auth, Rechte, CRUD, Beziehungen, Baum.
- ✅ GitHub-Action: Lint, Build, Test bei jedem PR (Server und App).
- ✅ OpenAPI-Dokumentation für alle Endpunkte (`/docs`, JSON unter `/openapi.json`).
- ✅ Docker-Compose: Zugangsdaten über `.env`, Healthchecks, Upload-Volume.
- ✅ Integrationstests gegen eine echte MongoDB (MongoDB-Container in der CI, lokal mit `TEST_MONGO_URL`).

## Phase 5 – Web-App (Svelte, bQuery.js, TypeScript, Tailwind) ✅

Technik: Vite + Svelte 5 + TypeScript + Tailwind CSS 4. **bQuery.js** (`@bquery/bquery`) liefert
Signals für den globalen Zustand (Session, Benachrichtigungen), den HTTP-Client, das Hash-Routing
und Screenreader-Ansagen; Svelte übernimmt das Rendering der Komponenten.
Code: [Family-Chronicles-App](https://github.com/Family-Chronicles/Family-Chronicles-App).

- ✅ Projektgerüst, Build, Lint/Typecheck.
- ✅ Typisierter API-Client inkl. Token-Handling.
- ✅ Login / Logout, Session-Persistenz, rollenabhängige Navigation.
- ✅ Personen: Liste mit Suche, Detailansicht, Anlegen/Bearbeiten/Löschen.
- ✅ Familien: Liste, Detail mit Mitgliedern, Anlegen/Bearbeiten/Löschen.
- ✅ Beziehungen auf der Personen-Detailseite verwalten.
- ✅ Medien hochladen, anzeigen, Personen taggen.
- ✅ Stammbaum-Ansicht (Vorfahren/Nachkommen).
- ✅ Benutzerverwaltung (nur Admin).
- ✅ Mehrsprachigkeit (DE/EN) mit bQuery i18n, Sprache wird gemerkt.
- ✅ E2E-Tests (Playwright) im App-Repo, laufen in der CI gegen den echten Server.
- ✅ Docker-Compose für App + Server + MongoDB (im App-Repo).
- ✅ Paginierung und Server-Suche (`limit`/`offset`, `X-Total-Count`, `/stats`); die App lädt nur noch, was sie anzeigt.

## Phase 6 – Erweiterungen

- ✅ GEDCOM-Import/-Export (Issue #37) – siehe [docs/gedcom.md](docs/gedcom.md), in der App unter „Import/Export“.
- ✅ GEDCOM: Lebensereignisse (Taufe, Beerdigung, Beruf, Wohnort, …) und Quellen; in der App bearbeitbar.
- ⬜ GEDCOM: Medien (`OBJE`) – die Dateien sind nicht Teil der GEDCOM-Datei, bräuchte z. B. ZIP-Import (GEDZIP).
- ✅ WebSocket-API für Live-Updates (Issue #38) – Bewertung und Protokoll in [docs/websocket.md](docs/websocket.md), in der App aktiv.
- ✅ Live-Updates über mehrere Server-Instanzen (`LIVE_RELAY=mongo`, capped collection).
- ✅ Föderation, erste Version: API-Tokens, verbundene Instanzen, Personen-Verknüpfungen – siehe [docs/federation.md](docs/federation.md).
- ⬜ Föderation: Stammbaum über Instanzgrenzen hinweg anzeigen, Personen übernehmen, Instanzen gegenseitig finden.
- ✅ Refresh-Tokens (rotierend), Abmelden auf dem Server, Passwort-Zurücksetzen per E-Mail.
