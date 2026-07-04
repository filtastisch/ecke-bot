import { Command } from "@sapphire/framework";
import { MessageFlags, PermissionFlagsBits, type TextChannel } from "discord.js";

export class UnlockCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("unlock")
                .setDescription("Hebt die Sperre des aktuellen Channels auf.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild() || !interaction.channel) return;
        const channel = interaction.channel as TextChannel;

        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null }).catch(() => null);
        return interaction.reply({ content: "Channel entsperrt.", flags: MessageFlags.Ephemeral });
    }
}
