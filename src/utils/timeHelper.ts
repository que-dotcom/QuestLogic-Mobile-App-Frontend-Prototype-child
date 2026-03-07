/**
 * 過去の日時と現在時刻の差を、日本語で分かりやすい文字列にフォーマットする。
 * - 1時間未満: 「〇〇分前」
 * - 24時間未満: 「〇〇時間前」
 * - 1日: 「きのう」
 * - 2日: 「おととい」
 * - 3日以上: 「〇日前」
 */
export function formatTimeAgo(timestamp: Date | string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 60) {
    return `${diffMin}分前`;
  } else if (diffHour < 24) {
    return `${diffHour}時間前`;
  } else if (diffDay === 1) {
    return 'きのう';
  } else if (diffDay === 2) {
    return 'おととい';
  } else {
    return `${diffDay}日前`;
  }
}
