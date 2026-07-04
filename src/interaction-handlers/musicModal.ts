import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import { MessageFlags, type GuildMember, type ModalSubmitInteraction } from "discord.js";
import { MUSIC_MODAL_ID, MUSIC_MODAL_INPUT } from "../lib/music/panel";
import { getOrCreatePlayer } from "../lib/music/player";
import { resolveInput } from "../lib/music/resolver";

export class MusicModalHandler extends InteractionHandler {
    public constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
        super(context, { ...options, interactionHandlerType: InteractionHandlerTypes.ModalSubmit });
    }

    public override parse(interaction: ModalSubmitInteraction) {
        if (interaction.customId === MUSIC_MODAL_ID) return this.some();
        return this.none();
    }

    public override async run(interaction: ModalSubmitInteraction): Promise<void> {
        if (!interaction.inCachedGuild()) return;

        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            await interaction.reply({ content: "Du musst in einem Sprachkanal sein.", flags: MessageFlags.Ephemeral });
            return;
        }

        const query = interaction.fields.getTextInputValue(MUSIC_MODAL_INPUT);
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let tracks;
        try {
            tracks = await resolveInput(query, interaction.user.id);
        } catch (error) {
            this.container.logger.error("[music] Aufloesung fehlgeschlagen:", (error as Error).message);
            await interaction.editReply("Beim Suchen ist ein Fehler aufgetreten. Versuche es mit einem anderen Link oder Suchbegriff.");
            return;
        }

        if (tracks.length === 0) {
            await interaction.editReply("Nichts gefunden.");
            return;
        }

        const player = getOrCreatePlayer(interaction.guild);
        await player.addTracks(tracks, voiceChannel);

        const summary = tracks.length === 1 ? `**${tracks[0].title}** hinzugefuegt.` : `**${tracks.length}** Songs zur Queue hinzugefuegt.`;
        await interaction.editReply(summary);
    }
}
