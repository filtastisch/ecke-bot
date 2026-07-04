import { Listener } from "@sapphire/framework";
import { Events, type MessageReaction, type PartialMessageReaction, type PartialUser, type User } from "discord.js";
import { config, isConfigured } from "../lib/config";
import { emojiMatches } from "../lib/emoji";
import { findReactionRolePanelByMessage } from "../lib/reactionRoles";

export class MessageReactionRemoveListener extends Listener<typeof Events.MessageReactionRemove> {
    public constructor(context: Listener.LoaderContext) {
        super(context, { event: Events.MessageReactionRemove });
    }

    public override async run(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> {
        if (user.bot) return;
        if (reaction.partial) await reaction.fetch().catch(() => null);

        const panelKey = findReactionRolePanelByMessage(reaction.message.id);
        if (!panelKey) return;

        const panel = config.reactionRoles[panelKey];
        const option = panel.options.find((entry) => emojiMatches(entry.emoji, reaction.emoji));
        if (!option || !isConfigured(option.roleId)) return;

        const guild = reaction.message.guild;
        if (!guild) return;
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        await member.roles.remove(option.roleId).catch((error) => this.container.logger.error("Reaction-Rolle konnte nicht entfernt werden:", error));
    }
}
