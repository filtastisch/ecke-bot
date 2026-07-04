#!/bin/sh
set -e

# Ziel der Live-Config und des Datenverzeichnisses (per Env ueberschreibbar)
CONFIG_PATH="${CONFIG_PATH:-/app/config.json}"
DATA_DIR="${DATA_DIR:-/app/data}"

mkdir -p "$DATA_DIR"
mkdir -p "$(dirname "$CONFIG_PATH")"

# config.json ins (persistente) Ziel seeden, falls dort noch keine liegt.
# So kann der Container ohne gemountete Host-Datei starten (Portainer-freundlich).
if [ ! -f "$CONFIG_PATH" ]; then
    if [ -f /app/config.json ] && [ "$CONFIG_PATH" != "/app/config.json" ]; then
        echo "[entrypoint] Seede config.json nach $CONFIG_PATH"
        cp /app/config.json "$CONFIG_PATH"
    elif [ -f /app/config.example.json ]; then
        echo "[entrypoint] Keine config.json vorhanden - seede Vorlage nach $CONFIG_PATH"
        cp /app/config.example.json "$CONFIG_PATH"
    fi
fi

exec "$@"
