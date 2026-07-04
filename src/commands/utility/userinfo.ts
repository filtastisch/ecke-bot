import { Command } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";

export class UserInfoCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("userinfo")
                .setDescription("Zeigt Informationen ueber einen Nutzer.")
                .addUserOption((option) => option.setName("user").setDescription("Nutzer (Standard: du selbst)").setRequired(false))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.inCachedGuild()) return;
        const user = interaction.options.getUser("user") ?? interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const roles = member
            ? member.roles.cache.filter((role) => role.id !== interaction.guild.id).map((role) => role.toString())
            : [];

        const embed = new EmbedBuilder()
            .setTitle(user.tag)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setColor(member?.displayColor || 0x5865f2)
            .addFields(
                { name: "ID", value: user.id, inline: true },
                { name: "Bot", value: user.bot ? "Ja" : "Nein", inline: true },
                { name: "Account erstellt", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true }
            );

        if (member?.joinedTimestamp) {
            embed.addFields({ name: "Beigetreten", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true });
        }
        if (roles.length > 0) {
            embed.addFields({ name: `Rollen (${roles.length})`, value: roles.slice(0, 20).join(", ") });
        }

        return interaction.reply({ embeds: [embed] });
    }
}
