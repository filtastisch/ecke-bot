import { container } from "@sapphire/framework";
import { ChannelType, EmbedBuilder, type Guild, type TextChannel } from "discord.js";
import { isConfigured } from "./config";

export async function resolveTextChannel(guild: Guild, channelId: string): Promise<TextChannel | null> {
    if (!isConfigured(channelId)) return null;
    const channel = guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId).catch(() => null));
    if (channel && channel.type === ChannelType.GuildText) {
        return channel as TextChannel;
    }
    return null;
}

export async function sendLog(guild: Guild, channelId: string, embed: EmbedBuilder): Promise<void> {
    const channel = await resolveTextChannel(guild, channelId);
    if (!channel) return;
    await channel.send({ embeds: [embed] }).catch((error) => container.logger.error("Konnte Log nicht senden:", error));
}
