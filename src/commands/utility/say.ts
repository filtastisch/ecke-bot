import { Command } from "@sapphire/framework";
import { MessageFlags, PermissionFlagsBits, type TextChannel } from "discord.js";

export class SayCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["AdminOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("say")
                .setDescription("Laesst den Bot eine Nachricht senden.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
                .addStringOption((option) => option.setName("text").setDescription("Nachricht").setRequired(true))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.channel) return;
        const text = interaction.options.getString("text", true);
        await (interaction.channel as TextChannel).send(text).catch(() => null);
        return interaction.reply({ content: "Gesendet.", flags: MessageFlags.Ephemeral });
    }
}
