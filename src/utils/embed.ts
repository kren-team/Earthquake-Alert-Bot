import { EmbedBuilder } from "discord.js";
import { EarthquakeInfo, SCALE_MAP } from "../types/earthquake";

/**
 * 震度に応じた Embed の色を返す
 * 震度3: 黄色, 震度4: オレンジ, 震度5弱以上: 赤
 */
function getEmbedColor(scale: number): number {
  if (scale >= 45) return 0xff0000; // 赤 (震度5弱以上)
  if (scale >= 40) return 0xff8c00; // オレンジ (震度4)
  return 0xffd700;                  // 黄色 (震度3)
}

/**
 * 津波情報を日本語テキストに変換する
 */
function formatTsunami(tsunami: string): string {
  const tsunamiMap: Record<string, string> = {
    None: "なし",
    Unknown: "不明",
    Checking: "調査中",
    NonEffective: "若干の海面変動",
    Watch: "津波注意報",
    Warning: "津波警報・大津波警報",
  };
  return tsunamiMap[tsunami] ?? tsunami;
}

/**
 * 地震情報から Discord の Embed を生成する
 */
export function buildEarthquakeEmbed(
  earthquake: EarthquakeInfo,
  youtubeUrl: string
): EmbedBuilder {
  const scaleLabel = SCALE_MAP[earthquake.maxScale] ?? "不明";
  const color = getEmbedColor(earthquake.maxScale);

  const { name, depth, magnitude } = earthquake.hypocenter;

  // 深さが 0 km の場合は「ごく浅い」と表示
  const depthLabel = depth === 0 ? "ごく浅い" : `${depth} km`;

  const embed = new EmbedBuilder()
    .setTitle("🚨 地震速報")
    .setColor(color)
    .addFields(
      { name: "📅 発生時刻", value: earthquake.time, inline: true },
      { name: "📊 最大震度", value: `震度 ${scaleLabel}`, inline: true },
      { name: "📍 震源地", value: name || "不明", inline: true },
      { name: "🌊 深さ", value: depthLabel, inline: true },
      { name: "💥 マグニチュード", value: `M${magnitude}`, inline: true },
      {
        name: "🌊 津波情報",
        value: formatTsunami(earthquake.domesticTsunami),
        inline: true,
      },
      { name: "📺 地震ライブ", value: youtubeUrl, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: "データ提供: P2P地震情報 API" });

  return embed;
}

/**
 * 最新地震情報表示用の Embed (コマンド /latest 用)
 */
export function buildLatestEmbed(earthquake: EarthquakeInfo): EmbedBuilder {
  const scaleLabel = SCALE_MAP[earthquake.maxScale] ?? "不明";
  const color = getEmbedColor(earthquake.maxScale);
  const { name, depth, magnitude } = earthquake.hypocenter;
  const depthLabel = depth === 0 ? "ごく浅い" : `${depth} km`;

  return new EmbedBuilder()
    .setTitle("📋 最新の地震情報")
    .setColor(color)
    .addFields(
      { name: "📅 発生時刻", value: earthquake.time, inline: true },
      { name: "📊 最大震度", value: `震度 ${scaleLabel}`, inline: true },
      { name: "📍 震源地", value: name || "不明", inline: true },
      { name: "🌊 深さ", value: depthLabel, inline: true },
      { name: "💥 マグニチュード", value: `M${magnitude}`, inline: true },
      {
        name: "🌊 津波情報",
        value: formatTsunami(earthquake.domesticTsunami),
        inline: true,
      }
    )
    .setTimestamp()
    .setFooter({ text: "データ提供: P2P地震情報 API" });
}
