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
docker compose restart         # nach Aenderungen an config.json neu starten
docker compose down            # stoppen
```

- Der Bot-Token wird ueber `.env` (`env_file`) eingelesen.
- `config.json` wird read-only ins Image gemountet - Aenderungen greifen nach `docker compose restart`, ohne neu zu bauen.
- Laufzeitdaten (`data.json`, `data/warns.json`) liegen im gemounteten `./data`-Verzeichnis und bleiben ueber Neustarts erhalten.
- `ffmpeg` (via `ffmpeg-static`) und die `yt-dlp`-Binary werden im Image-Build bereitgestellt; `python3` ist im Runtime-Image enthalten, da die yt-dlp-Binary es benoetigt.

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
