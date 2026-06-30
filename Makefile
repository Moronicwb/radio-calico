.PHONY: prod dev test test-coverage security db-up db-down db-migrate db-studio down

prod:
	docker compose up --build

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

test:
	npm test

test-coverage:
	npm run test:coverage

# Fails on high/critical only — existing moderate issues in drizzle-kit and next
# are unfixable without breaking version downgrades (not runtime risks).
security:
	npm audit --audit-level=high

db-up:
	docker compose up -d postgres

db-down:
	docker compose stop postgres

db-migrate:
	npm run db:migrate

db-studio:
	npm run db:studio

down:
	docker compose down
