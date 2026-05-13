/**
 * QuakeLink - 地震速報 Discord Bot
 *
 * P2P地震情報 API を定期ポーリングし、
 * 震度3以上の地震が発生した際に Discord チャンネルへ Embed 形式で通知する。
 *
 * TODO (将来の改善案):
 * - WebSocket化: P2P地震情報のWebSocket APIに切り替えてリアルタイム取得
 * - EEW対応: 緊急地震速報 (code=556) を取得して事前通知
 * - 地図画像生成: Canvas または sharp で震源地マップを生成して Embed に添付
 * - 地震履歴DB保存: SQLite/PostgreSQL で通知済み地震を永続化
 * - 地域フィルタ: 特定の都道府県の震度のみ通知する設定
 * - 津波警報通知: domestic_tsunami が Watch/Warning の場合に別チャンネルへ通知
 * - 音声通知: Discord の VC に Bot を参加させてテキスト読み上げ (TTS)
 * - 複数サーバ対応: チャンネルIDをサーバ毎に DB 管理して複数サーバへ一括配信
 */

import "dotenv/config";
import { TextChannel } from "discord.js";
import { client, loadCommands, registerSlashCommands, setupCommandHandler } from "./bot/client";
import { fetchLatestEarthquake, shouldNotify, markAsSeen, saveLatestEarthquake } from "./services/earthquakeService";
import { getYouTubeLiveUrl } from "./services/youtubeService";
import { buildEarthquakeEmbed } from "./utils/embed";
import { logger } from "./utils/logger";

// 環境変数のバリデーション
function validateEnv(): void {
  const required = ["DISCORD_TOKEN", "DISCORD_CHANNEL_ID"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`必須の環境変数が設定されていません: ${missing.join(", ")}`);
    logger.error(".env.example を参考に .env ファイルを作成してください");
    process.exit(1);
  }
}

/**
 * 地震情報の定期ポーリングを開始する
 * 指定間隔(デフォルト5秒)ごとに API を叩いて新着地震を確認する
 */
async function startEarthquakePolling(): Promise<void> {
  const channelId = process.env.DISCORD_CHANNEL_ID!;
  // 通知する最小震度 (デフォルト: 3)
  const minScale = parseInt(process.env.MIN_SCALE ?? "3", 10);
  // ポーリング間隔 (デフォルト: 5000ms = 5秒)
  const pollInterval = parseInt(process.env.POLL_INTERVAL_MS ?? "5000", 10);

  logger.info(`地震監視を開始します (間隔: ${pollInterval}ms, 最小震度: ${minScale})`);

  const poll = async () => {
    try {
      const data = await fetchLatestEarthquake();

      if (!data) return;

      // 最新地震情報を常にメモリに保存 (/latest コマンド用)
      saveLatestEarthquake(data.data.earthquake);

      // 通知条件を満たしていなければスキップ
      if (!shouldNotify(data, minScale)) return;

      // 通知済みとしてマーク
      markAsSeen(data.id);

      logger.info(
        `地震通知: id=${data.id}, maxScale=${data.data.earthquake.maxScale}, ` +
        `震源=${data.data.earthquake.hypocenter.name}`
      );

      // Discord チャンネルへ通知を送信
      const channel = client.channels.cache.get(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        logger.warn(`チャンネルが見つからないか、テキストチャンネルではありません: ${channelId}`);
        return;
      }

      const youtubeUrl = await getYouTubeLiveUrl();
      const embed = buildEarthquakeEmbed(data.data.earthquake, youtubeUrl);

      await channel.send({ embeds: [embed] });
      logger.info("Discord に地震速報を送信しました");

    } catch (error) {
      logger.error("ポーリング中にエラーが発生しました:", error);
    }
  };

  // 初回即時実行後、定期実行を開始
  await poll();
  setInterval(poll, pollInterval);
}

/**
 * メイン処理: Bot の初期化と起動
 */
async function main(): Promise<void> {
  validateEnv();

  const token = process.env.DISCORD_TOKEN!;

  // コマンドのロード
  await loadCommands();

  // インタラクションハンドラの設定
  setupCommandHandler();

  // Bot の準備完了イベント
  client.once("ready", async (readyClient) => {
    logger.info(`Bot ログイン完了: ${readyClient.user.tag}`);
    logger.info(`サーバ数: ${readyClient.guilds.cache.size}`);

    // ログイン後に Application ID が取得できるのでここでコマンド登録
    await registerSlashCommands(token);

    // 地震監視ポーリング開始
    await startEarthquakePolling();
  });

  // Discord に接続
  await client.login(token);
}

// プロセス全体のエラーハンドリング
process.on("unhandledRejection", (error) => {
  logger.error("未処理の Promise エラー:", error);
});

process.on("uncaughtException", (error) => {
  logger.error("未捕捉の例外:", error);
  process.exit(1);
});

// SIGINT (Ctrl+C) でグレースフルシャットダウン
process.on("SIGINT", () => {
  logger.info("シャットダウンします...");
  client.destroy();
  process.exit(0);
});

main().catch((error) => {
  logger.error("起動に失敗しました:", error);
  process.exit(1);
});
