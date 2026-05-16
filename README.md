# Club Finder

Club Finder is a Farcaster Snap for football fans. It lets someone search for a club, choose a matching team, and browse a compact list of primary Farcaster supporters from the live FC Footy fanclub API.

The Snap endpoint lives at `app/api/snap/[[...route]]/route.ts` and returns Farcaster Snap v2 JSON, not HTML.

## Stack

- Next.js App Router
- Hono
- `@farcaster/snap`
- `@farcaster/snap-hono`
- TypeScript

## Features

- `GET /api/snap` renders the home page with a club input and `Search Club` button.
- `POST /api/snap?action=search` reads `inputs.club`, resolves against the FC Footy clubs catalog, and shows matching club buttons.
- `POST /api/snap?action=club&club=<teamId>` shows primary supporters for the selected FC Footy `teamId`.
- Uses button `submit` targets for server round-trips.
- Uses Farcaster client actions for:
  - `view_profile`
  - `compose_cast`
- Includes pagination for supporter lists.
- Includes `Back`, `Share`, and playful `Banter` actions.
- Uses `https://fc-footy.vercel.app/api/fanclubs/clubs` as the source of truth for club resolution.
- Uses `https://fc-footy.vercel.app/api/fanclubs/supporters?teamId=<teamId>&primaryOnly=true` for club supporters.

## Project Structure

```text
app/
  api/snap/[[...route]]/route.ts
  globals.css
  layout.tsx
  page.tsx
src/
  lib/club-finder.ts
  lib/fc-footy.ts
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
  - Search for `Arsenal`, `Chelsea`, `Liverpool`, or `Man Utd`
  - Tap club buttons to open the primary supporter list
  - For clubs with large followings, verify pagination works

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

## Data Source

The Snap uses the FC Footy fanclub API directly at request time.

- Clubs: `GET https://fc-footy.vercel.app/api/fanclubs/clubs`
- Supporters: `GET https://fc-footy.vercel.app/api/fanclubs/supporters?teamId=<teamId>&primaryOnly=true`

Resolution behavior:

- Natural-language club input is normalized before matching
- Club `name` is preferred first
- `abbreviation` is also considered
- `leagueName` and `leagueId` help break ties when names are ambiguous
- The resolved `teamId` is the canonical identifier used for supporter lookups

## Notes

- `SNAP_PUBLIC_BASE_URL` is used for production button targets.
- The FC Footy API is the source of truth for both clubs and supporters.
- Localhost is allowed during development.
- `SKIP_JFS_VERIFICATION=1` should only be used locally.
- The website root page is only a small host landing page; the Snap itself is served from `/api/snap`.
# footy-club-snap
