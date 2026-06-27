# Radio Calico

An online radio station web app that plays a live SomaFM stream with real-time now-playing metadata and a per-track thumbs-up/down ratings system.

## Stack

- **Server:** Express.js (`server.js`)
- **Database:** PostgreSQL + Drizzle ORM
- **Frontend:** Plain HTML, CSS, and JavaScript (`public/`)
- **Stream:** SomaFM Underground 80s via HLS
- **Tests:** Vitest — Node environment for API, jsdom for frontend
- **Container:** Docker multi-stage image (dev + prod), orchestrated with Docker Compose

## Project structure

```
├── server.js                  # Express server, API routes, metadata polling
├── entrypoint.sh              # Runs migrations then starts the server
├── scripts/
│   └── migrate.js             # Migration runner (used by Docker entrypoint)
├── public/
│   ├── index.html             # Markup
│   ├── styles.css             # All CSS (brand tokens, themes, layout)
│   └── app.js                 # All client-side JS (stream, ratings, metadata)
├── src/
│   └── db/
│       └── schema.ts          # Drizzle schema (users, ratings tables)
├── drizzle/                   # Generated SQL migrations
├── tests/
│   ├── api/
│   │   └── ratings.test.ts    # Backend route tests (real PostgreSQL)
│   ├── frontend/
│   │   └── ratings.test.ts    # Frontend DOM tests (jsdom)
│   └── setup/
│       ├── db-global.ts       # Creates radiocalico_test DB and runs migrations
│       └── db-each.ts         # Truncates ratings table before each test
├── Dockerfile                 # Multi-stage build: dev and prod targets
├── docker-compose.yml         # Production: app + postgres, fully self-contained
├── docker-compose.dev.yml     # Dev overrides: source volume mount, hot reload
├── vitest.config.ts           # Two-project Vitest config (node + jsdom)
└── drizzle.config.ts          # Drizzle Kit config
```

## Running with Docker (recommended)

No local Node.js or PostgreSQL required — Docker handles everything.

**Production:**
```bash
npm run docker:prod
# or directly:
docker compose up --build
```

**Development** (source files are mounted; saving `server.js` restarts the server automatically):
```bash
npm run docker:dev
# or directly:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Open [http://localhost:3001](http://localhost:3001).

Migrations run automatically on startup via `entrypoint.sh`.

## Running locally (without Docker app)

Requires Node.js 18+ and Docker (for PostgreSQL only).

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
npm run db:up

# 3. Set environment variables
cp .env.example .env.local   # then set DATABASE_URL

# 4. Run migrations
npm run db:migrate

# 5. Start the server
npm start
```

## Environment variables

| Variable | Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://radiocalico:localdev@localhost:5432/radiocalico` | PostgreSQL connection string |

In Docker, this is set automatically in `docker-compose.yml`. For local dev, set it in `.env.local`.

## API routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/now-playing` | Current track metadata |
| GET | `/api/previous-tracks` | Last 10 tracks |
| GET | `/api/ratings?trackId=` | Up/down counts + caller's vote |
| POST | `/api/rate` | `{ trackId, rating: "up" \| "down" }` |

User identity is derived server-side from IP + User-Agent — no login required.

## Database commands

```bash
npm run db:up        # start only the PostgreSQL container (local dev)
npm run db:down      # stop PostgreSQL container
npm run db:generate  # generate migrations from schema changes
npm run db:migrate   # apply pending migrations
npm run db:studio    # open Drizzle Studio
```

## Testing

Tests use [Vitest](https://vitest.dev) with two environments:

| Suite | Environment | What it tests |
|---|---|---|
| `tests/api/` | Node + real PostgreSQL (`radiocalico_test`) | API route behaviour, upsert logic, validation |
| `tests/frontend/` | jsdom | DOM updates, rating state, fetch calls |

The test database (`radiocalico_test`) is created and migrated automatically on first run.

```bash
npm test                # run all tests once
npm test -- --watch     # watch mode
npm run test:coverage   # with coverage report
```

> **Note:** PostgreSQL must be running (`npm run db:up`) before running tests.
