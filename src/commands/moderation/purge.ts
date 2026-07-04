import { Command } from "@sapphire/framework";
import { MessageFlags, PermissionFlagsBits, type TextChannel } from "discord.js";

export class PurgeCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, preconditions: ["ModeratorOnly"] });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("purge")
                .setDescription("Loescht mehrere Nachrichten im aktuellen Channel.")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
                .addIntegerOption((option) =>
                    option.setName("anzahl").setDescription("Anzahl (1-100)").setMinValue(1).setMaxValue(100).setRequired(true)
                )
                .addUserOption((option) => option.setName("user").setDescription("Nur Nachrichten dieses Nutzers").setRequired(false))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild() || !interaction.channel) return;
        const amount = interaction.options.getInteger("anzahl", true);
        const user = interaction.options.getUser("user");
        const channel = interaction.channel as TextChannel;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const fetched = await channel.messages.fetch({ limit: user ? 100 : amount });
        const toDelete = user
            ? Array.from(fetched.filter((message) => message.author.id === user.id).values()).slice(0, amount)
            : fetched;

        const deleted = await channel.bulkDelete(toDelete, true);
        return interaction.editReply(`${deleted.size} Nachricht(en) geloescht.`);
    }
}
