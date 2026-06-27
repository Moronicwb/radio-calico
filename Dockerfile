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

# ── Production ────────────────────────────────────────────────────────────────
FROM base AS prod
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
ENTRYPOINT ["sh", "entrypoint.sh"]
CMD ["node", "server.js"]
