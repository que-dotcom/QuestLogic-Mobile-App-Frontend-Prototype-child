import React, { useState, useMemo, useEffect } from 'react';
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

const SCREEN_WIDTH = Dimensions.get('window').width;
/** Figma寸法 291×96 に合わせ、画面幅の75%をボタン幅として固定 */
const AI_BUTTON_WIDTH = Math.round(SCREEN_WIDTH * 0.75);
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import { formatTimeAgo } from '../utils/timeHelper';
import { useAdvice } from '../context/AdviceContext';

/** CustomTabBar の高さと合わせる */
const TAB_BAR_HEIGHT = 83;

// ──────────────────────────────────────────
// 型定義
// ──────────────────────────────────────────

type Subject = '国語' | '数学' | '社会' | '理科' | '英語';

interface RewardItem {
  id: string;
  subject: Subject;
  grade: string;
  homeworkName: string;
  timestamp: Date;
  exp: string;
}

// ──────────────────────────────────────────
// 定数
// ──────────────────────────────────────────

const SUBJECT_ICONS: Record<Subject, ImageSourcePropType> = {
  国語: require('../../asset/reward/images/national language.png'),
  数学: require('../../asset/reward/images/mathematics.png'),
  社会: require('../../asset/reward/images/society.png'),
  理科: require('../../asset/reward/images/science.png'),
  英語: require('../../asset/reward/images/english.png'),
};

/** ダミーデータ: timestampはモジュールロード時の現在時刻からの相対値 */
const buildDummyRewards = (): RewardItem[] => {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  return [
    { id: '1',  subject: '理科', grade: '6年', homeworkName: 'てこのはたらき',       timestamp: hoursAgo(23), exp: '+15EXP' },
    { id: '2',  subject: '国語', grade: '6年', homeworkName: '竹取物語',             timestamp: daysAgo(2),  exp: '+10EXP' },
    { id: '3',  subject: '社会', grade: '6年', homeworkName: '日本国憲法',           timestamp: daysAgo(3),  exp: '+10EXP' },
    { id: '4',  subject: '英語', grade: '6年', homeworkName: '過去形',               timestamp: daysAgo(5),  exp: '+20EXP' },
    { id: '5',  subject: '数学', grade: '6年', homeworkName: '並べ方と組み合わせ方', timestamp: daysAgo(5),  exp: '+10EXP' },
    { id: '6',  subject: '国語', grade: '6年', homeworkName: '漢字50問テスト',       timestamp: daysAgo(6),  exp: '+15EXP' },
    { id: '7',  subject: '英語', grade: '6年', homeworkName: '単語練習',             timestamp: daysAgo(7),  exp: '+10EXP' },
    { id: '8',  subject: '理科', grade: '6年', homeworkName: '月と太陽の位置関係',   timestamp: daysAgo(8),  exp: '+10EXP' },
    { id: '9',  subject: '社会', grade: '6年', homeworkName: '江戸幕府の終わり',     timestamp: daysAgo(9),  exp: '+20EXP' },
    { id: '10', subject: '数学', grade: '6年', homeworkName: '分数のかけ算',         timestamp: daysAgo(10), exp: '+10EXP' },
    { id: '11', subject: '国語', grade: '6年', homeworkName: '俳句の世界',           timestamp: daysAgo(12), exp: '+10EXP' },
    { id: '12', subject: '社会', grade: '6年', homeworkName: '縄文時代と弥生時代',   timestamp: daysAgo(14), exp: '+15EXP' },
  ];
};

const DUMMY_REWARDS = buildDummyRewards();

// ──────────────────────────────────────────
// AIアドバイス: バックエンドAPI想定ダミーデータ & テキスト分割
// ──────────────────────────────────────────

/** バックエンドから受け取るJSONレスポンスの型 */
type AdviceApiResponse = {
  adviceText: string;
};

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
        source={require('../../asset/reward/images/Level bar.png')}
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

function RewardListItem({ item }: { item: RewardItem }) {
  const iconSource = SUBJECT_ICONS[item.subject];
  const timeText = formatTimeAgo(item.timestamp);

  return (
    <View style={itemStyles.row}>
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
        <AppText style={itemStyles.expText}>{item.exp}</AppText>
        <View style={itemStyles.expDivider} />
      </View>
    </View>
  );
}

// ──────────────────────────────────────────
// メイン画面
// ──────────────────────────────────────────

export default function RewardScreen() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);
  /** アドバイス画面を開いた時点で新着だった場合のみ true → att.png を表示 */
  const [showAttIcon, setShowAttIcon] = useState(false);

  const { hasNewAdvice, setHasNewAdvice, openAdviceDirectly, setOpenAdviceDirectly } = useAdvice();

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
      setOpenAdviceDirectly(false);
      setHasNewAdvice(false); // 既読化
    }
  }, [openAdviceDirectly]);

  /**
   * バックエンドAPIから受け取ることを想定したダミーデータ。
   * 将来的には fetch / SWR 等で取得した値を setAdviceApiData に渡す。
   */
  const [adviceApiData] = useState<AdviceApiResponse>({
    adviceText:
      '〇〇さん、宿題お疲れ様でした！とても丁寧に字を書いていて、先生は感心しましたよ。' +
      'ほとんどの問題に取り組めていて、頑張った証拠ですね。' +
      '特に、問題2の①や問題3の①のように、Xを使った式を正しく作れているところは、' +
      'よく理解できている証拠です。素晴らしい！' +
      'ただ、いくつか気を付けてほしいことがあります。' +
      '問題1の③と④は、少し難しかったかな？' +
      '文章をもう一度よく読んで、何が聞かれているのか、' +
      'どんな式になるのかをじっくり考えてみましょう。' +
      'もし分からなくても、途中で考えたことやメモを書いてくれると、' +
      '先生は〇〇さんがどこでつまずいているのかを理解して、' +
      'もっと良いアドバイスができます。' +
      'それから、問題2の②や問題3の②のように、' +
      '答えを出す計算の途中の式も、忘れずに書くようにしてください。' +
      '次からはぜひ意識してやってみましょうね。' +
      '〇〇さんの努力がよく見えるので、' +
      'おうちの方も「大切だよ」と言っていたことなので、',
  });

  /** adviceText を 20 文字ずつに分割した行配列 */
  const adviceLines = useMemo(
    () => splitTextToLines(adviceApiData.adviceText),
    [adviceApiData.adviceText],
  );

  const toggle = () => setIsExpanded(v => !v);

  const handleOpenAdvice = () => {
    const isNew = hasNewAdvice;
    setIsExpanded(false);
    setShowAdvice(true);
    setShowAttIcon(isNew);
    if (isNew) {
      setHasNewAdvice(false); // 既読化
    }
  };

  const handleCloseAdvice = () => {
    setShowAdvice(false);
    setShowAttIcon(false);
  };

  return (
    <ImageBackground
      source={require('../../asset/reward/images/background screen.png')}
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
                <AppText style={styles.adviceTodayLabel}>今日</AppText>
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
              <Image
                source={require('../../asset/reward/images/Button W.png')}
                style={styles.adviceBackBtnImage}
                resizeMode="stretch"
              />
              <AppText style={styles.adviceBackBtnText}>戻る ＞</AppText>
            </TouchableOpacity>
          </View>

        ) : isExpanded ? (
          // ── 展開ビュー: リストが画面全体を占有 ──────────────────────────
          <View style={styles.expandedContainer}>
            <View style={styles.listContainerExpanded}>
              <ListHeader isExpanded onToggle={toggle} />
              <FlatList
                data={DUMMY_REWARDS}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <RewardListItem item={item} />}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={false}
              />
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
                    ? require('../../asset/reward/images/Button M2.png')
                    : require('../../asset/reward/images/Button M.png')
                }
                style={styles.aiButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <AppText style={styles.screenTitle}>リワード一覧表</AppText>

            <View style={styles.listContainer}>
              <ListHeader isExpanded={false} onToggle={toggle} />
              {DUMMY_REWARDS.slice(0, 5).map((item, index) => (
                <View key={item.id}>
                  {index > 0 && <View style={styles.separator} />}
                  <RewardListItem item={item} />
                </View>
              ))}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Button W.png を明示的な寸法で配置（absoluteFillObject では枠線がズレるため個別指定）
  adviceBackBtnImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 99,
    height: 33,
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
