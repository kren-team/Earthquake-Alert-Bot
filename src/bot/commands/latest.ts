import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getLatestEarthquake } from "../../services/earthquakeService";
import { buildLatestEmbed } from "../../utils/embed";

export const data = new SlashCommandBuilder()
  .setName("latest")
  .setDescription("最後に取得した地震情報を表示します");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const earthquake = getLatestEarthquake();

  if (!earthquake) {
    const embed = new EmbedBuilder()
      .setTitle("📋 最新の地震情報")
      .setColor(0x808080)
      .setDescription("まだ地震情報を取得していません。\nしばらくお待ちください。")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  const embed = buildLatestEmbed(earthquake);
  await interaction.reply({ embeds: [embed] });
}
