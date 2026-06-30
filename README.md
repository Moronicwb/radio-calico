# Radio Calico

An online radio station web app that plays a live SomaFM stream with real-time now-playing metadata and a per-track thumbs-up/down ratings system.

## Stack

- **Server:** Express.js (`server.js`)
- **Database:** PostgreSQL + Drizzle ORM
- **Frontend:** Plain HTML, CSS, and JavaScript (`public/`)
- **Stream:** SomaFM Underground 80s via HLS
- **Tests:** Vitest — Node environment for API, jsdom for frontend
- **Web server:** nginx (reverse proxy + static file serving in production)
- **Security:** helmet (HTTP security headers) + express-rate-limit (10 votes/min per IP)
- **Build:** esbuild — minifies JS and CSS into `dist/` for production
- **Container:** Docker multi-stage image (dev / build / prod / nginx-prod), orchestrated with Docker Compose

## Project structure

```
├── server.js                  # Express server, API routes, metadata polling
├── entrypoint.sh              # Runs migrations then starts the server
├── scripts/
│   ├── migrate.js             # Migration runner (used by Docker entrypoint)
│   └── build.js               # esbuild pipeline: minifies JS+CSS, copies assets to dist/
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
│   └── nginx.conf             # nginx: serves dist/ with gzip, caching, /api/ proxy
├── Dockerfile                 # Multi-stage: dev / build / prod (Express) / nginx-prod
├── docker-compose.yml         # Production: nginx + app + postgres, self-contained
├── docker-compose.dev.yml     # Dev overrides: source volume mount, hot reload
├── Makefile                   # Shortcuts: make prod / dev / build / test / security / down
├── vitest.config.ts           # Two-project Vitest config (node + jsdom)
└── drizzle.config.ts          # Drizzle Kit config
```

## Make targets

| Command | What it does |
|---|---|
| `make prod` | Build and start full stack (nginx + app + postgres) |
| `make dev` | Start with hot reload, no build step needed |
| `make build` | Minify JS + CSS into `dist/` via esbuild |
| `make test` | Run Vitest |
| `make test-coverage` | Run Vitest with coverage report |
| `make security` | Run `npm audit` (fails on high/critical only) |
| `make db-up` | Start only PostgreSQL |
| `make db-down` | Stop only PostgreSQL |
| `make db-migrate` | Apply pending migrations |
| `make db-studio` | Open Drizzle Studio |
| `make down` | Stop all containers |

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

In production, the Docker build minifies `public/app.js` and `public/styles.css` into `dist/` via esbuild, then bakes those files into the nginx image. nginx serves the minified assets with gzip compression and long-term cache headers, and proxies `/api/` to the Express backend. The Express server is not exposed on any host port.

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
make db-up           # start only the PostgreSQL container (local dev)
make db-down         # stop only the PostgreSQL container
make down            # stop all containers
npm run db:generate  # generate migrations from schema changes
make db-migrate      # apply pending migrations
make db-studio       # open Drizzle Studio
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

> **Note:** PostgreSQL must be running (`make db-up`) before running tests.

## Security

```bash
make security  # runs npm audit, fails on high/critical vulnerabilities only
```

HTTP security headers (CSP, HSTS, X-Frame-Options, and others) are set automatically by [helmet](https://helmetjs.github.io). The `/api/rate` endpoint is rate-limited to 10 requests per minute per IP.
