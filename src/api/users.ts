import { apiClient } from "./client";
import type {
  UpdateProfileRequest,
  UpdateProfileResponse,
  GetInviteCodeResponse,
  JoinFamilyRequest,
  JoinFamilyResponse,
  LeaveFamilyResponse,
  ConsumePointsRequest,
  ConsumePointsResponse,
  GetCurrentUserResponse,
} from "../types/api";

/**
 * GET /api/users/me
 * 現在ログイン中のユーザー情報を取得する。
 */
export const getCurrentUser = async (): Promise<GetCurrentUserResponse> => {
  const response = await apiClient.get<GetCurrentUserResponse>("/users/me");
  return response.data;
};

/**
 * PUT /api/users/profile
 * プロフィールを更新する。Child / Parent 共通。
 */
export const updateProfile = async (
  body: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  const response = await apiClient.put<UpdateProfileResponse>(
    "/users/profile",
    body
  );
  return response.data;
};

/**
 * GET /api/users/invite-code
 * 招待コードを取得する。Parent 専用。
 */
export const getInviteCode = async (): Promise<GetInviteCodeResponse> => {
  const response =
    await apiClient.get<GetInviteCodeResponse>("/users/invite-code");
  return response.data;
};

/**
 * POST /api/users/join-family
 * 招待コードで家族に参加する。Child 専用。
 */
export const joinFamily = async (
  body: JoinFamilyRequest
): Promise<JoinFamilyResponse> => {
  const response = await apiClient.post<JoinFamilyResponse>(
    "/users/join-family",
    body
  );
  return response.data;
};

/**
 * POST /api/users/leave-family
 * 家族から退出する。Child 専用。
 */
export const leaveFamily = async (): Promise<LeaveFamilyResponse> => {
  const response = await apiClient.post<LeaveFamilyResponse>(
    "/users/leave-family"
  );
  return response.data;
};

/**
 * POST /api/users/consume-points
 * ポイントを消費してゲーム時間を得る。Child 専用。
 * ※ v2.0 の `minutes` ではなく `consumePoints` を送ること。
 */
export const consumePoints = async (
  body: ConsumePointsRequest
): Promise<ConsumePointsResponse> => {
  const response = await apiClient.post<ConsumePointsResponse>(
    "/users/consume-points",
    body
  );
  return response.data;
};
