# Club Finder

Club Finder is a Farcaster Snap that ranks the loudest football casters in the `/football` channel instead of showing a static supporter list.

The product has two parts:

1. A small ranking indexer that fetches recent `/football` casts from Snapchain, matches club aliases, computes scores, and stores a cached snapshot.
2. A feed-friendly Snap UI that reads the cached snapshot and shows the top casters for a searched club.

The Snap endpoint lives at `app/api/snap/[[...route]]/route.ts` and returns Farcaster Snap v2 JSON.

## Stack

- Next.js App Router
- Hono
- `@farcaster/snap`
- `@farcaster/snap-hono`
- Snapchain HTTP API
- Upstash Redis or a local `/tmp` snapshot fallback
- TypeScript

## Data Source

Snapchain node:

- `http://153.75.248.217:3381/v1/`

Football channel parent URL:

- `https://farcaster.xyz/~/channel/football`

Indexer fetch:

- `GET /v1/castsByParent?url=<encoded football channel url>&pageSize=100&reverse=true`

## Ranking Model

The indexer:

1. Fetches recent `/football` channel casts from Snapchain.
2. Reads each cast text.
3. Matches club aliases.
4. Counts mentions per FID per club.
5. Tracks unique days mentioned, last mention timestamp, and sample casts.
6. Stores a ranking snapshot.

Score formula:

```text
score = mentionCount * 3 + uniqueDaysMentioned * 2 + recentMentionBonus
```

Recent mention bonus:

- Mentioned within 1 day: `+5`
- Mentioned within 3 days: `+3`
- Mentioned within 7 days: `+1`

## Club Aliases

Supported clubs are defined in `src/data/clubs.ts`.

- Arsenal
- Chelsea
- Manchester United
- Liverpool
- Manchester City
- Tottenham
- Barcelona
- Real Madrid

## Snap Flow

- `GET /api/snap` shows the home page with a club search input.
- `POST /api/snap?action=search` resolves natural-language club text against local aliases.
- `POST /api/snap?action=club&club=<slug>` shows the top 5 ranked `/football` casters for that club from the cached snapshot.
- `GET /api/index-football-rankings` or `POST /api/index-football-rankings` rebuilds and stores the snapshot.

## Storage

Preferred production store:

- Upstash Redis using:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

Fallback for local development:

- `/tmp/club-finder-football-rankings.json`

The Snap reads only the cached snapshot. It does not fetch and rank the whole channel on every user request.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Set `SNAP_PUBLIC_BASE_URL` to your production origin.

4. For local Snap testing only:

   ```bash
   SKIP_JFS_VERIFICATION=1 npm run dev
   ```

## Environment

```env
SNAP_PUBLIC_BASE_URL=https://your-snap-url.com
SKIP_JFS_VERIFICATION=0
CRON_SECRET=your-secret
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SNAPCHAIN_MAX_PAGES=10
SNAPCHAIN_PAGE_SIZE=100
```

## Indexer Testing

Run the indexer manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-snap-url.com/api/index-football-rankings
```

Expected result:

- A JSON response with `indexedMessages`, `generatedAt`, and ranked club summaries.

## Snap Testing

Use the Snap endpoint:

```text
https://your-snap-url.com/api/snap
```

Recommended checks:

- Search `Arsenal`, `Chelsea`, or `Man Utd`
- Open a club leaderboard page
- Confirm the top 5 casters render
- Use `View Profile`
- Use `Banter`
- Use `Share`

## Notes

- The ranking indexer is the product core; the Snap is the presentation layer.
- If Snapchain responses do not include usernames, the ranking still works with FIDs.
- The current parser is defensive because Snapchain message payloads can vary by deployment shape.
- Vercel Hobby cannot run sub-daily cron jobs, so scheduled indexing is handled by GitHub Actions instead.

## Scheduling

This repo uses GitHub Actions to refresh rankings every 15 minutes.

Workflow:

- `.github/workflows/index-football-rankings.yml`

Required GitHub repository secrets:

- `FOOTY_INDEXER_URL`
  Example: `https://footy-club-snap.vercel.app/api/index-football-rankings`
- `CRON_SECRET`
  Must match the `CRON_SECRET` environment variable configured in Vercel

You can also run the workflow manually from the GitHub Actions tab using `workflow_dispatch`.
