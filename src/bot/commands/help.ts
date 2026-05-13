import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("QuakeLink Botの使い方を表示します");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle("📖 QuakeLink Bot - 使い方")
    .setColor(0x00bfff)
    .setDescription(
      "日本の地震速報を監視し、震度3以上の地震が発生した際に Discord へ通知します。"
    )
    .addFields(
      {
        name: "🔔 自動通知",
        value:
          "震度3以上の地震が発生すると、指定チャンネルへ自動で速報を送信します。\n地震速報には YouTube の地震ライブリンクも含まれます。",
      },
      {
        name: "⚡ コマンド一覧",
        value: [
          "`/ping` — Botの生存確認と遅延を表示",
          "`/latest` — 最後に取得した地震情報を表示",
          "`/help` — この使い方を表示",
        ].join("\n"),
      },
      {
        name: "🎨 震度カラー",
        value: [
          "🟡 黄色 — 震度3",
          "🟠 オレンジ — 震度4",
          "🔴 赤 — 震度5弱以上",
        ].join("\n"),
      },
      {
        name: "📡 データソース",
        value: "[P2P地震情報 API](https://www.p2pquake.net/)",
      }
    )
    .setFooter({ text: "QuakeLink v1.0.0" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
