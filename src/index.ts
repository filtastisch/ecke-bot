import "dotenv/config";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ApplicationCommandRegistries, RegisterBehavior } from "@sapphire/framework";
import { client } from "./lib/client";
import { config, isConfigured, validateConfig } from "./lib/config";

const HEARTBEAT_FILE = process.env.HEALTHCHECK_FILE || join(tmpdir(), "ecke-bot-healthy");

function writeHeartbeat(): void {
    if (!client.isReady()) return;
    try {
        writeFileSync(HEARTBEAT_FILE, String(Date.now()), "utf-8");
    } catch {
        // Heartbeat ist nur fuer den Healthcheck; Fehler duerfen den Bot nicht stoppen.
    }
}

const warnings = validateConfig();
if (warnings.length > 0) {
    console.warn("[config] Warnungen:");
    for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (isConfigured(config.guildId)) {
    ApplicationCommandRegistries.setDefaultGuildIds([config.guildId]);
    ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);
}

client.once("clientReady", () => {
    console.log("Eingeloggt als", client.user?.tag);
    console.log(`${client.stores.get("commands").size} Commands, ${client.stores.get("listeners").size} Listener geladen.`);
    writeHeartbeat();
    setInterval(writeHeartbeat, 30_000).unref();
});

if (!process.env.TOKEN) {
    console.error("Kein TOKEN in .env gefunden.");
    process.exit(1);
}

client.login(process.env.TOKEN).catch((error) => {
    console.error("Login fehlgeschlagen:", error);
    process.exit(1);
});
