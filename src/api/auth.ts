import { apiClient } from "./client";
import type { LoginResponse, GoogleAuthRequest } from "../types/api";

// Basic認証ヘッダー（開発用）
// "admin:Quest2404" を Base64 エンコードした固定文字列
// React Native では btoa が使えない環境があるため、固定値を直接使用する
const BASIC_AUTH_HEADER = "Basic YWRtaW46UXVlc3QyNDA0";

/**
 * GET /api/test/login/:role
 * 開発用ダミーログイン。Basic認証が必須。
 * @param role "child" または "parent"
 */
export const testLogin = async (
  role: "child" | "parent"
): Promise<LoginResponse> => {
  const response = await apiClient.get<LoginResponse>(`/test/login/${role}`, {
    headers: {
      Authorization: BASIC_AUTH_HEADER,
    },
  });
  return response.data;
};

/**
 * POST /api/auth/google
 * Google idToken を検証し、QuestLogic 用 JWT を発行する。
 */
export const googleAuth = async (
  body: GoogleAuthRequest
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/google", body);
  return response.data;
};
