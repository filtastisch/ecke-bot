import { Listener } from "@sapphire/framework";
import { Colors, EmbedBuilder, Events, type Message } from "discord.js";
import { config, isConfigured } from "../lib/config";
import { sendLog } from "../lib/logger";

export class AutoBanChannelListener extends Listener<typeof Events.MessageCreate> {
    public constructor(context: Listener.LoaderContext) {
        super(context, { event: Events.MessageCreate });
    }

    public override async run(message: Message): Promise<void> {
        if (!config.moderation.autoBanEnabled) return;
        if (!isConfigured(config.channels.autoBan)) return;
        if (message.channelId !== config.channels.autoBan) return;
        if (message.author.bot || !message.inGuild()) return;

        await message.delete().catch(() => null);
        await message.guild.members.ban(message.author.id, { reason: "Auto-Ban: Nachricht im gesperrten Kanal." }).catch((error) => {
            this.container.logger.error("Auto-Ban fehlgeschlagen:", error);
        });

        const embed = new EmbedBuilder()
            .setColor(Colors.DarkRed)
            .setTitle("Auto-Ban")
            .setDescription(`${message.author.tag} (\`${message.author.id}\`) wurde automatisch gebannt.`)
            .addFields({ name: "Kanal", value: `<#${message.channelId}>` })
            .setTimestamp();
        await sendLog(message.guild, config.channels.modLog, embed);
    }
}
