import { apiClient } from "./client";
import type { LoginResponse, GoogleAuthRequest } from "../types/api";

// Basic認証情報（開発用）
const BASIC_AUTH_ID = "admin";
const BASIC_AUTH_PW = "Quest2404";
const basicAuthHeader = `Basic ${btoa(`${BASIC_AUTH_ID}:${BASIC_AUTH_PW}`)}`;

/**
 * GET /api/test/login/:role
 * 開発用ダミーログイン。Basic認証が必須。
 * @param role "child" または "parent"
 */
export const testLogin = async (
  role: "child" | "parent"
): Promise<LoginResponse> => {
  const response = await apiClient.get<LoginResponse>(
    `/test/login/${role}`,
    {
      headers: {
        Authorization: basicAuthHeader,
      },
    }
  );
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
