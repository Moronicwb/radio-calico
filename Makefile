.PHONY: prod dev test test-coverage db-up db-down db-migrate db-studio down

prod:
	docker compose up --build

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

test:
	npm test

test-coverage:
	npm run test:coverage

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

db-migrate:
	npm run db:migrate

db-studio:
	npm run db:studio

down:
	docker compose down
