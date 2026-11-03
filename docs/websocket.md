# Live updates via WebSocket (evaluation, issue #38)

## Question

Should the server offer a WebSocket endpoint so that several people editing the same instance see each
other's changes without reloading?

## Result

Yes – implemented as a small, read-only notification channel next to the REST API:

- **Endpoint:** `ws(s)://<host>/api/v1/live`
- **Direction:** server → client only. All changes still go through the REST API, which keeps validation,
  permissions and the OpenAPI documentation in one place.
- **Content:** events contain only entity name, action and ids – never data. Clients reload what they show via
  REST, so every read still goes through the normal permission checks.
- **Source of events:** every repository is wrapped in an `ObservableRepository` that reports successful writes
  to a `ChangeBus`. New endpoints get live updates automatically.

## Protocol

```text
client → { "type": "auth", "token": "<JWT from /auth/login>" }   first message, within 5 seconds
server → { "type": "ready" }
server → { "type": "change", "entity": "persons", "action": "updated", "ids": ["…"] }
```

- `entity`: `persons`, `families`, `memberships`, `relationships`, `media`, `tags` (and `users` for admins)
- `action`: `created`, `updated`, `deleted`
- `ids`: changed ids, or `null` when more than 100 changed at once (e.g. a GEDCOM import)

The token is sent as the first message rather than in the URL, so it does not appear in proxy or access logs.
Invalid tokens and missing authentication close the socket with code `4001`; the connection is also closed
when the token expires. The server pings every 30 seconds and drops dead connections.

## Alternatives considered

| Option                   | Why not (for now)                                                           |
| ------------------------ | --------------------------------------------------------------------------- |
| Polling                  | Simple, but adds load and delay for every open browser tab                  |
| Server-Sent Events       | Would work too, but `EventSource` cannot send an `Authorization` header     |
| Full CRUD over WebSocket | Duplicates the REST API (validation, permissions, docs) with little benefit |

## Limits

- With several server instances behind a load balancer, set `LIVE_RELAY=mongo` on all of them. Each instance then
  writes its change events into the capped collection `live_events` and follows it with a tailable cursor, so
  clients connected to any instance get all changes. This works with a standalone MongoDB (no replica set or Redis
  needed). The collection is limited to 8 MB, old events are dropped automatically.
- Reverse proxies must forward WebSocket upgrades for `/api/v1/live` (see the nginx config of the web app).
