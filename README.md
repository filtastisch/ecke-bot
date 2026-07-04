# Ecke Bot

Ein Discord-Bot fuer Moderation, Utility und Musik, gebaut mit [Sapphire](https://www.sapphirejs.dev/) und discord.js v14. Die gesamte Konfiguration laeuft ueber `config.json`.

## Vorbereitung (fuer beide Varianten)

1. `.env` mit dem Bot-Token anlegen:

```
TOKEN=dein_bot_token
```

2. `config.example.json` nach `config.json` kopieren und die Platzhalter (`DEINE_GUILD_ID`, `CHANNEL_ID`, `ROLE_ID`) mit echten IDs fuellen. IDs bekommst du, wenn im Discord der Entwicklermodus aktiviert ist (Rechtsklick auf Server/Kanal/Rolle -> "ID kopieren").

## Start mit Docker (empfohlen)

Voraussetzung: Docker und Docker Compose sind installiert.

```bash
docker compose up -d --build   # bauen und im Hintergrund starten
docker compose logs -f         # Logs ansehen
docker compose restart         # neu starten
docker compose down            # stoppen
```

- Der Bot-Token wird als Umgebungsvariable `TOKEN` erwartet. Lokal wird dafuer automatisch die `.env` gelesen (`docker compose` substituiert `${TOKEN}`).
- Laufzeitdaten **und** die Live-`config.json` liegen im benannten Volume `ecke-bot-data` (Mountpunkt `/app/data`) und bleiben ueber Neustarts/Updates erhalten.
- Beim ersten Start wird die `config.json` automatisch ins Volume geseedet (aus der mitgebauten `config.json`, sonst aus `config.example.json`). Danach ist die Datei im Volume die "Quelle der Wahrheit".
- `config.json` aendern: entweder die Datei im Volume bearbeiten (`docker compose exec ecke-bot sh` bzw. Portainer-Volume-Browser) und `docker compose restart`, oder das Volume loeschen, um neu zu seeden.
- `ffmpeg` (via `ffmpeg-static`) und die `yt-dlp`-Binary werden im Image-Build bereitgestellt; `python3` ist im Runtime-Image enthalten, da die yt-dlp-Binary es benoetigt.
- Der Container hat einen Healthcheck: der Bot schreibt bei aktiver Discord-Verbindung alle 30s einen Heartbeat; bleibt er >120s aus, wird der Container als `unhealthy` markiert.

## Deployment mit Portainer

Der Stack ist so gebaut, dass er ohne Host-Dateien auskommt (keine Bind-Mounts, Token per Umgebungsvariable, `config.json` selbst-seedend im Volume).

**Variante A - Repository-Stack (empfohlen):**

1. In Portainer: **Stacks -> Add stack -> Repository**.
2. Repository-URL und Branch dieses Projekts angeben, Compose-Pfad `docker-compose.yml`.
3. Unter **Environment variables** `TOKEN` (Pflicht) und optional `TZ` setzen.
4. **Deploy the stack**. Portainer baut das Image direkt aus dem Repo.

**Variante B - Web-Editor mit fertigem Image:**

1. Image vorab bauen und in eine Registry pushen, z.B.:

```bash
docker build -t <registry>/ecke-bot:latest .
docker push <registry>/ecke-bot:latest
```

2. In Portainer einen Stack per **Web editor** anlegen, den Inhalt der `docker-compose.yml` einfuegen, `build: .` entfernen und `image:` auf dein Registry-Image setzen.
3. `TOKEN` (und optional `TZ`) unter **Environment variables** setzen und deployen.

**config.json in Portainer bearbeiten:** Unter **Volumes -> `..._ecke-bot-data` -> Browse** die `config.json` oeffnen/hochladen, danach den Container neu starten. Alternativ per **Containers -> ecke-bot -> Console** (`/bin/sh`) direkt im Volume editieren.

## Start ohne Docker (lokal)

```bash
npm install
npm run dev     # Entwicklung mit Auto-Reload
npm run build   # nach dist/ kompilieren
npm start       # kompilierte Version starten
```

## Discord-Voraussetzungen

Im [Developer Portal](https://discord.com/developers/applications) unter "Bot":

- **Server Members Intent** aktivieren (Join-Rolle, Member-Log)
- **Message Content Intent** aktivieren (Prefix-Befehle, Auto-Ban-Kanal)

Beim Einladen benoetigte Rechte: Rollen verwalten, Kanaele verwalten, Mitglieder kicken/bannen, Mitglieder moderieren, Nachrichten senden/verwalten, Reaktionen hinzufuegen, Verbinden und Sprechen (Voice).

## Konfiguration (`config.json`)

| Bereich | Bedeutung |
|---------|-----------|
| `channels` | Alle vom Bot genutzten Kanaele (Welcome, Logs, Musik, Auto-Ban) |
| `roles` | Besucher-Rolle sowie Moderator- und Admin-Rollen |
| `reactionRoles.games` / `.colors` | Titel, Beschreibung und Emoji-zu-Rolle-Zuordnung der Reaction-Panels |
| `music` | Standard-Lautstaerke und maximale Queue-Groesse |
| `moderation` | Max. Verwarnungen, Auto-Ban-Schalter |
| `features` | Ein-/Ausschalter fuer Join-Rolle, Welcome, Logs |
| `messages` | Platzhalter `{user}`, `{server}`, `{memberCount}` |

`data/data.json` wird vom Bot selbst geschrieben (IDs der Setup-Nachrichten) und sollte nicht von Hand bearbeitet werden. Verwarnungen liegen in `data/warns.json`.

### Emojis fuer Reaction-Roles

Bei `reactionRoles` sind sowohl Unicode-Emojis (z.B. `🎮`) als auch eigene Server-Emojis erlaubt.

Eigene Emojis muessen im vollen Format `<:name:id>` (bzw. `<a:name:id>` fuer animierte) angegeben werden - die reine `:name:`-Kurzform funktioniert **nicht**. Die passenden IDs bekommst du so:

- Fuehre den Admin-Befehl **`!emojis`** aus. Der Bot listet alle Server-Emojis inklusive des fertigen `<:name:id>`-Strings zum Kopieren.
- Alternativ im Discord-Chat `\:emojiname:` (mit Backslash) senden - Discord zeigt dann die Rohform an.

Trage den kompletten String (z.B. `<:valorant:123456789012345678>`) in das `emoji`-Feld der jeweiligen Option ein.

## Befehle

### Prefix

- `!setup games | colors | music | all` (nur Admins) postet die Setup-Nachrichten. Reaction-Panels werden im aktuellen Kanal gepostet, das Musik-Panel in `channels.music`.
- `!emojis` (nur Admins) listet alle Server-Emojis im `<:name:id>`-Format fuer die config.json.

### Slash

- Moderation: `/ban`, `/unban`, `/kick`, `/timeout`, `/untimeout`, `/warn`, `/warnings`, `/clearwarnings`, `/purge`, `/slowmode`, `/lock`, `/unlock`, `/nick`
- Utility: `/serverinfo`, `/userinfo`, `/avatar`, `/poll`, `/ping`, `/say`, `/embed`
- Musik: `/play <query>`, `/stop`

## Musik-Panel

`!setup music` postet ein dauerhaftes Embed mit Steuer-Buttons:

- **Zur Queue hinzufuegen** oeffnet ein Modal fuer URL, Playlist oder Suchbegriff.
- Steuerung: einen Song zurueck, Play/Pause, ein Song weiter, Shuffle an/aus.

Laeuft nichts, startet die Wiedergabe sofort; sonst landet der Song in der Queue. Playlists werden komplett in die Queue geladen. Das Embed zeigt aktuellen Song (Titel, Interpret, Laenge), Queue-Laenge und Shuffle-Status und aktualisiert sich automatisch.
