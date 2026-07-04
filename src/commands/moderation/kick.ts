import { Command } from "@sapphire/framework";
import { Colors, MessageFlags, PermissionFlagsBits } from "discord.js";
import { logModAction } from "../../lib/modLog";

export class KickCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("kick")
                .setDescription("Kickt einen Nutzer vom Server.")
                .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
                .addUserOption((option) => option.setName("user").setDescription("Zu kickender Nutzer").setRequired(true))
                .addStringOption((option) => option.setName("grund").setDescription("Grund fuer den Kick").setRequired(false))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("grund");

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "Nutzer nicht auf dem Server gefunden.", flags: MessageFlags.Ephemeral });
        if (!member.kickable) return interaction.reply({ content: "Ich kann diesen Nutzer nicht kicken.", flags: MessageFlags.Ephemeral });

        await member.kick(reason ?? undefined).catch(() => null);
        await logModAction(interaction.guild, { action: "Kick", target: user, moderator: interaction.user, reason, color: Colors.Orange });

        return interaction.reply({ content: `${user.tag} wurde gekickt.`, flags: MessageFlags.Ephemeral });
    }
}
