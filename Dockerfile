# ── Base ──────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

# ── Development ───────────────────────────────────────────────────────────────
FROM base AS dev
RUN npm install
COPY . .
ENV NODE_ENV=development
ENTRYPOINT ["sh", "entrypoint.sh"]
CMD ["node", "--watch", "server.js"]

# ── Build (minify frontend assets) ───────────────────────────────────────────
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# ── Production (Express API) ──────────────────────────────────────────────────
FROM base AS prod
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
ENTRYPOINT ["sh", "entrypoint.sh"]
CMD ["node", "server.js"]

# ── nginx (serves minified static assets) ─────────────────────────────────────
FROM nginx:alpine AS nginx-prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
