import { Command } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";

export class AvatarCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("avatar")
                .setDescription("Zeigt den Avatar eines Nutzers.")
                .addUserOption((option) => option.setName("user").setDescription("Nutzer (Standard: du selbst)").setRequired(false))
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        const user = interaction.options.getUser("user") ?? interaction.user;
        const embed = new EmbedBuilder()
            .setTitle(`Avatar von ${user.tag}`)
            .setImage(user.displayAvatarURL({ size: 1024 }))
            .setColor(0x5865f2);

        return interaction.reply({ embeds: [embed] });
    }
}
