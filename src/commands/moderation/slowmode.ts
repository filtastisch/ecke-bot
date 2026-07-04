import { Command } from "@sapphire/framework";
import { MessageFlags, PermissionFlagsBits, type TextChannel } from "discord.js";

export class SlowmodeCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("slowmode")
                .setDescription("Setzt den Slowmode im aktuellen Channel.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
                .addIntegerOption((option) =>
                    option.setName("sekunden").setDescription("Sekunden (0 = aus, max. 21600)").setMinValue(0).setMaxValue(21600).setRequired(true)
                )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild() || !interaction.channel) return;
        const seconds = interaction.options.getInteger("sekunden", true);
        const channel = interaction.channel as TextChannel;

        await channel.setRateLimitPerUser(seconds).catch(() => null);
        return interaction.reply({
            content: seconds === 0 ? "Slowmode deaktiviert." : `Slowmode auf ${seconds} Sekunden gesetzt.`,
            flags: MessageFlags.Ephemeral
        });
    }
}
