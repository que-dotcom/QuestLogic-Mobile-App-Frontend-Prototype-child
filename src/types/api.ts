// ============================================================
// QuestLogic API v3.0 型定義
// ============================================================

// ユーザーロール
export type UserRole = "CHILD" | "PARENT";

// ユーザー
export interface User {
  id: string;
  name: string;
  role: UserRole;
  familyId: string | null;
  level: number;
  exp: number;
  currentPoints: number;
  grade: string | null;
  specialty: string | null;
  avatarUrl: string | null;
}

// ============================================================
// 共通レスポンス
// ============================================================

export interface BaseResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============================================================
// 認証 / 開発用ログイン
// ============================================================

export interface LoginResponse extends BaseResponse {
  token: string;
  user: User;
}

export interface GoogleAuthRequest {
  idToken: string;
  role: UserRole;
}

// ============================================================
// Analyze API
// ============================================================

export interface ScoreBreakdown {
  volume: number;
  process: number;
  carefulness: number;
  review: number;
}

export interface AiFeature {
  type: string;
  location: string;
  description: string;
}

/** /api/analyze は success ラッパーなしで直接このオブジェクトを返す */
export interface AnalyzeResponse {
  summary: string;
  score_breakdown: ScoreBreakdown;
  total_score: number;
  features: AiFeature[];
  suspicion_flag: boolean;
  suspicion_reason: string | null;
  feedback_to_child: string;
  feedback_to_parent: string;
}

// ============================================================
// Users API
// ============================================================

export interface UpdateProfileRequest {
  grade?: string;
  specialty?: string;
  name?: string;
  avatarUrl?: string;
}

export interface UpdateProfileResponse extends BaseResponse {
  data: Pick<User, "id" | "grade" | "specialty" | "name" | "avatarUrl">;
}

export interface GetInviteCodeResponse extends BaseResponse {
  inviteCode: string;
}

export interface JoinFamilyRequest {
  inviteCode: string;
}

export interface JoinFamilyResponse extends BaseResponse {
  data: Pick<User, "id" | "familyId">;
}

export interface ConsumePointsRequest {
  consumePoints: number;
}

export interface ConsumePointsResponse extends BaseResponse {
  remainingPoints: number;
  remainingMinutes: number;
  minutesPerPoint: number;
}

// ============================================================
// Quests API
// ============================================================

export interface AiResult {
  score_breakdown: ScoreBreakdown;
  summary?: string;
  total_score?: number;
  features?: AiFeature[];
  suspicion_flag?: boolean;
  suspicion_reason?: string | null;
  feedback_to_child?: string;
  feedback_to_parent?: string;
}

export interface Quest {
  id: string;
  familyId: string;
  childId?: string;
  status: "COMPLETED" | "PENDING" | string;
  earnedPoints?: number;
  createdAt: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  subject?: string;
  aiResult?: AiResult;
  child?: {
    name: string;
    avatarUrl: string | null;
  };
}

export interface SubmitQuestResponse extends BaseResponse {
  isLevelUp: boolean;
  newLevel: number;
  data: Quest & { aiResult: AiResult };
  earnedPoints: number;
  earnedMinutes: number;
  currentPoints: number;
  currentMinutes: number;
  minutesPerPoint: number;
}

export interface BonusQuestRequest {
  bonusPoints: number;
}

export interface BonusQuestResponse extends BaseResponse {
  earnedPoints: number;
  earnedMinutes: number;
  currentPoints: number;
  currentMinutes: number;
  minutesPerPoint: number;
}

export interface GetQuestsResponse extends BaseResponse {
  data: Quest[];
}

// ============================================================
// Family API
// ============================================================

export interface FamilySettings {
  familyId: string;
  minutesPerPoint: number;
  updatedAt: string;
}

export interface GetFamilySettingsResponse extends BaseResponse {
  familyId: string;
  minutesPerPoint: number;
  updatedAt: string;
}

export interface UpdateFamilySettingsRequest {
  minutesPerPoint: number;
}

export interface UpdateFamilySettingsResponse extends BaseResponse {
  minutesPerPoint: number;
  updatedAt: string;
}

export interface GameStatusResponse extends BaseResponse {
  gameRemainingMinutes: number;
  smartphoneRemainingMinutes: number;
  isForceLocked: boolean;
}

export interface FamilyLockRequest {
  locked: boolean;
}

export interface FamilyLockResponse extends BaseResponse {
  locked: boolean;
}

export interface NgSettings {
  missingProcess: boolean;
  workTimeMismatch: boolean;
  imageReuse: boolean;
}

export interface AiSettings {
  strictness: number;
  focus: number;
  ng: NgSettings;
}

export interface GetAiSettingsResponse extends BaseResponse {
  data: AiSettings;
}

export interface UpdateAiSettingsRequest {
  strictness?: number;
  focus?: number;
  ng?: Partial<NgSettings>;
}

export interface UpdateAiSettingsResponse extends BaseResponse {
  data: AiSettings;
}

export interface Device {
  id: string;
  name: string;
}

export interface GetDevicesResponse extends BaseResponse {
  data: Device[];
}
