import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    type Guild,
    type TextChannel
} from "discord.js";
import { getData, setMusicReference } from "../config";
import { getPlayer, type GuildPlayer } from "./player";
import { formatSeconds } from "./resolver";

export const MUSIC_BUTTON_ADD = "music:add";
export const MUSIC_BUTTON_PREVIOUS = "music:previous";
export const MUSIC_BUTTON_PLAYPAUSE = "music:playpause";
export const MUSIC_BUTTON_SKIP = "music:skip";
export const MUSIC_BUTTON_SHUFFLE = "music:shuffle";
export const MUSIC_MODAL_ID = "music:modal";
export const MUSIC_MODAL_INPUT = "music:query";

export function buildPanelEmbed(player: GuildPlayer | undefined): EmbedBuilder {
    const embed = new EmbedBuilder().setColor(0x1db954).setTitle("🎵 Musik-Player");

    if (!player || !player.current) {
        embed.setDescription("Aktuell wird nichts abgespielt.\nKlicke auf **Zur Queue hinzufuegen**, um Musik zu starten.");
        return embed;
    }

    const current = player.current;
    embed.addFields(
        { name: "Aktueller Song", value: `[${current.title}](${current.url})` },
        { name: "Interpret", value: current.author, inline: true },
        { name: "Laenge", value: formatSeconds(current.durationSec), inline: true },
        { name: "Angefragt von", value: `<@${current.requestedBy}>`, inline: true }
    );

    const upcoming = player.queue.tracks;
    const queuePreview = upcoming
        .slice(0, 5)
        .map((track, index) => `**${index + 1}.** ${track.title} \`${formatSeconds(track.durationSec)}\``)
        .join("\n");

    embed.addFields(
        {
            name: `In der Queue (${upcoming.length})`,
            value: queuePreview || "Keine weiteren Songs.",
            inline: false
        },
        { name: "Status", value: player.paused ? "⏸️ Pausiert" : "▶️ Spielt", inline: true },
        { name: "Shuffle", value: player.queue.shuffle ? "🔀 An" : "➡️ Aus", inline: true }
    );

    if (current.thumbnail) embed.setThumbnail(current.thumbnail);
    return embed;
}

export function buildPanelComponents(player: GuildPlayer | undefined): ActionRowBuilder<ButtonBuilder>[] {
    const addRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(MUSIC_BUTTON_ADD).setLabel("Zur Queue hinzufuegen").setStyle(ButtonStyle.Success).setEmoji("➕")
    );

    const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(MUSIC_BUTTON_PREVIOUS).setEmoji("⏮️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(MUSIC_BUTTON_PLAYPAUSE).setEmoji(player?.paused ? "▶️" : "⏸️").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(MUSIC_BUTTON_SKIP).setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(MUSIC_BUTTON_SHUFFLE)
            .setEmoji("🔀")
            .setStyle(player?.queue.shuffle ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

    return [addRow, controlRow];
}

export async function setupMusicPanel(channel: TextChannel): Promise<void> {
    const player = getPlayer(channel.guild.id);
    const message = await channel.send({
        embeds: [buildPanelEmbed(player)],
        components: buildPanelComponents(player)
    });
    setMusicReference({ channelId: channel.id, messageId: message.id });
}

export async function updateMusicPanel(guild: Guild): Promise<void> {
    const ref = getData().music;
    if (!ref) return;

    const channel = await guild.channels.fetch(ref.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const message = await channel.messages.fetch(ref.messageId).catch(() => null);
    if (!message) return;

    const player = getPlayer(guild.id);
    await message.edit({ embeds: [buildPanelEmbed(player)], components: buildPanelComponents(player) }).catch(() => null);
}
