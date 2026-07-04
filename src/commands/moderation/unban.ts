import { Command } from "@sapphire/framework";
import { Colors, MessageFlags, PermissionFlagsBits } from "discord.js";
import { logModAction } from "../../lib/modLog";

export class UnbanCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("unban")
                .setDescription("Hebt den Ban eines Nutzers auf.")
                .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
                .addStringOption((option) => option.setName("user_id").setDescription("ID des zu entbannenden Nutzers").setRequired(true))
                .addStringOption((option) => option.setName("grund").setDescription("Grund").setRequired(false))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;
        const userId = interaction.options.getString("user_id", true);
        const reason = interaction.options.getString("grund");

        const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
        if (!ban) {
            return interaction.reply({ content: "Dieser Nutzer ist nicht gebannt.", flags: MessageFlags.Ephemeral });
        }

        await interaction.guild.members.unban(userId, reason ?? undefined).catch(() => null);
        await logModAction(interaction.guild, { action: "Unban", target: ban.user, moderator: interaction.user, reason, color: Colors.Green });

        return interaction.reply({ content: `${ban.user.tag} wurde entbannt.`, flags: MessageFlags.Ephemeral });
    }
}
