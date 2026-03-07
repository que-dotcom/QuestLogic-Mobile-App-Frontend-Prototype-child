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
