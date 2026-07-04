import { Command } from "@sapphire/framework";
import type { Message } from "discord.js";
import { isAdmin } from "../../lib/permissions";

export class EmojisCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options, name: "emojis", description: "Listet alle Server-Emojis im <:name:id>-Format zum Kopieren fuer die config.json." });
    }

    public override async messageRun(message: Message): Promise<unknown> {
        if (!message.inGuild()) return;
        if (!message.member || !isAdmin(message.member)) {
            return message.reply("Du hast keine Berechtigung fuer diesen Befehl.");
        }

        const emojis = [...message.guild.emojis.cache.values()];
        if (emojis.length === 0) {
            return message.reply("Dieser Server hat keine eigenen Emojis.");
        }

        const lines = emojis.map((emoji) => `${emoji} \`${emoji.toString()}\``);

        // In Bloecke unter dem Discord-Zeichenlimit (2000) aufteilen
        const chunks: string[] = [];
        let current = "";
        for (const line of lines) {
            if (current.length + line.length + 1 > 1900) {
                chunks.push(current);
                current = "";
            }
            current += `${line}\n`;
        }
        if (current.length > 0) chunks.push(current);

        for (const chunk of chunks) {
            await message.channel.send(chunk).catch(() => null);
        }

        return null;
    }
}
