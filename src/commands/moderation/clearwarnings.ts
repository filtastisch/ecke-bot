import { Command } from "@sapphire/framework";
import { Colors, MessageFlags, PermissionFlagsBits } from "discord.js";
import { logModAction } from "../../lib/modLog";
import { clearWarns } from "../../lib/warns";

export class ClearWarningsCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"], name: "clearwarnings" });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("clearwarnings")
                .setDescription("Loescht alle Verwarnungen eines Nutzers.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
                .addUserOption((option) => option.setName("user").setDescription("Nutzer").setRequired(true))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;
        const user = interaction.options.getUser("user", true);
        const count = clearWarns(user.id);

        if (count === 0) {
            return interaction.reply({ content: `${user.tag} hatte keine Verwarnungen.`, flags: MessageFlags.Ephemeral });
        }

        await logModAction(interaction.guild, {
            action: "Verwarnungen geloescht",
            target: user,
            moderator: interaction.user,
            color: Colors.Green,
            extra: [{ name: "Geloescht", value: `${count} Verwarnung(en)` }]
        });

        return interaction.reply({ content: `${count} Verwarnung(en) von ${user.tag} geloescht.`, flags: MessageFlags.Ephemeral });
    }
}
