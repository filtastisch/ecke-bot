import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { isModerator } from "../lib/permissions";

export class ModeratorOnlyPrecondition extends Precondition {
    public override chatInputRun(interaction: ChatInputCommandInteraction): Precondition.Result {
        return this.check(interaction.member as GuildMember | null);
    }

    private check(member: GuildMember | null): Precondition.Result {
        if (member && isModerator(member)) return this.ok();
        return this.error({ message: "Du benoetigst Moderator-Rechte fuer diesen Befehl." });
    }
}

declare module "@sapphire/framework" {
    interface Preconditions {
        ModeratorOnly: never;
    }
}
