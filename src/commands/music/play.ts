import { Command } from "@sapphire/framework";
import { MessageFlags, type GuildMember } from "discord.js";
import { getOrCreatePlayer } from "../../lib/music/player";
import { resolveInput } from "../../lib/music/resolver";

export class PlayCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("play")
                .setDescription("Spielt einen Song oder eine Playlist ab (URL oder Suchbegriff).")
                .addStringOption((option) => option.setName("query").setDescription("YouTube-URL, Playlist oder Suchbegriff").setRequired(true))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;

        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) return interaction.reply({ content: "Du musst in einem Sprachkanal sein.", flags: MessageFlags.Ephemeral });

        const query = interaction.options.getString("query", true);
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let tracks;
        try {
            tracks = await resolveInput(query, interaction.user.id);
        } catch (error) {
            this.container.logger.error("[music] Aufloesung fehlgeschlagen:", (error as Error).message);
            return interaction.editReply("Beim Suchen ist ein Fehler aufgetreten.");
        }

        if (tracks.length === 0) return interaction.editReply("Nichts gefunden.");

        const player = getOrCreatePlayer(interaction.guild);
        await player.addTracks(tracks, voiceChannel);

        return interaction.editReply(tracks.length === 1 ? `**${tracks[0].title}** hinzugefuegt.` : `**${tracks.length}** Songs hinzugefuegt.`);
    }
}
