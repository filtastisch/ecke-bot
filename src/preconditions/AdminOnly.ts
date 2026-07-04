import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { isAdmin } from "../lib/permissions";

export class AdminOnlyPrecondition extends Precondition {
    public override chatInputRun(interaction: ChatInputCommandInteraction): Precondition.Result {
        const member = interaction.member as GuildMember | null;
        if (member && isAdmin(member)) return this.ok();
        return this.error({ message: "Du benoetigst Admin-Rechte fuer diesen Befehl." });
    }
}

declare module "@sapphire/framework" {
    interface Preconditions {
        AdminOnly: never;
    }
}
