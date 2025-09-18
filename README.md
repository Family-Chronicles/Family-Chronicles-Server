# Family-Chronicles

[![GitHub issues](https://img.shields.io/github/issues/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)](https://github.com/Family-Chronicles/Family-Chronicles-Server/issues)
![GitHub stars](https://img.shields.io/github/stars/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)
[![GitHub license](https://img.shields.io/github/license/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)](https://github.com/Family-Chronicles/Family-Chronicles-Server/blob/main/LICENSE)
[![CodeFactor](https://www.codefactor.io/repository/github/Family-Chronicles/Family-Chronicles-Server/badge?style=for-the-badge)](https://www.codefactor.io/repository/github/Family-Chronicles/Family-Chronicles-Server)
[![GitHub forks](https://img.shields.io/github/forks/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)](https://github.com/Family-Chronicles/Family-Chronicles-Server/network)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)

The Family Chronicles project is an attempt to develop a family tree management tool. The focus here is on an open API that should support existing standards, but also provide its own more complex interfaces. The vision is to make instances of the API linkable by administrators to form multiple family pedigrees into one big whole.

## Wichtiger Hinweis zur Authentifizierung

In der Datei `src/config/default.config.json` müssen die Felder `privateKey` und `publicKey` im Abschnitt `auth` mit sicheren Werten belegt werden, damit die Authentifizierung (JWT) funktioniert. Beispiel:

```
"auth": {
  "privateKey": "<dein-geheimer-schlüssel>",
  "publicKey": "<dein-public-key>",
  "tokenExpiration": "1d"
}
```

Ersetze die Platzhalter durch eigene, sichere Werte!
