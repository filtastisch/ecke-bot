import { Listener } from "@sapphire/framework";
import { Events, type Client } from "discord.js";
import { getData } from "../lib/config";

export class ReadyListener extends Listener<typeof Events.ClientReady> {
    public constructor(context: Listener.LoaderContext) {
        super(context, { event: Events.ClientReady, once: true });
    }

    public override async run(client: Client<true>): Promise<void> {
        const data = getData();
        const references = [data.reactionRoles.games, data.reactionRoles.colors].filter((ref) => ref !== undefined);

        for (const ref of references) {
            const channel = await client.channels.fetch(ref!.channelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                await channel.messages.fetch(ref!.messageId).catch(() => null);
            }
        }

        this.container.logger.info(`${references.length} Reaction-Role-Nachricht(en) nachgeladen.`);
    }
}
