# --- Build-Stage: Dependencies installieren & TypeScript kompilieren ---
FROM node:22-bookworm AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Sicherstellen, dass die yt-dlp-Binary heruntergeladen ist (fuer den Musik-Bot)
RUN node node_modules/youtube-dl-exec/scripts/postinstall.js

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# devDependencies entfernen, damit das Runtime-Image schlank bleibt
RUN npm prune --omit=dev

# --- Runtime-Stage: schlankes Image mit kompiliertem Code ---
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

# python3 wird von der yt-dlp-Binary zur Laufzeit benoetigt.
# ffmpeg wird ueber das npm-Paket ffmpeg-static bereitgestellt.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY config.json ./config.json
COPY config.example.json ./config.example.json

# data/ fuer Laufzeitdaten (data.json, warns.json) anlegen und Rechte setzen
RUN mkdir -p /app/data && chown -R node:node /app

USER node

CMD ["node", "dist/index.js"]
