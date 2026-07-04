import { Command } from "@sapphire/framework";
import { MessageFlags } from "discord.js";
import { getPlayer } from "../../lib/music/player";

export class StopCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder.setName("stop").setDescription("Stoppt die Wiedergabe, leert die Queue und verlaesst den Sprachkanal.")
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;

        const player = getPlayer(interaction.guildId);
        if (!player) return interaction.reply({ content: "Aktuell laeuft keine Musik.", flags: MessageFlags.Ephemeral });

        player.destroy();
        return interaction.reply({ content: "Wiedergabe gestoppt und Queue geleert.", flags: MessageFlags.Ephemeral });
    }
}
