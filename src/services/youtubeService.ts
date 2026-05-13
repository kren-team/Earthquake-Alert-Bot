import axios from "axios";
import { logger } from "../utils/logger";

// YouTube 検索結果URL (YouTube Data API なしでもアクセス可能なフォールバック)
const YOUTUBE_SEARCH_URL =
  "https://www.youtube.com/results?search_query=地震ライブ";

/**
 * YouTube 地震ライブ配信の URL を返す
 *
 * YouTube Data API キーが設定されている場合は実際のライブ配信URLを取得する。
 * 設定されていない場合は検索結果URLをフォールバックとして使用する。
 *
 * TODO: YouTube Data API 連携
 * - YOUTUBE_API_KEY を .env に設定する
 * - GET https://www.googleapis.com/youtube/v3/search?part=snippet&q=地震ライブ&type=video&eventType=live
 * - レスポンスの items[0].id.videoId を使って https://www.youtube.com/watch?v={videoId} を返す
 */
export async function getYouTubeLiveUrl(): Promise<string> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    return fetchLiveVideoUrl(apiKey);
  }

  // APIキーなし: 検索結果ページのURLを返す
  return YOUTUBE_SEARCH_URL;
}

/**
 * YouTube Data API を使って実際に配信中のライブURLを取得する
 */
async function fetchLiveVideoUrl(apiKey: string): Promise<string> {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: "地震ライブ 速報",
          type: "video",
          eventType: "live",
          key: apiKey,
          maxResults: 1,
          relevanceLanguage: "ja",
          regionCode: "JP",
        },
        timeout: 8000,
      }
    );

    const items = response.data?.items;
    if (items && items.length > 0) {
      const videoId = items[0].id?.videoId;
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    logger.warn("YouTube: ライブ配信が見つからなかったため検索URLを使用します");
    return YOUTUBE_SEARCH_URL;
  } catch (error) {
    logger.error("YouTube API エラー: フォールバックURLを使用します", error);
    return YOUTUBE_SEARCH_URL;
  }
}
