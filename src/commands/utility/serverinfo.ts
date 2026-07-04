import { Command } from "@sapphire/framework";
import { EmbedBuilder, GuildVerificationLevel } from "discord.js";

export class ServerInfoCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) => builder.setName("serverinfo").setDescription("Zeigt Informationen ueber den Server."));
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;
        const guild = interaction.guild;
        const owner = await guild.fetchOwner().catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle(guild.name)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setColor(0x5865f2)
            .addFields(
                { name: "Besitzer", value: owner ? owner.user.tag : "Unbekannt", inline: true },
                { name: "Mitglieder", value: String(guild.memberCount), inline: true },
                { name: "Erstellt", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                { name: "Rollen", value: String(guild.roles.cache.size), inline: true },
                { name: "Kanaele", value: String(guild.channels.cache.size), inline: true },
                { name: "Boosts", value: `${guild.premiumSubscriptionCount ?? 0} (Stufe ${guild.premiumTier})`, inline: true },
                { name: "Verifizierung", value: GuildVerificationLevel[guild.verificationLevel], inline: true }
            )
            .setFooter({ text: `Server-ID: ${guild.id}` });

        return interaction.reply({ embeds: [embed] });
    }
}
