# Club Finder

Club Finder is a Farcaster Snap for football fans. It lets someone search for a club, choose a matching team, and browse a compact list of known supporters from a local Footy dataset.

The Snap endpoint lives at `app/api/snap/[[...route]]/route.ts` and returns Farcaster Snap v2 JSON, not HTML.

## Stack

- Next.js App Router
- Hono
- `@farcaster/snap`
- `@farcaster/snap-hono`
- TypeScript

## Features

- `GET /api/snap` renders the home page with a club input and `Search Club` button.
- `POST /api/snap?action=search` reads `inputs.club` and shows matching club buttons from a local list.
- `POST /api/snap?action=club&club=arsenal` shows club supporters with compact actions.
- Uses button `submit` targets for server round-trips.
- Uses Farcaster client actions for:
  - `view_profile`
  - `compose_cast`
- Includes pagination for supporter lists.
- Includes `Back`, `Share`, and playful `Banter` actions.

## Project Structure

```text
app/
  api/snap/[[...route]]/route.ts
  globals.css
  layout.tsx
  page.tsx
src/
  data/supporters.ts
  lib/club-finder.ts
  lib/snap-ui.ts
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Update `SNAP_PUBLIC_BASE_URL`:
   - Local dev: leave it unset if you are using `localhost`.
   - Deployments: set it to your production origin with no trailing slash.

4. For local-only testing, enable signature bypass:

   ```bash
   SKIP_JFS_VERIFICATION=1 npm run dev
   ```

## Local Testing

- Start the app:

  ```bash
  SKIP_JFS_VERIFICATION=1 npm run dev
  ```

- Snap URL in local dev:

  ```text
  http://localhost:3000/api/snap
  ```

- Recommended test flow:
  - Open the Farcaster emulator and paste `http://localhost:3000/api/snap`
  - Search for `Arsenal`, `Barca`, `Chelsea`, or `Man Utd`
  - Tap club buttons to open the supporter list

## Deploy

Deploy to any Node-compatible HTTPS host. Vercel is the straightforward choice for this Next.js + Hono setup.

Set:

```env
SNAP_PUBLIC_BASE_URL=https://your-snap-url.com
SKIP_JFS_VERIFICATION=0
```

After deploy, verify the Snap response:

```bash
curl -sS -H 'Accept: application/vnd.farcaster.snap+json' \
  https://your-snap-url.com/api/snap
```

You should receive valid Snap JSON with content type `application/vnd.farcaster.snap+json`.

## Updating Supporter Data

Edit `src/data/supporters.ts`.

- Add or remove clubs in `clubs`
- Update the local `supporters` array
- Keep `clubSlug` aligned with the corresponding club entry

Example:

```ts
{ fid: 123, username: "gabedev.eth", displayName: "Gabriel", club: "Arsenal", clubSlug: "arsenal" }
```

## Notes

- `SNAP_PUBLIC_BASE_URL` is used for production button targets.
- Localhost is allowed during development.
- `SKIP_JFS_VERIFICATION=1` should only be used locally.
- The website root page is only a small host landing page; the Snap itself is served from `/api/snap`.
