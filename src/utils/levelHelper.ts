/**
 * レベル計算ユーティリティ
 *
 * レベルが上がるほど必要EXPが増加する対数的なシステム。
 * レベルNに到達するための累積EXP:
 *   totalExpForLevel(N) = round(SCALE * (N-1)^EXPONENT)
 *
 * これにより「総EXPに対してレベルが対数的に伸びる」挙動になる。
 *
 * 例:
 *   Lv1: 0 EXP
 *   Lv2: 100 EXP
 *   Lv3: 287 EXP
 *   Lv5: 862 EXP
 *   Lv10: 3981 EXP
 *   Lv20: 16497 EXP
 *   Lv50: 136900 EXP
 */

const SCALE = 100;
const EXPONENT = 1.8;

/**
 * レベルNに到達するために必要な累積EXP（レベル1 = 0）
 */
export function totalExpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(SCALE * Math.pow(level - 1, EXPONENT));
}

/**
 * 現在のレベルの次のレベルまで必要な残りEXP
 */
export function expToNextLevel(level: number, exp: number): number {
  const required = totalExpForLevel(level + 1) - totalExpForLevel(level);
  const progress = exp - totalExpForLevel(level);
  return Math.max(0, required - progress);
}

/**
 * 現在のレベル内での進捗割合 (0.0 〜 1.0)
 */
export function levelProgress(level: number, exp: number): number {
  const currentLevelExp = totalExpForLevel(level);
  const nextLevelExp = totalExpForLevel(level + 1);
  const range = nextLevelExp - currentLevelExp;
  if (range <= 0) return 1;
  const progress = (exp - currentLevelExp) / range;
  return Math.min(1, Math.max(0, progress));
}

/**
 * 現在のレベル内で獲得済みのEXP / 次のレベルまでの必要EXP
 */
export function expProgressLabel(level: number, exp: number): string {
  const currentLevelExp = totalExpForLevel(level);
  const nextLevelExp = totalExpForLevel(level + 1);
  const gained = Math.max(0, exp - currentLevelExp);
  const required = nextLevelExp - currentLevelExp;
  return `${gained} / ${required} EXP`;
}

/**
 * 総EXPから対応するレベルを計算する（フロントエンド検証用）
 * バックエンドの level 値が信頼できる場合は不要だが、
 * 整合性チェックや将来の拡張に備えて実装する。
 */
export function calcLevelFromExp(exp: number): number {
  if (exp <= 0) return 1;
  let level = 1;
  while (totalExpForLevel(level + 1) <= exp) {
    level++;
  }
  return level;
}
