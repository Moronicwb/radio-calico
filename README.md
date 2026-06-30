# Radio Calico

An online radio station web app that plays a live SomaFM stream with real-time now-playing metadata and a per-track thumbs-up/down ratings system.

## Stack

- **Server:** Express.js (`server.js`)
- **Database:** PostgreSQL + Drizzle ORM
- **Frontend:** Plain HTML, CSS, and JavaScript (`public/`)
- **Stream:** SomaFM Underground 80s via HLS
- **Tests:** Vitest — Node environment for API, jsdom for frontend
- **Web server:** nginx (reverse proxy + static file serving in production)
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
├── nginx/
│   └── nginx.conf             # nginx: serves public/ and proxies /api/ to Express
├── Dockerfile                 # Multi-stage build: dev and prod targets
├── docker-compose.yml         # Production: nginx + app + postgres, self-contained
├── docker-compose.dev.yml     # Dev overrides: source volume mount, hot reload
├── Makefile                   # Shortcuts: make prod / dev / test / down
├── vitest.config.ts           # Two-project Vitest config (node + jsdom)
└── drizzle.config.ts          # Drizzle Kit config
```

## Running with Docker (recommended)

No local Node.js or PostgreSQL required — Docker handles everything.

**Production** (nginx on port 80 + Express + PostgreSQL):
```bash
make prod
```

**Development** (source files are mounted; saving `server.js` restarts the server automatically):
```bash
make dev
```

Open [http://localhost](http://localhost).

In production, nginx serves static files from `public/` directly and proxies `/api/` requests to the Express backend. The Express server is not exposed on any host port.

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
make db-up       # start only the PostgreSQL container (local dev)
make db-down     # stop PostgreSQL container
make down        # stop all containers
npm run db:generate  # generate migrations from schema changes
make db-migrate  # apply pending migrations
make db-studio   # open Drizzle Studio
```

## Testing

Tests use [Vitest](https://vitest.dev) with two environments:

| Suite | Environment | What it tests |
|---|---|---|
| `tests/api/` | Node + real PostgreSQL (`radiocalico_test`) | API route behaviour, upsert logic, validation |
| `tests/frontend/` | jsdom | DOM updates, rating state, fetch calls |

The test database (`radiocalico_test`) is created and migrated automatically on first run.

```bash
make test           # run all tests once
make test-coverage  # with coverage report
npm test -- --watch # watch mode
```

> **Note:** PostgreSQL must be running (`npm run db:up`) before running tests.
