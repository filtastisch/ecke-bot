import { Listener } from "@sapphire/framework";
import { Events, type MessageReaction, type PartialMessageReaction, type PartialUser, type User } from "discord.js";
import { config, isConfigured } from "../lib/config";
import { emojiMatches } from "../lib/emoji";
import { findReactionRolePanelByMessage } from "../lib/reactionRoles";

export class MessageReactionAddListener extends Listener<typeof Events.MessageReactionAdd> {
    public constructor(context: Listener.LoaderContext) {
        super(context, { event: Events.MessageReactionAdd });
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

        if (panelKey === "colors") {
            const otherColorRoles = panel.options
                .filter((entry) => entry.roleId !== option.roleId && isConfigured(entry.roleId) && member.roles.cache.has(entry.roleId))
                .map((entry) => entry.roleId);
            if (otherColorRoles.length > 0) {
                await member.roles.remove(otherColorRoles).catch(() => null);
                await this.removeOtherColorReactions(reaction, panelKey, option.emoji, user.id);
            }
        }

        await member.roles.add(option.roleId).catch((error) => this.container.logger.error("Reaction-Rolle konnte nicht vergeben werden:", error));
    }

    private async removeOtherColorReactions(
        reaction: MessageReaction | PartialMessageReaction,
        panelKey: "colors",
        keepConfigEmoji: string,
        userId: string
    ): Promise<void> {
        const message = reaction.message;
        for (const [, otherReaction] of message.reactions.cache) {
            if (emojiMatches(keepConfigEmoji, otherReaction.emoji)) continue;
            const isPanelEmoji = config.reactionRoles[panelKey].options.some((entry) => emojiMatches(entry.emoji, otherReaction.emoji));
            if (!isPanelEmoji) continue;
            await otherReaction.users.remove(userId).catch(() => null);
        }
    }
}
