import { Command } from "@sapphire/framework";
import { Colors, MessageFlags, PermissionFlagsBits } from "discord.js";
import { config } from "../../lib/config";
import { logModAction } from "../../lib/modLog";
import { addWarn, getWarns } from "../../lib/warns";

export class WarnCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("warn")
                .setDescription("Verwarnt einen Nutzer.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
                .addUserOption((option) => option.setName("user").setDescription("Nutzer").setRequired(true))
                .addStringOption((option) => option.setName("grund").setDescription("Grund").setRequired(true))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("grund", true);

        addWarn(user.id, interaction.user.id, reason);
        const total = getWarns(user.id).length;

        await logModAction(interaction.guild, {
            action: "Verwarnung",
            target: user,
            moderator: interaction.user,
            reason,
            color: Colors.Yellow,
            extra: [{ name: "Warnungen gesamt", value: `${total}/${config.moderation.maxWarns}` }]
        });

        let note = "";
        if (total >= config.moderation.maxWarns) {
            note = ` Der Nutzer hat das Limit von ${config.moderation.maxWarns} Warnungen erreicht.`;
        }

        return interaction.reply({ content: `${user.tag} wurde verwarnt (${total}/${config.moderation.maxWarns}).${note}`, flags: MessageFlags.Ephemeral });
    }
}
