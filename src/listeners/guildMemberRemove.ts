import { Listener } from "@sapphire/framework";
import { Colors, EmbedBuilder, Events, type GuildMember, type PartialGuildMember } from "discord.js";
import { config } from "../lib/config";
import { resolveTextChannel } from "../lib/logger";

export class GuildMemberRemoveListener extends Listener<typeof Events.GuildMemberRemove> {
    public constructor(context: Listener.LoaderContext) {
        super(context, { event: Events.GuildMemberRemove });
    }

    public override async run(member: GuildMember | PartialGuildMember): Promise<void> {
        if (config.features.welcomeMessage) {
            const channel = await resolveTextChannel(member.guild, config.channels.welcome);
            if (channel) {
                const text = config.messages.leave
                    .replaceAll("{user}", member.user.tag)
                    .replaceAll("{server}", member.guild.name);
                await channel.send(text).catch(() => null);
            }
        }

        if (config.features.memberLog) {
            const roles = member.roles.cache.filter((role) => role.id !== member.guild.id).map((role) => role.toString());
            const embed = new EmbedBuilder()
                .setColor(Colors.Orange)
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                .setTitle("Mitglied verlassen")
                .setDescription(`${member.user.tag} (\`${member.id}\`)`)
                .addFields({ name: "Rollen", value: roles.length > 0 ? roles.join(", ") : "Keine" })
                .setTimestamp();
            const channel = await resolveTextChannel(member.guild, config.channels.memberLog);
            await channel?.send({ embeds: [embed] }).catch(() => null);
        }
    }
}
