import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Botの生存確認をします");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  // インタラクション受信からの応答遅延を計測
  const latency = Date.now() - interaction.createdTimestamp;
  const apiLatency = Math.round(interaction.client.ws.ping);

  const embed = new EmbedBuilder()
    .setTitle("🏓 Pong!")
    .setColor(0x00bfff)
    .addFields(
      { name: "応答遅延", value: `${latency}ms`, inline: true },
      { name: "API遅延", value: `${apiLatency}ms`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
