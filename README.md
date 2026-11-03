# Family-Chronicles

[![GitHub issues](https://img.shields.io/github/issues/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)](https://github.com/Family-Chronicles/Family-Chronicles-Server/issues)
![GitHub stars](https://img.shields.io/github/stars/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)
[![GitHub license](https://img.shields.io/github/license/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)](https://github.com/Family-Chronicles/Family-Chronicles-Server/blob/main/LICENSE)
[![CodeFactor](https://www.codefactor.io/repository/github/Family-Chronicles/Family-Chronicles-Server/badge?style=for-the-badge)](https://www.codefactor.io/repository/github/Family-Chronicles/Family-Chronicles-Server)
[![GitHub forks](https://img.shields.io/github/forks/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)](https://github.com/Family-Chronicles/Family-Chronicles-Server/network)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/Family-Chronicles/Family-Chronicles-Server?style=for-the-badge)

The Family Chronicles project is an attempt to develop a family tree management tool. The focus here is on an open API that should support existing standards, but also provide its own more complex interfaces. The vision is to make instances of the API linkable by administrators to form multiple family pedigrees into one big whole.

## Quick start

```bash
cp .env.example .env   # set JWT_SECRET and ADMIN_PASSWORD (required on first start)
npm run start          # starts server + MongoDB with docker compose
```

Without Docker and without a database (data is kept in memory only):

```bash
npm install
npm run dev            # admin: admin@family-chronicles.local / admin12345
```

- API: `http://localhost:8080/api/v1`
- Interactive documentation: `http://localhost:8080/docs` (OpenAPI JSON at `/openapi.json`)

## Development

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `npm run build` | Compile TypeScript to `dist/`       |
| `npm run lint`  | ESLint + Prettier check             |
| `npm test`      | API tests (in-memory, no DB needed) |

## API overview

All routes live under `/api/v1` and, except `auth/login` and `health`, need a
`Authorization: Bearer <token>` header (token from `POST /auth/login`).

| Resource         | Routes                                                                   | Write access |
| ---------------- | ------------------------------------------------------------------------ | ------------ |
| `/auth`          | `login`, `me`, `me/password`                                             | –            |
| `/users`         | CRUD                                                                     | Admin        |
| `/persons`       | CRUD, `?q=` search, `/:id/relationships`, `/families`, `/media`, `/tree` | Editor       |
| `/families`      | CRUD, `/:id/members` (incl. surnames on detail)                          | Editor       |
| `/memberships`   | CRUD – person ↔ family with role and dates                               | Editor       |
| `/relationships` | CRUD – person ↔ person with type, role and dates                         | Editor       |
| `/media`         | CRUD with file upload, `/:id/file`, `/:id/tags`                          | Editor       |

Reading needs at least the role `Viewer`. See [ROADMAP.md](./ROADMAP.md) for the plan.
