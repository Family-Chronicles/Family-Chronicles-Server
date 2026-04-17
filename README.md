# Family-Chronicles

[![GitHub issues](https://img.shields.io/github/issues/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)](https://github.com/Family-Chronicles/Family-Chronicles-Server/issues)
![GitHub stars](https://img.shields.io/github/stars/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)
[![GitHub license](https://img.shields.io/github/license/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)](https://github.com/Family-Chronicles/Family-Chronicles-Server/blob/main/LICENSE)
[![CodeFactor](https://www.codefactor.io/repository/github/Family-Chronicles/Family-Chronicles-Server/badge?style=for-the-badge)](https://www.codefactor.io/repository/github/Family-Chronicles/Family-Chronicles-Server)
[![GitHub forks](https://img.shields.io/github/forks/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)](https://github.com/Family-Chronicles/Family-Chronicles-Server/network)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)

The Family Chronicles project is an attempt to develop a family tree management tool. The focus here is on an open API that should support existing standards, but also provide its own more complex interfaces. The vision is to make instances of the API linkable by administrators to form multiple family pedigrees into one big whole.

## Wichtiger Hinweis zur Authentifizierung

Sicherheitsrelevante Werte dürfen **nicht** in `src/config/default.config.json` oder anderen eingecheckten Dateien hinterlegt werden.

Die Anwendung erwartet Auth-/Kryptografie-Werte über Environment-Variablen:

- `JWT_SECRET` – Secret für das Signieren und Prüfen von JWTs
- `PASSWORD_PRIVATE_KEY` oder `PASSWORD_PRIVATE_KEY_BASE64` – privater RSA-Schlüssel zur Entschlüsselung von Passwörtern
- `PASSWORD_PUBLIC_KEY` oder `PASSWORD_PUBLIC_KEY_BASE64` – öffentlicher RSA-Schlüssel für Clients zum Verschlüsseln von Passwörtern

Zusätzlich können MongoDB-Zugangsdaten per Environment gesetzt werden:

- `MONGO_URI`
- `MONGO_DATABASE`
- `MONGO_USERNAME`
- `MONGO_PASSWORD`

Nutze als Startpunkt die Datei `.env.example` und lege deine tatsächlichen Werte lokal in einer **nicht versionierten** `.env` ab.
