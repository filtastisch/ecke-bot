import { Command } from "@sapphire/framework";
import { MessageFlags } from "discord.js";

export class PingCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) => builder.setName("ping").setDescription("Zeigt die Latenz des Bots."));
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        await interaction.reply({ content: "Pinge...", flags: MessageFlags.Ephemeral });
        const sent = await interaction.fetchReply();
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        return interaction.editReply(`Pong! Roundtrip: ${roundtrip}ms, WebSocket: ${Math.round(this.container.client.ws.ping)}ms`);
    }
}
