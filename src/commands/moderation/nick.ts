import { Command } from "@sapphire/framework";
import { MessageFlags, PermissionFlagsBits } from "discord.js";

export class NickCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("nick")
                .setDescription("Aendert den Nickname eines Nutzers.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
                .addUserOption((option) => option.setName("user").setDescription("Nutzer").setRequired(true))
                .addStringOption((option) => option.setName("name").setDescription("Neuer Nickname (leer = zuruecksetzen)").setRequired(false))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;
        const user = interaction.options.getUser("user", true);
        const name = interaction.options.getString("name");

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "Nutzer nicht gefunden.", flags: MessageFlags.Ephemeral });
        if (!member.manageable) return interaction.reply({ content: "Ich kann den Nickname dieses Nutzers nicht aendern.", flags: MessageFlags.Ephemeral });

        await member.setNickname(name).catch(() => null);
        return interaction.reply({ content: name ? `Nickname von ${user.tag} auf **${name}** gesetzt.` : `Nickname von ${user.tag} zurueckgesetzt.`, flags: MessageFlags.Ephemeral });
    }
}
