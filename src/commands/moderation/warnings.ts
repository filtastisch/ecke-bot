import { Command } from "@sapphire/framework";
import { EmbedBuilder, MessageFlags, PermissionFlagsBits } from "discord.js";
import { getWarns } from "../../lib/warns";

export class WarningsCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("warnings")
                .setDescription("Zeigt die Verwarnungen eines Nutzers.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
                .addUserOption((option) => option.setName("user").setDescription("Nutzer").setRequired(true))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        const user = interaction.options.getUser("user", true);
        const warns = getWarns(user.id);

        if (warns.length === 0) {
            return interaction.reply({ content: `${user.tag} hat keine Verwarnungen.`, flags: MessageFlags.Ephemeral });
        }

        const embed = new EmbedBuilder()
            .setTitle(`Verwarnungen von ${user.tag}`)
            .setColor(0xfaa61a)
            .setDescription(
                warns
                    .map((warn, index) => `**${index + 1}.** <t:${Math.floor(warn.timestamp / 1000)}:d> von <@${warn.moderatorId}>\n> ${warn.reason}`)
                    .join("\n\n")
            );

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}
