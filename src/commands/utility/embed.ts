import { Command } from "@sapphire/framework";
import { EmbedBuilder, MessageFlags, PermissionFlagsBits, type TextChannel } from "discord.js";

export class EmbedCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["AdminOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("embed")
                .setDescription("Sendet ein einfaches Embed.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
                .addStringOption((option) => option.setName("titel").setDescription("Titel").setRequired(true))
                .addStringOption((option) => option.setName("beschreibung").setDescription("Beschreibung").setRequired(true))
                .addStringOption((option) => option.setName("farbe").setDescription("Hex-Farbe, z.B. #5865F2").setRequired(false))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.channel) return;
        const title = interaction.options.getString("titel", true);
        const description = interaction.options.getString("beschreibung", true);
        const colorInput = interaction.options.getString("farbe");

        const embed = new EmbedBuilder().setTitle(title).setDescription(description.replaceAll("\\n", "\n")).setColor(0x5865f2);
        if (colorInput) {
            const parsed = Number.parseInt(colorInput.replace("#", ""), 16);
            if (!Number.isNaN(parsed)) embed.setColor(parsed);
        }

        await (interaction.channel as TextChannel).send({ embeds: [embed] }).catch(() => null);
        return interaction.reply({ content: "Embed gesendet.", flags: MessageFlags.Ephemeral });
    }
}
