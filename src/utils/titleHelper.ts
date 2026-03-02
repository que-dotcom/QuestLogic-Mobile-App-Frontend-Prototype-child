export type TitleString =
  | '見習い冒険者'
  | '中級冒険者'
  | '熟練の戦士'
  | '伝説の勇者'
  | '神話の英雄';

/**
 * 経験値(EXP)に応じて称号を返すヘルパー関数。
 * 将来的にサーバーからのEXP取得や計算ロジックの変更に対応するため、
 * 称号ロジックをここに集約している。
 */
export function getTitleByExp(exp: number): TitleString {
  if (exp >= 10000) return '神話の英雄';
  if (exp >= 3000) return '伝説の勇者';
  if (exp >= 1000) return '熟練の戦士';
  if (exp >= 300) return '中級冒険者';
  return '見習い冒険者';
}
