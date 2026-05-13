import {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { logger } from "../utils/logger";

// スラッシュコマンドの型定義
interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// Discord クライアントを拡張して commands プロパティを追加
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// コマンドをコレクション(Map)で管理する
const commands = new Collection<string, Command>();

/**
 * コマンドファイルをロードしてクライアントに登録する
 */
export async function loadCommands(): Promise<void> {
  // コマンドモジュールを動的インポート
  const commandModules = [
    await import("./commands/ping"),
    await import("./commands/latest"),
    await import("./commands/help"),
  ];

  for (const module of commandModules) {
    commands.set(module.data.name, module as Command);
    logger.info(`コマンドをロード: /${module.data.name}`);
  }
}

/**
 * Discord API にスラッシュコマンドを登録する
 * ready イベント後に client.application.id が使えるため、ログイン後に呼ぶこと
 */
export async function registerSlashCommands(token: string): Promise<void> {
  // ログイン後は client.application.id で Application ID を自動取得できる
  const applicationId = client.application?.id;
  if (!applicationId) {
    throw new Error("Application ID を取得できませんでした。Botがログイン済みか確認してください。");
  }

  const rest = new REST({ version: "10" }).setToken(token);
  const commandData = [...commands.values()].map((cmd) => cmd.data.toJSON());

  try {
    logger.info(`${commandData.length}件のスラッシュコマンドを登録中...`);

    await rest.put(Routes.applicationCommands(applicationId), {
      body: commandData,
    });

    logger.info("スラッシュコマンドの登録が完了しました");
  } catch (error) {
    logger.error("スラッシュコマンドの登録に失敗しました:", error);
    throw error;
  }
}

/**
 * interactionCreate イベントハンドラを設定する
 * スラッシュコマンドの実行を担当する
 */
export function setupCommandHandler(): void {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`未知のコマンド: /${interaction.commandName}`);
      await interaction.reply({
        content: "このコマンドは存在しません。",
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`コマンド実行エラー /${interaction.commandName}:`, error);

      const errorMessage = "コマンドの実行中にエラーが発生しました。";
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  });
}

export { client };
