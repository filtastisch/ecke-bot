import { Command } from "@sapphire/framework";
import { EmbedBuilder, MessageFlags, type TextChannel } from "discord.js";

const NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export class PollCommand extends Command {
    public constructor(context: Command.LoaderContext, options: Command.Options) {
        super(context, { ...options });
    }

    public override registerApplicationCommands(registry: Command.Registry): void {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName("poll")
                .setDescription("Erstellt eine Umfrage.")
                .addStringOption((option) => option.setName("frage").setDescription("Die Frage").setRequired(true))
                .addStringOption((option) =>
                    option.setName("optionen").setDescription("Optionen mit Komma getrennt (max. 10). Leer = Ja/Nein.").setRequired(false)
                )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<unknown> {
        if (!interaction.channel) return;
        const question = interaction.options.getString("frage", true);
        const rawOptions = interaction.options.getString("optionen");
        const options = rawOptions
            ? rawOptions.split(",").map((entry) => entry.trim()).filter(Boolean).slice(0, 10)
            : [];

        const embed = new EmbedBuilder().setTitle("Umfrage").setDescription(`**${question}**`).setColor(0x5865f2).setFooter({ text: `von ${interaction.user.tag}` });

        if (options.length > 0) {
            embed.addFields({ name: "Optionen", value: options.map((option, index) => `${NUMBER_EMOJIS[index]} ${option}`).join("\n") });
        }

        await interaction.reply({ content: "Umfrage erstellt.", flags: MessageFlags.Ephemeral });
        const message = await (interaction.channel as TextChannel).send({ embeds: [embed] });

        if (options.length > 0) {
            for (let index = 0; index < options.length; index++) await message.react(NUMBER_EMOJIS[index]).catch(() => null);
        } else {
            await message.react("👍").catch(() => null);
            await message.react("👎").catch(() => null);
        }

        return null;
    }
}
