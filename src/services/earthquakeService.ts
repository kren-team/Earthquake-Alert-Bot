import axios from "axios";
import { P2PEarthquakeResponse, EarthquakeInfo, SeenEarthquakeIds } from "../types/earthquake";
import { logger } from "../utils/logger";

// P2P地震情報 API エンドポイント
// code=551: 地震情報, limit=1: 最新1件のみ取得
const API_URL = "https://api.p2pquake.net/v2/history?codes=551&limit=1";

// 重複通知防止: 処理済みの地震IDを保持するセット
const seenIds: SeenEarthquakeIds = new Set();

// 最後に取得した地震情報 (/latest コマンド用)
let latestEarthquake: EarthquakeInfo | null = null;

/**
 * P2P地震情報 API から最新の地震情報を1件取得する
 */
export async function fetchLatestEarthquake(): Promise<P2PEarthquakeResponse | null> {
  try {
    const response = await axios.get<P2PEarthquakeResponse[]>(API_URL, {
      timeout: 10000, // 10秒タイムアウト
    });

    if (!response.data || response.data.length === 0) {
      logger.debug("地震情報なし (APIレスポンスが空)");
      return null;
    }

    return response.data[0];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(`API取得エラー: ${error.message} (status: ${error.response?.status})`);
    } else {
      logger.error("予期しないエラー:", error);
    }
    return null;
  }
}

/**
 * 取得した地震データが通知対象かどうかを判定する
 *
 * 条件:
 * 1. 最大震度が設定値 (デフォルト: 3 = P2P値: 30) 以上
 * 2. 同じ地震IDを重複処理していない
 */
export function shouldNotify(data: P2PEarthquakeResponse, minScale: number): boolean {
  const { id } = data;
  const { maxScale } = data.earthquake;

  // P2P API の震度値に変換 (例: 震度3 → 30)
  const minScaleP2P = minScale * 10;

  if (maxScale < minScaleP2P) {
    logger.debug(`震度が通知条件以下: maxScale=${maxScale}, min=${minScaleP2P}`);
    return false;
  }

  if (seenIds.has(id)) {
    logger.debug(`重複スキップ: id=${id}`);
    return false;
  }

  return true;
}

/**
 * 地震IDを処理済みとしてマークする
 * メモリ肥大化防止のため、最大 1000 件を保持
 */
export function markAsSeen(id: string): void {
  seenIds.add(id);

  // TODO: 地震履歴DB保存 - SQLite や PostgreSQL に保存してメモリ管理を改善する
  if (seenIds.size > 1000) {
    const firstId = seenIds.values().next().value;
    if (firstId) seenIds.delete(firstId);
  }
}

/**
 * 最後に取得した地震情報をメモリに保存する
 */
export function saveLatestEarthquake(info: EarthquakeInfo): void {
  latestEarthquake = info;
}

/**
 * メモリに保存された最新地震情報を返す
 */
export function getLatestEarthquake(): EarthquakeInfo | null {
  return latestEarthquake;
}
