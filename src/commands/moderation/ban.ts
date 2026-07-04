import { Command } from "@sapphire/framework";
import { Colors, MessageFlags, PermissionFlagsBits } from "discord.js";
import { logModAction } from "../../lib/modLog";

export class BanCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("ban")
                .setDescription("Bannt einen Nutzer vom Server.")
                .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
                .addUserOption((option) => option.setName("user").setDescription("Zu bannender Nutzer").setRequired(true))
                .addStringOption((option) => option.setName("grund").setDescription("Grund fuer den Ban").setRequired(false))
                .addIntegerOption((option) =>
                    option
                        .setName("nachrichten_loeschen")
                        .setDescription("Nachrichten der letzten X Tage loeschen (0-7)")
                        .setMinValue(0)
                        .setMaxValue(7)
                        .setRequired(false)
                )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("grund");
        const deleteDays = interaction.options.getInteger("nachrichten_loeschen") ?? 0;

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (member && !member.bannable) {
            return interaction.reply({ content: "Ich kann diesen Nutzer nicht bannen (fehlende Rechte oder hoehere Rolle).", flags: MessageFlags.Ephemeral });
        }

        await interaction.guild.members.ban(user.id, { reason: reason ?? undefined, deleteMessageSeconds: deleteDays * 86400 }).catch(() => null);
        await logModAction(interaction.guild, { action: "Ban", target: user, moderator: interaction.user, reason, color: Colors.DarkRed });

        return interaction.reply({ content: `${user.tag} wurde gebannt.`, flags: MessageFlags.Ephemeral });
    }
}
