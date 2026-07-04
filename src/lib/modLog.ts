import { Colors, EmbedBuilder, type Guild, type User } from "discord.js";
import { config } from "./config";
import { sendLog } from "./logger";

interface ModLogOptions {
    action: string;
    target: User;
    moderator: User;
    reason?: string | null;
    extra?: { name: string; value: string }[];
    color?: number;
}

export async function logModAction(guild: Guild, options: ModLogOptions): Promise<void> {
    if (!config.features.modLog) return;

    const embed = new EmbedBuilder()
        .setColor(options.color ?? Colors.Red)
        .setAuthor({ name: options.target.tag, iconURL: options.target.displayAvatarURL() })
        .setTitle(options.action)
        .addFields(
            { name: "Nutzer", value: `${options.target} (\`${options.target.id}\`)`, inline: true },
            { name: "Moderator", value: `${options.moderator}`, inline: true },
            { name: "Grund", value: options.reason?.trim() || "Kein Grund angegeben" }
        )
        .setTimestamp();

    if (options.extra) embed.addFields(options.extra);

    await sendLog(guild, config.channels.modLog, embed);
}
