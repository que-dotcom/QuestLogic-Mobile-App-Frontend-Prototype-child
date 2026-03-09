import { apiClient } from "./client";
import type {
  GetFamilySettingsResponse,
  UpdateFamilySettingsRequest,
  UpdateFamilySettingsResponse,
  GameStatusResponse,
  FamilyLockRequest,
  FamilyLockResponse,
  GetAiSettingsResponse,
  UpdateAiSettingsRequest,
  UpdateAiSettingsResponse,
  GetDevicesResponse,
  AddDeviceRequest,
  AddDeviceResponse,
  DeleteDeviceResponse,
} from "../types/api";

/**
 * GET /api/family/settings
 * 家族設定（minutesPerPoint など）を取得する。Parent 専用。
 */
export const getFamilySettings =
  async (): Promise<GetFamilySettingsResponse> => {
    const response =
      await apiClient.get<GetFamilySettingsResponse>("/family/settings");
    return response.data;
  };

/**
 * PUT /api/family/settings
 * 1ポイントあたりの分数を更新する。Parent 専用。
 * minutesPerPoint は 1〜60 の整数。
 */
export const updateFamilySettings = async (
  body: UpdateFamilySettingsRequest
): Promise<UpdateFamilySettingsResponse> => {
  const response = await apiClient.put<UpdateFamilySettingsResponse>(
    "/family/settings",
    body
  );
  return response.data;
};

/**
 * GET /api/family/game-status
 * 家族内の子供ポイント合計から残りゲーム時間を取得する。Parent 専用。
 */
export const getGameStatus = async (): Promise<GameStatusResponse> => {
  const response =
    await apiClient.get<GameStatusResponse>("/family/game-status");
  return response.data;
};

/**
 * POST /api/family/lock
 * 端末を強制ロック / 解除する。Parent 専用。
 */
export const setFamilyLock = async (
  body: FamilyLockRequest
): Promise<FamilyLockResponse> => {
  const response = await apiClient.post<FamilyLockResponse>(
    "/family/lock",
    body
  );
  return response.data;
};

/**
 * GET /api/family/settings/ai
 * AI 判定設定を取得する。Parent 専用。
 */
export const getAiSettings = async (): Promise<GetAiSettingsResponse> => {
  const response =
    await apiClient.get<GetAiSettingsResponse>("/family/settings/ai");
  return response.data;
};

/**
 * PATCH /api/family/settings/ai
 * AI 判定設定を部分更新する。Parent 専用。
 */
export const updateAiSettings = async (
  body: UpdateAiSettingsRequest
): Promise<UpdateAiSettingsResponse> => {
  const response = await apiClient.patch<UpdateAiSettingsResponse>(
    "/family/settings/ai",
    body
  );
  return response.data;
};

/**
 * GET /api/family/devices
 * 家族に紐づくデバイス一覧を取得する。Parent 専用。
 */
export const getDevices = async (): Promise<GetDevicesResponse> => {
  const response = await apiClient.get<GetDevicesResponse>("/family/devices");
  return response.data;
};

/**
 * POST /api/family/devices
 * デバイスを追加する。Parent 専用。
 */
export const addDevice = async (
  body: AddDeviceRequest
): Promise<AddDeviceResponse> => {
  const response = await apiClient.post<AddDeviceResponse>(
    "/family/devices",
    body
  );
  return response.data;
};

/**
 * DELETE /api/family/devices/:id
 * デバイスを削除する。Parent 専用。
 */
export const deleteDevice = async (
  id: string
): Promise<DeleteDeviceResponse> => {
  const response = await apiClient.delete<DeleteDeviceResponse>(
    `/family/devices/${id}`
  );
  return response.data;
};
