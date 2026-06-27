@AGENTS.md

# Radio Calico

Online radio station web app. Plays a live SomaFM stream and shows now-playing metadata with a thumbs-up/down rating system.

## Stack

- **Server:** Express.js (`server.js`) — the active server, NOT Next.js
- **Database:** PostgreSQL via Docker + Drizzle ORM for schema and migrations
- **Frontend:** Plain HTML/CSS/JS served as static files from `public/`
- **Stream:** `https://ice2.somafm.com/u80s-128-mp3` (SomaFM Underground 80s)
- **Metadata:** `https://d3d4yli4hf5bmh.cloudfront.net/metadata.json` — polled every 10s

## Key files

- `server.js` — Express server, all API routes, metadata polling loop
- `src/db/schema.ts` — Drizzle schema (`users`, `ratings` tables)
- `drizzle/` — generated migrations
- `public/index.html` — frontend markup only
- `public/styles.css` — all CSS (brand tokens, themes, layout)
- `public/app.js` — all client-side JS (stream, ratings, metadata polling)
- `docker-compose.yml` — PostgreSQL container

## Running the project

```bash
npm run db:up   # start PostgreSQL in Docker (required first)
npm start       # start Express server at http://localhost:3001
```

Other DB commands:
```bash
npm run db:generate  # generate migrations from schema changes
npm run db:migrate   # apply migrations
npm run db:studio    # open Drizzle Studio
npm run db:down      # stop PostgreSQL container
```

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/now-playing` | Current track (artist, title, album, quality) |
| GET | `/api/previous-tracks` | Last 10 tracks |
| GET | `/api/ratings?trackId=` | Up/down counts + caller's vote |
| POST | `/api/rate` | `{ trackId, rating: "up" \| "down" }` — upserts vote |

User identity is derived server-side from IP + User-Agent — no login required.

## Database

Ratings are persisted to PostgreSQL. Schema lives in `src/db/schema.ts`. The `users` table exists but is not yet used (ratings use an IP+UA derived `userId` string, not a FK).

## Notes

- Next.js is installed but not used as the active server — don't suggest migrating to it unless asked.
- Prefer staying in JavaScript/Node for new features.
- `.env.local` holds `DATABASE_URL`; scripts load it via `--env-file=.env.local`.
