import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;
/** Figma寸法 291×96 に合わせ、画面幅の75%をボタン幅として固定 */
const AI_BUTTON_WIDTH = Math.round(SCREEN_WIDTH * 0.75);
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import { formatTimeAgo } from '../utils/timeHelper';
import { useAdvice } from '../context/AdviceContext';
import { useAuth } from '../context/AuthContext';
import type { RewardHistoryEntry } from '../context/AdviceContext';
import { getQuests } from '../api/quests';
import { getApiErrorMessage } from '../api/client';
import type { Quest } from '../types/api';

/** CustomTabBar の高さと合わせる */
const TAB_BAR_HEIGHT = 83;

// ──────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────

interface RewardItem {
  id: string;
  subject: string;
  grade: string;
  homeworkName: string;
  timestamp: Date;
  rewardText: string;
}

// ──────────────────────────────────────────
// 定数
// ──────────────────────────────────────────

const SUBJECT_ICONS: Record<'国語' | '数学' | '社会' | '理科' | '英語', ImageSourcePropType> = {
  国語: require('../../asset/reward/images/national_language.png'),
  数学: require('../../asset/reward/images/mathematics.png'),
  社会: require('../../asset/reward/images/society.png'),
  理科: require('../../asset/reward/images/science.png'),
  英語: require('../../asset/reward/images/english.png'),
};

const FALLBACK_GRADE = '学年未設定';
const EMPTY_ADVICE_TEXT = 'まだAIアドバイスはありません。';
const EMPTY_HISTORY_TEXT = 'まだ履歴がありません。';
const HISTORY_LOADING_TEXT = 'リワード履歴を読み込み中です。';
const DEFAULT_SUBJECT_ICON = require('../../asset/reward/images/national_language.png');

// ──────────────────────────────────────────
// AIアドバイス: 実データ表示用ヘルパー
// ──────────────────────────────────────────

/**
 * 1行あたりの文字数。バックエンドから受け取った長文を
 * 罫線ノート風に等幅で折り返すために使用する。
 */
const ADVICE_CHARS_PER_LINE = 20;

/** 長文を `charsPerLine` 文字ごとに分割して配列で返す */
function splitTextToLines(text: string, charsPerLine = ADVICE_CHARS_PER_LINE): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += charsPerLine) {
    lines.push(text.slice(i, i + charsPerLine));
  }
  return lines;
}

function getSubjectIcon(subject?: string): ImageSourcePropType {
  if (!subject) return DEFAULT_SUBJECT_ICON;
  if (subject.includes('数学') || subject.includes('算数')) return SUBJECT_ICONS.数学;
  if (subject.includes('理科')) return SUBJECT_ICONS.理科;
  if (subject.includes('社会')) return SUBJECT_ICONS.社会;
  if (subject.includes('英語')) return SUBJECT_ICONS.英語;
  if (subject.includes('国語')) return SUBJECT_ICONS.国語;
  return DEFAULT_SUBJECT_ICON;
}

function toRewardText(earnedPoints?: number): string {
  if (typeof earnedPoints !== 'number' || Number.isNaN(earnedPoints)) {
    return '--';
  }
  return `+${earnedPoints}PT`;
}

function mapHistoryEntryToRewardItem(entry: RewardHistoryEntry, grade: string): RewardItem {
  return {
    id: entry.id,
    subject: entry.subject,
    grade,
    homeworkName: entry.topic,
    timestamp: new Date(entry.createdAt),
    rewardText: toRewardText(entry.earnedPoints),
  };
}

function mapQuestToRewardItem(
  quest: Quest,
  grade: string,
  historyEntry?: RewardHistoryEntry
): RewardItem | null {
  const subject = historyEntry?.subject ?? quest.subject;
  const topic = historyEntry?.topic ?? quest.topic;

  if (quest.status !== 'COMPLETED') {
    return null;
  }

  if (!subject || !subject.trim()) {
    return null;
  }

  return {
    id: quest.id,
    subject,
    grade,
    homeworkName: topic && topic.trim() ? topic.trim() : '宿題名未設定',
    timestamp: new Date(quest.createdAt),
    rewardText: toRewardText(quest.earnedPoints ?? historyEntry?.earnedPoints),
  };
}

function getQuestAdviceText(quest?: Quest): string | null {
  const adviceText = quest?.aiResult?.feedback_to_child ?? quest?.aiResult?.summary ?? null;

  if (!adviceText || !adviceText.trim()) {
    return null;
  }

  return adviceText.trim();
}

// ──────────────────────────────────────────
// リストヘッダー コンポーネント
// ──────────────────────────────────────────

function ListHeader({
  isExpanded,
  onToggle,
}: {
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.listHeader}>
      <Image
        source={require('../../asset/reward/images/Level_bar.png')}
        style={styles.levelBarImage}
        resizeMode="contain"
      />
      <AppText style={styles.levelText}>あと+10EXPでLv.2</AppText>
      <TouchableOpacity activeOpacity={0.7} onPress={onToggle}>
        <AppText style={styles.moreLinkBracket}>
          {'['}
          <AppText style={styles.moreLinkInner}>
            {isExpanded ? '小さくする' : 'もっと見る'}
          </AppText>
          {']'}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

// ──────────────────────────────────────────
// 履歴アイテム コンポーネント
// ──────────────────────────────────────────

function RewardListItem({
  item,
  onPress,
}: {
  item: RewardItem;
  onPress: () => void;
}) {
  const iconSource = getSubjectIcon(item.subject);
  const timeText = formatTimeAgo(item.timestamp);

  return (
    <TouchableOpacity style={itemStyles.row} onPress={onPress} activeOpacity={0.75}>
      <Image
        source={iconSource}
        style={itemStyles.subjectIcon}
        resizeMode="contain"
      />
      <View style={itemStyles.textBlock}>
        <AppText style={itemStyles.mainText}>
          {item.grade}：{item.homeworkName}
        </AppText>
        <AppText style={itemStyles.timeText}>{timeText}</AppText>
      </View>
      <View style={itemStyles.expBlock}>
        <AppText style={itemStyles.expText}>{item.rewardText}</AppText>
        <View style={itemStyles.expDivider} />
      </View>
    </TouchableOpacity>
  );
}

// ──────────────────────────────────────────
// メイン画面
// ──────────────────────────────────────────

export default function RewardScreen() {
  const { user } = useAuth();
  const userGrade = user?.grade ?? FALLBACK_GRADE;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);
  /** アドバイス画面を開いた時点で新着だった場合のみ true → att.png を表示 */
  const [showAttIcon, setShowAttIcon] = useState(false);
  const [selectedRewardItemId, setSelectedRewardItemId] = useState<string | null>(null);
  const [questHistory, setQuestHistory] = useState<Quest[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyErrorMessage, setHistoryErrorMessage] = useState<string | null>(null);

  const {
    hasNewAdvice,
    setHasNewAdvice,
    openAdviceDirectly,
    setOpenAdviceDirectly,
    latestAdviceText,
    rewardHistory,
  } = useAdvice();

  /**
   * CameraScreen の Button M から直接遷移してきた場合、
   * openAdviceDirectly が true に変わった瞬間にアドバイス画面を開く。
   * Bottom Tab Navigator ではスクリーンがアンマウントされないため
   * useEffect の依存変化で確実に検知できる。
   */
  useEffect(() => {
    if (openAdviceDirectly) {
      setIsExpanded(false);
      setShowAdvice(true);
      setShowAttIcon(true);
      setSelectedRewardItemId(null);
      setOpenAdviceDirectly(false);
      setHasNewAdvice(false); // 既読化
    }
  }, [openAdviceDirectly, setHasNewAdvice, setOpenAdviceDirectly]);

  const questMap = useMemo(() => {
    return new Map(questHistory.map((quest) => [quest.id, quest]));
  }, [questHistory]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadQuestHistory = async () => {
        setIsHistoryLoading(true);
        setHistoryErrorMessage(null);

        try {
          const response = await getQuests();
          if (!isActive) return;
          setQuestHistory(response.data ?? []);
        } catch (error) {
          if (!isActive) return;
          setHistoryErrorMessage(
            getApiErrorMessage(error, 'リワード履歴を取得できませんでした。')
          );
        } finally {
          if (isActive) {
            setIsHistoryLoading(false);
          }
        }
      };

      void loadQuestHistory();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const latestQuestWithAdvice = useMemo(() => {
    return [...questHistory]
      .filter((quest) => getQuestAdviceText(quest))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [questHistory]);

  const latestQuestAdviceText = useMemo(() => {
    return getQuestAdviceText(latestQuestWithAdvice);
  }, [latestQuestWithAdvice]);

  const rewardItems = useMemo(() => {
    const historyMap = new Map(rewardHistory.map((entry) => [entry.id, entry]));
    const apiItems = questHistory
      .map((quest) => mapQuestToRewardItem(quest, userGrade, historyMap.get(quest.id)))
      .filter((item): item is RewardItem => item !== null);
    const apiIds = new Set(questHistory.map((quest) => quest.id));
    const localOnlyItems = rewardHistory
      .filter((entry) => !apiIds.has(entry.id))
      .map((entry) => mapHistoryEntryToRewardItem(entry, userGrade));

    return [...apiItems, ...localOnlyItems].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }, [questHistory, rewardHistory, userGrade]);

  const selectedRewardItem = useMemo(() => {
    if (!selectedRewardItemId) {
      return null;
    }

    return rewardItems.find((item) => item.id === selectedRewardItemId) ?? null;
  }, [rewardItems, selectedRewardItemId]);

  const selectedQuest = useMemo(() => {
    if (!selectedRewardItemId) {
      return null;
    }

    return questMap.get(selectedRewardItemId) ?? null;
  }, [questMap, selectedRewardItemId]);

  const latestAdviceTimestamp = useMemo(() => {
    if (latestQuestWithAdvice?.createdAt) {
      return latestQuestWithAdvice.createdAt;
    }

    return rewardItems[0]?.timestamp ?? null;
  }, [latestQuestWithAdvice, rewardItems]);

  const selectedAdviceTimestamp = useMemo(() => {
    if (selectedQuest?.createdAt) {
      return selectedQuest.createdAt;
    }

    return selectedRewardItem?.timestamp ?? null;
  }, [selectedQuest, selectedRewardItem]);

  const displayedAdviceTimestamp = selectedRewardItemId
    ? selectedAdviceTimestamp
    : latestAdviceTimestamp;

  const adviceDateLabel = useMemo(() => {
    if (!displayedAdviceTimestamp) {
      return '履歴なし';
    }

    return formatTimeAgo(displayedAdviceTimestamp);
  }, [displayedAdviceTimestamp]);

  const adviceText = useMemo(() => {
    if (selectedRewardItemId) {
      return getQuestAdviceText(selectedQuest ?? undefined) ?? EMPTY_ADVICE_TEXT;
    }

    if (latestAdviceText && latestAdviceText.trim()) {
      return latestAdviceText.trim();
    }
    if (latestQuestAdviceText) {
      return latestQuestAdviceText;
    }
    return EMPTY_ADVICE_TEXT;
  }, [latestAdviceText, latestQuestAdviceText, selectedQuest, selectedRewardItemId]);

  /** adviceText を 20 文字ずつに分割した行配列 */
  const adviceLines = useMemo(() => splitTextToLines(adviceText), [adviceText]);

  const previewRewardItems = useMemo(() => rewardItems.slice(0, 5), [rewardItems]);

  const toggle = () => setIsExpanded(v => !v);

  const handleOpenAdvice = () => {
    const isNew = hasNewAdvice;
    setIsExpanded(false);
    setShowAdvice(true);
    setShowAttIcon(isNew);
    setSelectedRewardItemId(null);
    if (isNew) {
      setHasNewAdvice(false); // 既読化
    }
  };

  const handleOpenHistoryAdvice = (item: RewardItem) => {
    setIsExpanded(false);
    setSelectedRewardItemId(item.id);
    setShowAdvice(true);
    setShowAttIcon(false);
  };

  const handleCloseAdvice = () => {
    setShowAdvice(false);
    setShowAttIcon(false);
    setSelectedRewardItemId(null);
  };

  const renderPreviewRewards = () => {
    if (previewRewardItems.length > 0) {
      return previewRewardItems.map((item, index) => (
        <View key={item.id}>
          {index > 0 && <View style={styles.separator} />}
          <RewardListItem item={item} onPress={() => handleOpenHistoryAdvice(item)} />
        </View>
      ));
    }

    if (isHistoryLoading) {
      return <AppText style={styles.infoText}>{HISTORY_LOADING_TEXT}</AppText>;
    }

    if (historyErrorMessage) {
      return <AppText style={styles.infoText}>{historyErrorMessage}</AppText>;
    }

    return <AppText style={styles.infoText}>{EMPTY_HISTORY_TEXT}</AppText>;
  };

  return (
    <ImageBackground
      source={require('../../asset/reward/images/background_screen.png')}
      style={styles.screenBackground}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

        {showAdvice ? (
          // ── AI アドバイスビュー ──────────────────────────────────────────
          // 「戻る」ボタンのみ position:absolute で固定し、
          // [今日] + att.png + 本文はすべて ScrollView 内でスクロールする。
          <View style={styles.adviceContainer}>

            {/* 画面全体をカバーするスクロール領域 */}
            <ScrollView
              style={styles.adviceScroll}
              contentContainerStyle={styles.adviceScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* [今日] + att.png（スクロールする）。att.png は新着時のみ表示 */}
              <View style={styles.adviceDateRow}>
                <AppText style={styles.adviceTodayBracket}>[</AppText>
                <AppText style={styles.adviceTodayLabel}>{adviceDateLabel}</AppText>
                <AppText style={styles.adviceTodayBracket}>]</AppText>
                {showAttIcon && (
                  <Image
                    source={require('../../asset/reward/images/att.png')}
                    style={styles.adviceAttIcon}
                    resizeMode="contain"
                  />
                )}
              </View>

              {/* AIアシスタントアイコン（最上部左端） */}
              <Image
                source={require('../../asset/reward/images/AI.png')}
                style={styles.adviceAiIcon}
                resizeMode="contain"
              />

              {/* テキスト行（20文字ごとに分割） */}
              {adviceLines.map((line, index) => (
                <View key={index} style={styles.adviceLineWrapper}>
                  <AppText style={styles.adviceLineText}>{line}</AppText>
                  <View style={styles.adviceDashedLine} />
                </View>
              ))}
            </ScrollView>

            {/* 戻るボタン（スクロールに関わらず右上に固定） */}
            <TouchableOpacity
              style={styles.adviceBackBtn}
              onPress={handleCloseAdvice}
              activeOpacity={0.8}
            >
              <ImageBackground
                source={require('../../asset/reward/images/Button_W.png')}
                style={styles.adviceBackBtnBg}
                resizeMode="stretch"
              >
                <AppText style={styles.adviceBackBtnText}></AppText>
              </ImageBackground>
            </TouchableOpacity>
          </View>

        ) : isExpanded ? (
          // ── 展開ビュー: リストが画面全体を占有 ──────────────────────────
          <View style={styles.expandedContainer}>
            <View style={styles.listContainerExpanded}>
              <ListHeader isExpanded onToggle={toggle} />
              {isHistoryLoading ? (
                <AppText style={styles.infoText}>{HISTORY_LOADING_TEXT}</AppText>
              ) : historyErrorMessage ? (
                <AppText style={styles.infoText}>{historyErrorMessage}</AppText>
              ) : (
                <FlatList
                  data={rewardItems}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <RewardListItem item={item} onPress={() => handleOpenHistoryAdvice(item)} />
                  )}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  contentContainerStyle={styles.flatListContent}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <AppText style={styles.infoText}>{EMPTY_HISTORY_TEXT}</AppText>
                  }
                />
              )}
            </View>
          </View>

        ) : (
          // ── 通常ビュー: ボタン + タイトル + リスト ──────────────────────
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenAdvice}
              style={styles.aiButtonWrapper}
            >
              <Image
                source={
                  hasNewAdvice
                    ? require('../../asset/reward/images/Button_M2.png')
                    : require('../../asset/reward/images/Button_M.png')
                }
                style={styles.aiButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <AppText style={styles.screenTitle}>リワード一覧表</AppText>

            <View style={styles.listContainer}>
              <ListHeader isExpanded={false} onToggle={toggle} />
              {renderPreviewRewards()}
            </View>
          </ScrollView>
        )}

      </SafeAreaView>
    </ImageBackground>
  );
}

// ──────────────────────────────────────────
// スタイル
// ──────────────────────────────────────────

const styles = StyleSheet.create({
  screenBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // ── 通常ビュー ──────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: TAB_BAR_HEIGHT + 16,
  },
  aiButtonWrapper: {
    alignSelf: 'center',
    width: AI_BUTTON_WIDTH,
  },
  aiButtonImage: {
    width: AI_BUTTON_WIDTH,
    height: Math.round(AI_BUTTON_WIDTH / (291 / 96)),
  },
  screenTitle: {
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 16,
  },
  listContainer: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    padding: 20,
  },

  // ── 展開ビュー ──────────────────────────────────────────────────────────
  expandedContainer: {
    flex: 1,
    paddingHorizontal: 7,
    paddingTop: 14,
    paddingBottom: TAB_BAR_HEIGHT,
  },
  listContainerExpanded: {
    flex: 1,
    backgroundColor: '#282828',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    padding: 20,
  },
  flatListContent: {
    paddingBottom: 40,
  },
  infoText: {
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 1,
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // ── リストヘッダー共通 ───────────────────────────────────────────────────
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBarImage: {
    width: 85,
    height: 18,
    marginRight: 8,
  },
  levelText: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 1,
  },
  moreLinkBracket: {
    fontSize: 14,
    color: '#ff4444',
    letterSpacing: 1,
  },
  moreLinkInner: {
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 1,
  },

  // ── セパレータ共通 ───────────────────────────────────────────────────────
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    marginVertical: 12,
  },

  // ── AIアドバイスビュー ───────────────────────────────────────────────────
  adviceContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    // 子の position:absolute（戻るボタン）の基準点
    position: 'relative',
  },

  // 画面全体をカバーするスクロール
  adviceScroll: {
    flex: 1,
  },
  adviceScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: TAB_BAR_HEIGHT + 16,
  },

  // [今日] + att.png 行（スクロールする）
  // 戻るボタンは position:absolute なのでフロー計算に影響しない → paddingRight なしで真中央に揃う
  adviceDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 18,
    gap: 4,
  },
  adviceTodayBracket: {
    fontSize: 20,
    color: '#ff4444',
    letterSpacing: 1,
  },
  adviceTodayLabel: {
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: 1,
  },
  adviceAttIcon: {
    width: 18,
    height: 18,
    marginLeft: 4,
  },

  // AIアイコン（最上部左端）
  adviceAiIcon: {
    width: 28,
    height: 28,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },

  // テキスト行 + 点線ラッパー
  adviceLineWrapper: {
    paddingTop: 10,
  },
  adviceLineText: {
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 22,
  },
  adviceDashedLine: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#555555',
    marginTop: 10,
  },

  // 戻るボタン（右上に固定）
  adviceBackBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    width: 99,
    height: 33,
  },
  // ImageBackground がボタン画像を描画し、子の AppText をオーバーレイ
  adviceBackBtnBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceBackBtnText: {
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 1,
  },
});

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
    gap: 8,
  },
  subjectIcon: {
    width: 22,
    height: 22,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  mainText: {
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.96,
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  expBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expText: {
    fontSize: 12,
    color: '#ffffff',
    letterSpacing: 0.72,
  },
  expDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
