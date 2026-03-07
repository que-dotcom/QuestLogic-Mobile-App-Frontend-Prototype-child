import axios from "axios";
import { getToken } from "../utils/tokenStorage";

// ベースURL: 環境変数 EXPO_PUBLIC_API_BASE_URL に /api を付与
// .env 例: EXPO_PUBLIC_API_BASE_URL=https://QL-api.adcsvmc.net
const baseURL = `${process.env.EXPO_PUBLIC_API_BASE_URL || "https://QL-api.adcsvmc.net"}/api`;

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// リクエストインターセプター: Authorization ヘッダーを自動付与
// ============================================================

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// レスポンスインターセプター: エラーハンドリングの共通化
// ============================================================

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: 401 の場合はログアウト処理を呼び出す等の共通処理を追加
    return Promise.reject(error);
  }
);

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

/**
 * axios のエラーから、画面表示向けのメッセージを安全に取り出す。
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback = "不明なエラーが発生しました。"
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | string | undefined;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};
