import { Command } from "@sapphire/framework";
import { Colors, MessageFlags, PermissionFlagsBits } from "discord.js";
import { logModAction } from "../../lib/modLog";

const MAX_MINUTES = 40320; // 28 Tage, Discord-Limit

export class TimeoutCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("timeout")
                .setDescription("Versetzt einen Nutzer in einen Timeout.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
                .addUserOption((option) => option.setName("user").setDescription("Nutzer").setRequired(true))
                .addIntegerOption((option) =>
                    option.setName("minuten").setDescription("Dauer in Minuten").setMinValue(1).setMaxValue(MAX_MINUTES).setRequired(true)
                )
                .addStringOption((option) => option.setName("grund").setDescription("Grund").setRequired(false))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;
        const user = interaction.options.getUser("user", true);
        const minutes = interaction.options.getInteger("minuten", true);
        const reason = interaction.options.getString("grund");

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "Nutzer nicht gefunden.", flags: MessageFlags.Ephemeral });
        if (!member.moderatable) return interaction.reply({ content: "Ich kann diesen Nutzer nicht in den Timeout versetzen.", flags: MessageFlags.Ephemeral });

        await member.timeout(minutes * 60 * 1000, reason ?? undefined).catch(() => null);
        await logModAction(interaction.guild, {
            action: "Timeout",
            target: user,
            moderator: interaction.user,
            reason,
            color: Colors.Yellow,
            extra: [{ name: "Dauer", value: `${minutes} Minuten` }]
        });

        return interaction.reply({ content: `${user.tag} wurde fuer ${minutes} Minuten in den Timeout versetzt.`, flags: MessageFlags.Ephemeral });
    }
}
