import { Listener } from "@sapphire/framework";
import { Colors, EmbedBuilder, Events, type GuildMember } from "discord.js";
import { config, isConfigured } from "../lib/config";
import { resolveTextChannel } from "../lib/logger";

export class GuildMemberAddListener extends Listener<typeof Events.GuildMemberAdd> {
    public constructor(context: Listener.LoaderContext) {
        super(context, { event: Events.GuildMemberAdd });
    }

    public override async run(member: GuildMember): Promise<void> {
        if (config.features.joinRole && isConfigured(config.roles.visitor)) {
            await member.roles.add(config.roles.visitor).catch((error) => {
                this.container.logger.error(
                    "Besucher-Rolle konnte nicht vergeben werden. Pruefe: (1) Bot hat die Berechtigung 'Rollen verwalten', " +
                        "(2) die Bot-Rolle steht in der Server-Rollenliste UEBER der Besucher-Rolle.",
                    error
                );
            });
        }

        if (config.features.welcomeMessage) {
            const channel = await resolveTextChannel(member.guild, config.channels.welcome);
            if (channel) {
                const text = config.messages.welcome
                    .replaceAll("{user}", member.toString())
                    .replaceAll("{server}", member.guild.name)
                    .replaceAll("{memberCount}", String(member.guild.memberCount));
                await channel.send(text).catch(() => null);
            }
        }

        if (config.features.memberLog) {
            const embed = new EmbedBuilder()
                .setColor(Colors.Green)
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                .setTitle("Mitglied beigetreten")
                .setDescription(`${member} (\`${member.id}\`)`)
                .addFields({ name: "Account erstellt", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` })
                .setTimestamp();
            const channel = await resolveTextChannel(member.guild, config.channels.memberLog);
            await channel?.send({ embeds: [embed] }).catch(() => null);
        }
    }
}
