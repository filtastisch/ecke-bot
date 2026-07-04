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
# config.example.json ist immer dabei, config.json optional als Seed.
# Fehlt config.json, greift im Entrypoint automatisch die config.example.json.
COPY config*.json ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Live-Config und Laufzeitdaten liegen im persistenten Volume unter /app/data
ENV CONFIG_PATH=/app/data/config.json
ENV DATA_DIR=/app/data

# data/ fuer Laufzeitdaten (config.json, data.json, warns.json) anlegen und Rechte setzen
RUN mkdir -p /app/data && chown -R node:node /app

USER node

# Healthcheck: der Bot schreibt bei aktiver Discord-Verbindung regelmaessig eine
# Heartbeat-Datei. Ist sie aelter als 120s, gilt der Container als ungesund.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD node -e "const fs=require('fs');const f=process.env.HEALTHCHECK_FILE||require('os').tmpdir()+'/ecke-bot-healthy';try{process.exit(Date.now()-fs.statSync(f).mtimeMs<120000?0:1)}catch(e){process.exit(1)}"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
