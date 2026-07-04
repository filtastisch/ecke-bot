import "dotenv/config";
import { ApplicationCommandRegistries, RegisterBehavior } from "@sapphire/framework";
import { client } from "./lib/client";
import { config, isConfigured, validateConfig } from "./lib/config";

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
});

if (!process.env.TOKEN) {
    console.error("Kein TOKEN in .env gefunden.");
    process.exit(1);
}

client.login(process.env.TOKEN).catch((error) => {
    console.error("Login fehlgeschlagen:", error);
    process.exit(1);
});
