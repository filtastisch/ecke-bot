import { Command } from "@sapphire/framework";
import { Colors, MessageFlags, PermissionFlagsBits } from "discord.js";
import { logModAction } from "../../lib/modLog";

export class UntimeoutCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("untimeout")
                .setDescription("Hebt den Timeout eines Nutzers auf.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
                .addUserOption((option) => option.setName("user").setDescription("Nutzer").setRequired(true))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;
        const user = interaction.options.getUser("user", true);
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "Nutzer nicht gefunden.", flags: MessageFlags.Ephemeral });

        await member.timeout(null).catch(() => null);
        await logModAction(interaction.guild, { action: "Timeout aufgehoben", target: user, moderator: interaction.user, color: Colors.Green });

        return interaction.reply({ content: `Timeout von ${user.tag} wurde aufgehoben.`, flags: MessageFlags.Ephemeral });
    }
}
