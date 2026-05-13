# QuakeLink 🌏

日本の地震速報を監視し、震度3以上の地震が発生した際に Discord チャンネルへ通知する Bot です。

通知には YouTube の地震ライブリンクも同時に投稿されます。

---

## 機能

- 震度3以上の地震を自動検知して Discord に速報を送信
- 重複通知を防止 (同じ地震を2回通知しない)
- 震度に応じた色分け (黄/オレンジ/赤)
- YouTube 地震ライブリンクを同時投稿
- スラッシュコマンド: `/ping` `/latest` `/help`

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/yourusername/QuakeLink.git
cd QuakeLink
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. Discord Bot を作成する

1. [Discord Developer Portal](https://discord.com/developers/applications) を開く
2. **「New Application」** をクリックしてアプリ名を入力 (例: QuakeLink)
3. 左メニューの **「Bot」** を開き **「Add Bot」** をクリック
4. **「Reset Token」** で Token を生成してコピーしておく
5. **「Privileged Gateway Intents」** は不要 (Guilds インテントのみ使用)
6. 左メニューの **「General Information」** を開き **Application ID** をコピーしておく

### 4. Bot をサーバに招待する

以下の URL の `YOUR_APPLICATION_ID` を実際の Application ID に置き換えてブラウザで開く。

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=2048&scope=bot%20applications.commands
```

必要な権限:
- `Send Messages` (メッセージ送信)
- `Embed Links` (Embed投稿)
- `Use Slash Commands` (スラッシュコマンド)

### 5. 通知チャンネルIDを取得する

Discord の設定から **「開発者モード」** を有効化した後、
通知したいチャンネルを右クリックして **「チャンネルIDをコピー」** をクリック。

### 6. 環境変数を設定する

`.env.example` をコピーして `.env` を作成し、各値を入力する。

```bash
cp .env.example .env
```

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here
DISCORD_APPLICATION_ID=your_application_id_here
POLL_INTERVAL_MS=5000
MIN_SCALE=3
```

### 7. Bot を起動する

**開発環境 (ts-node で直接実行):**

```bash
npm run dev
```

**本番環境 (ビルドしてから実行):**

```bash
npm run build
npm start
```

---

## スラッシュコマンド

| コマンド  | 説明                         |
|-----------|------------------------------|
| `/ping`   | Bot の生存確認と遅延を表示   |
| `/latest` | 最後に取得した地震情報を表示 |
| `/help`   | 使い方を表示                 |

---

## 通知の例

震度3以上の地震が発生すると、以下のような Embed が投稿されます。

```
🚨 地震速報
────────────────────────
📅 発生時刻   2025/01/01 12:00:00
📊 最大震度   震度 4
📍 震源地     千葉県北西部
🌊 深さ       50 km
💥 マグニチュード  M4.2
🌊 津波情報   なし
📺 地震ライブ https://www.youtube.com/results?search_query=地震ライブ
────────────────────────
```

**震度カラー:**
- 🟡 黄色 — 震度3
- 🟠 オレンジ — 震度4
- 🔴 赤 — 震度5弱以上

---

## デプロイ方法

### Railway

1. [Railway](https://railway.app/) にアクセスしてアカウントを作成
2. **「New Project」→「Deploy from GitHub repo」** でリポジトリを選択
3. 環境変数を Railway の Variables に追加:
   - `DISCORD_TOKEN`
   - `DISCORD_CHANNEL_ID`
   - `DISCORD_APPLICATION_ID`
4. Start Command を以下に設定:
   ```
   npm run build && npm start
   ```

### Render

1. [Render](https://render.com/) にアクセスしてアカウントを作成
2. **「New Web Service」** でリポジトリを選択
3. 以下を設定:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. **「Environment」** タブで環境変数を追加

> **注意:** Railway / Render の無料プランはスリープがある場合があります。
> 24時間稼働させるには有料プランを検討してください。

---

## プロジェクト構成

```
src/
├── index.ts              # エントリーポイント・ポーリングループ
├── bot/
│   ├── client.ts         # Discord クライアント・コマンドハンドラ
│   └── commands/
│       ├── ping.ts       # /ping コマンド
│       ├── latest.ts     # /latest コマンド
│       └── help.ts       # /help コマンド
├── services/
│   ├── earthquakeService.ts  # P2P地震情報 API の取得・判定
│   └── youtubeService.ts     # YouTube ライブURL取得
├── utils/
│   ├── embed.ts          # Discord Embed ビルダー
│   └── logger.ts         # ロガーユーティリティ
└── types/
    └── earthquake.ts     # TypeScript 型定義
```

---

## データソース

- [P2P地震情報 API v2](https://www.p2pquake.net/develop/json_api_v2/)
  - エンドポイント: `https://api.p2pquake.net/v2/history?codes=551&limit=1`
  - 利用規約に従い適切な間隔 (5秒以上) でポーリングしてください

---

## ライセンス

MIT
