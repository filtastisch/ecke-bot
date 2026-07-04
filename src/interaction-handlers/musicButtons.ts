import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import {
    ActionRowBuilder,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    type ButtonInteraction,
    type GuildMember
} from "discord.js";
import {
    MUSIC_BUTTON_ADD,
    MUSIC_BUTTON_PLAYPAUSE,
    MUSIC_BUTTON_PREVIOUS,
    MUSIC_BUTTON_SHUFFLE,
    MUSIC_BUTTON_SKIP,
    MUSIC_MODAL_ID,
    MUSIC_MODAL_INPUT,
    updateMusicPanel
} from "../lib/music/panel";
import { getPlayer } from "../lib/music/player";

const CONTROL_IDS = [MUSIC_BUTTON_PREVIOUS, MUSIC_BUTTON_PLAYPAUSE, MUSIC_BUTTON_SKIP, MUSIC_BUTTON_SHUFFLE];

export class MusicButtonHandler extends InteractionHandler {
    public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
        super(context, { ...options, interactionHandlerType: InteractionHandlerTypes.Button });
    }

    public override parse(interaction: ButtonInteraction) {
        if (interaction.customId === MUSIC_BUTTON_ADD || CONTROL_IDS.includes(interaction.customId)) return this.some();
        return this.none();
    }

    public override async run(interaction: ButtonInteraction): Promise<void> {
        if (interaction.customId === MUSIC_BUTTON_ADD) {
            const modal = new ModalBuilder().setCustomId(MUSIC_MODAL_ID).setTitle("Song hinzufuegen");
            const input = new TextInputBuilder()
                .setCustomId(MUSIC_MODAL_INPUT)
                .setLabel("YouTube-URL, Playlist oder Suchbegriff")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
            await interaction.showModal(modal);
            return;
        }

        if (!interaction.inCachedGuild()) return;

        const member = interaction.member as GuildMember;
        if (!member.voice.channel) {
            await interaction.reply({ content: "Du musst in einem Sprachkanal sein.", flags: MessageFlags.Ephemeral });
            return;
        }

        const player = getPlayer(interaction.guildId);
        if (!player) {
            await interaction.reply({ content: "Aktuell laeuft keine Musik.", flags: MessageFlags.Ephemeral });
            return;
        }

        switch (interaction.customId) {
            case MUSIC_BUTTON_PLAYPAUSE:
                player.togglePause();
                break;
            case MUSIC_BUTTON_SKIP:
                await player.skip();
                break;
            case MUSIC_BUTTON_PREVIOUS: {
                const ok = await player.previous();
                if (!ok) {
                    await interaction.reply({ content: "Kein vorheriger Song vorhanden.", flags: MessageFlags.Ephemeral });
                    return;
                }
                break;
            }
            case MUSIC_BUTTON_SHUFFLE:
                player.toggleShuffle();
                break;
        }

        await updateMusicPanel(interaction.guild);
        if (!interaction.replied && !interaction.deferred) await interaction.deferUpdate().catch(() => null);
    }
}
