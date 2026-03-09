export type TitleString =
  | '見習い冒険者'
  | '中級冒険者'
  | '熟練の戦士'
  | '伝説の勇者'
  | '神話の英雄';

/**
 * レベルに応じて称号を返す。
 * レベルが上がるほど取得しにくい対数的なシステムと連動。
 */
export function getTitleByLevel(level: number): TitleString {
  if (level >= 50) return '神話の英雄';
  if (level >= 20) return '伝説の勇者';
  if (level >= 10) return '熟練の戦士';
  if (level >= 5) return '中級冒険者';
  return '見習い冒険者';
}

/**
 * EXP から称号を返す（後方互換用）。
 * 新規コードでは getTitleByLevel を使うこと。
 */
export function getTitleByExp(exp: number): TitleString {
  if (exp >= 10000) return '神話の英雄';
  if (exp >= 3000) return '伝説の勇者';
  if (exp >= 1000) return '熟練の戦士';
  if (exp >= 300) return '中級冒険者';
  return '見習い冒険者';
}
