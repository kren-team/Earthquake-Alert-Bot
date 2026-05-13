/**
 * P2P地震情報 API v2 のレスポンス型定義
 * API: https://api.p2pquake.net/v2/history?codes=551&limit=1
 */

// 震源地情報
export interface Hypocenter {
  name: string;      // 震源地名 (例: "東京都")
  depth: number;     // 深さ (km)
  latitude: number;  // 緯度
  longitude: number; // 経度
  magnitude: number; // マグニチュード
}

// 震度観測点情報
export interface ObservationPoint {
  pref: string;   // 都道府県
  addr: string;   // 住所
  isArea: boolean; // エリア情報かどうか
  scale: number;  // 震度 (P2P形式: 10=1, 20=2, 30=3 ...)
}

// 地震本体データ
export interface EarthquakeInfo {
  time: string;           // 発生時刻 (例: "2023/01/01 12:00:00")
  maxScale: number;       // 最大震度 (P2P形式)
  domesticTsunami: string; // 国内津波情報
  foreignTsunami: string;  // 海外津波情報
  hypocenter: Hypocenter;
}

// P2P地震情報 APIのレスポンス1件
// 実際のレスポンス: earthquake / points がトップレベルに直接存在する
export interface P2PEarthquakeResponse {
  id: string;
  code: number;             // 551 = 地震情報
  time: string;             // 受信時刻
  earthquake: EarthquakeInfo;
  points: ObservationPoint[];
  comments?: {
    freeFormComment?: string;
  };
  issue?: {
    source: string;
    time: string;
    type: string;
    correct: string;
  };
}

/**
 * 震度スケール変換
 * P2P API の数値を人間が読める文字列に変換するためのマッピング
 *
 * P2P形式:
 * -1 = 不明, 10 = 1, 20 = 2, 30 = 3, 40 = 4,
 * 45 = 5弱, 50 = 5強, 55 = 6弱, 60 = 6強, 70 = 7
 */
export const SCALE_MAP: Record<number, string> = {
  [-1]: "不明",
  [10]: "1",
  [20]: "2",
  [30]: "3",
  [40]: "4",
  [45]: "5弱",
  [50]: "5強",
  [55]: "6弱",
  [60]: "6強",
  [70]: "7",
};

// 処理済み地震IDを管理するためのセット型
export type SeenEarthquakeIds = Set<string>;
