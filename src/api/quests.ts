import { apiClient } from "./client";
import type {
  SubmitQuestResponse,
  BonusQuestRequest,
  BonusQuestResponse,
  GetQuestsResponse,
} from "../types/api";

export interface UploadImageFile {
  uri: string;
  name: string;
  type: string;
}

export interface SubmitQuestParams {
  beforeImage: UploadImageFile;
  afterImage: UploadImageFile;
  subject?: string;
  topic?: string;
}

/**
 * POST /api/quests/submit
 * クエストを提出し、AI 分析・ポイント付与を行う。Child 専用。
 * Content-Type は multipart/form-data。
 * childId / familyId は JWT から取得されるため送付不要。
 *
 * 送信する FormData のキー:
 * - beforeImage
 * - afterImage
 * - subject (任意)
 * - topic (任意)
 *
 * childId / familyId は JWT から解決されるため送付しない。
 */
export const submitQuest = async (
  params: SubmitQuestParams
): Promise<SubmitQuestResponse> => {
  const formData = new FormData();

  formData.append("beforeImage", {
    uri: params.beforeImage.uri,
    name: params.beforeImage.name,
    type: params.beforeImage.type,
  } as unknown as Blob);

  formData.append("afterImage", {
    uri: params.afterImage.uri,
    name: params.afterImage.name,
    type: params.afterImage.type,
  } as unknown as Blob);

  if (params.subject) formData.append("subject", params.subject);
  if (params.topic) formData.append("topic", params.topic);

  const response = await apiClient.post<SubmitQuestResponse>(
    "/quests/submit",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

/**
 * POST /api/quests/:id/bonus
 * 親が指定クエストに追加ボーナスポイントを付与する。Parent 専用。
 */
export const addQuestBonus = async (
  questId: string,
  body: BonusQuestRequest
): Promise<BonusQuestResponse> => {
  const response = await apiClient.post<BonusQuestResponse>(
    `/quests/${questId}/bonus`,
    body
  );
  return response.data;
};

/**
 * GET /api/quests
 * 家族のクエスト一覧を取得する。Child / Parent 共通。
 */
export const getQuests = async (): Promise<GetQuestsResponse> => {
  const response = await apiClient.get<GetQuestsResponse>("/quests");
  return response.data;
};
