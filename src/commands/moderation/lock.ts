import { Command } from "@sapphire/framework";
import { MessageFlags, PermissionFlagsBits, type TextChannel } from "discord.js";

export class LockCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("lock")
                .setDescription("Sperrt den aktuellen Channel fuer @everyone.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild() || !interaction.channel) return;
        const channel = interaction.channel as TextChannel;

        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }).catch(() => null);
        return interaction.reply({ content: "Channel gesperrt.", flags: MessageFlags.Ephemeral });
    }
}
