import { container } from "@sapphire/framework";
import { EmbedBuilder, type TextChannel } from "discord.js";
import { config, getData, isConfigured, setReactionRoleReference, type ReactionRolePanel } from "./config";
import { emojiForDisplay, emojiForReact } from "./emoji";

export type ReactionRolePanelKey = "games" | "colors";

export function buildReactionRoleEmbed(panel: ReactionRolePanel): EmbedBuilder {
    const lines = panel.options
        .filter((option) => isConfigured(option.roleId))
        .map((option) => `${emojiForDisplay(option.emoji)}  ${option.label}`);

    return new EmbedBuilder()
        .setTitle(panel.title)
        .setDescription(`${panel.description}\n\n${lines.join("\n")}`)
        .setColor(panel.color ?? 0x5865f2);
}

export async function setupReactionRolePanel(key: ReactionRolePanelKey, channel: TextChannel): Promise<void> {
    const panel = config.reactionRoles[key];
    const embed = buildReactionRoleEmbed(panel);
    const message = await channel.send({ embeds: [embed] });

    for (const option of panel.options) {
        if (!isConfigured(option.roleId)) continue;
        await message.react(emojiForReact(option.emoji)).catch((error) =>
            container.logger.error(`Reaction ${option.emoji} konnte nicht hinzugefuegt werden (Emoji korrekt als <:name:id>?):`, error)
        );
    }

    setReactionRoleReference(key, { channelId: channel.id, messageId: message.id });
}

export function findReactionRolePanelByMessage(messageId: string): ReactionRolePanelKey | null {
    const data = getData();
    if (data.reactionRoles.games?.messageId === messageId) return "games";
    if (data.reactionRoles.colors?.messageId === messageId) return "colors";
    return null;
}
