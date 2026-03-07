import { apiClient } from "./client";
import type { AnalyzeResponse } from "../types/api";

/**
 * POST /api/analyze
 * Before / After 画像を AI 分析する。JWT 必須。
 * レスポンスは success ラッパーなしで AnalyzeResponse を直接返す。
 *
 * @param beforeImage 分析前の画像ファイル
 * @param afterImage  分析後の画像ファイル
 * @param metadata    任意の追加情報（JSON 文字列）
 */
export const analyzeImages = async (params: {
  beforeImage: {
    uri: string;
    name: string;
    type: string;
  };
  afterImage: {
    uri: string;
    name: string;
    type: string;
  };
  metadata?: string;
}): Promise<AnalyzeResponse> => {
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

  if (params.metadata) {
    formData.append("metadata", params.metadata);
  }

  // AnalyzeResponse は success ラッパーなしで直接返却される
  const response = await apiClient.post<AnalyzeResponse>("/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
