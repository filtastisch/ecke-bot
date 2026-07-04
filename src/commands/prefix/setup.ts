import { Command } from "@sapphire/framework";
import { ChannelType, type Message, type TextChannel } from "discord.js";
import { config, isConfigured } from "../../lib/config";
import { isAdmin } from "../../lib/permissions";
import { setupReactionRolePanel } from "../../lib/reactionRoles";
import { resolveTextChannel } from "../../lib/logger";
import { setupMusicPanel } from "../../lib/music/panel";

const VALID_TARGETS = ["games", "colors", "music", "all"] as const;
type SetupTarget = (typeof VALID_TARGETS)[number];

export class SetupCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: "setup", description: "Postet die Setup-Nachrichten (Reaction-Roles, Musik-Panel)." });
    }

    public override async messageRun(message: Message): Promise<unknown> {
        if (!message.inGuild()) return;
        if (!message.member || !isAdmin(message.member)) {
            return message.reply("Du hast keine Berechtigung fuer diesen Befehl.");
        }

        const target = (message.content.trim().split(/\s+/)[1] ?? "all").toLowerCase() as SetupTarget;
        if (!VALID_TARGETS.includes(target)) {
            return message.reply(`Unbekanntes Ziel. Nutze: ${VALID_TARGETS.map((t) => `\`${t}\``).join(", ")}`);
        }

        const done: string[] = [];

        if (target === "games" || target === "all") {
            await setupReactionRolePanel("games", message.channel as TextChannel);
            done.push("Spiel-Rollen");
        }

        if (target === "colors" || target === "all") {
            await setupReactionRolePanel("colors", message.channel as TextChannel);
            done.push("Farb-Rollen");
        }

        if (target === "music" || target === "all") {
            const musicChannel = isConfigured(config.channels.music)
                ? await resolveTextChannel(message.guild, config.channels.music)
                : (message.channel.type === ChannelType.GuildText ? (message.channel as TextChannel) : null);
            if (musicChannel) {
                await setupMusicPanel(musicChannel);
                done.push("Musik-Panel");
            } else {
                done.push("Musik-Panel (uebersprungen: channels.music nicht gesetzt)");
            }
        }

        return message.reply(`Setup abgeschlossen: ${done.join(", ")}.`);
    }
}
