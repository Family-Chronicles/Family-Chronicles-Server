# Federation – linking several instances (first version)

The vision of Family Chronicles is to connect the family trees of several instances into one big whole.
This first version lets an instance **read** from other instances and **link** its persons to persons there.
Nothing is copied or changed on the other side.

## Set up a connection (instance A reads from instance B)

1. **On B** (admin): create a user for A with the role **Viewer**, e.g. "Instanz Familie A".
2. **On B** (admin): create an API token for this user – `POST /api/v1/tokens` or in the web app under
   _Föderation → API-Tokens_. The token (`fc_…`) is shown only once.
3. **On A** (admin): add B as connected instance – `POST /api/v1/federation/peers` with name, URL of B
   (e.g. `https://chronik-b.example.org`) and the token. A checks URL and token before saving.

A can now search persons of B and link them. B decides what A sees by the role of the token's user,
and can revoke the token at any time.

## Linking persons

Editors of A link a local person with a person of B (`POST /api/v1/federation/links`):

- `SamePerson` – both entries describe the same person
- `Relative` – the persons are related (details in the notes)

Everyone on A who can read the person sees the link and can open the person of B (basic data:
names, gender, birth and death). The name is cached, so links stay readable while B is offline.
Deleting a local person or the connection removes its links.

## API

| Route                                           | Role   | Description                          |
| ----------------------------------------------- | ------ | ------------------------------------ |
| `GET/POST /tokens`, `DELETE /tokens/{id}`       | Admin  | API tokens of this instance          |
| `GET /federation/peers`                         | Viewer | Connected instances (without tokens) |
| `POST /federation/peers`, `DELETE …/{id}`       | Admin  | Connect / disconnect an instance     |
| `POST /federation/peers/{id}/check`             | Admin  | Check the connection again           |
| `GET /federation/peers/{id}/persons?q=`         | Editor | Search persons of the other instance |
| `GET /federation/peers/{id}/persons/{remoteId}` | Viewer | One person of the other instance     |
| `GET /federation/links?personId=`               | Viewer | Links of a local person              |
| `POST /federation/links`, `DELETE …/{id}`       | Editor | Create / remove a link               |

## Security

- API tokens are stored as SHA-256 hash; the plain token is only returned when it is created.
- Tokens of other instances are stored encrypted (AES-256-GCM, key derived from `JWT_SECRET`) and are never
  returned by the API. Changing `JWT_SECRET` makes stored peer tokens unreadable – connect the peers again.
- Only admins can add connections (and therefore choose which hosts this server contacts). Requests to other
  instances are GET only, use a 10 s timeout and a 2 MB size limit, and do not follow redirects.
- Responses of other instances are reduced to a fixed set of fields before they are passed on.

## Not yet included

- Writing to other instances, or copying persons between instances
- Showing the family tree across instances (following links automatically)
- Mutual discovery of instances; connections are set up manually on both sides
