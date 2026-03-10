import axios from "axios";
import { getToken } from "../utils/tokenStorage";

// ベースURL: 環境変数 EXPO_PUBLIC_API_BASE_URL に /api を付与
// .env 例: EXPO_PUBLIC_API_BASE_URL=https://QL-api.adcsvmc.net
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!API_BASE) {
  throw new Error(
    "[client] EXPO_PUBLIC_API_BASE_URL が設定されていません。.env を確認してください。"
  );
}
const baseURL = `${API_BASE}/api`;

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
// 401 ハンドラー: AuthContext との循環参照を避けるためコールバック方式
// ============================================================

/** 401 受信時に呼び出されるコールバック（AuthProvider が登録する） */
let unauthorizedHandler: (() => void) | null = null;

/**
 * 401 受信時に実行するコールバックを登録する。
 * AuthProvider の useEffect 内から呼び出すことで循環参照を回避する。
 */
export const setUnauthorizedHandler = (handler: () => void): void => {
  unauthorizedHandler = handler;
};

// ============================================================
// レスポンスインターセプター: エラーハンドリングの共通化
// ============================================================

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      unauthorizedHandler?.();
    }
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
