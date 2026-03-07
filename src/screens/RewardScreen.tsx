import React, { useState } from 'react';
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

/** CustomTabBar の高さと合わせる */
const TAB_BAR_HEIGHT = 83;

type Subject = '国語' | '数学' | '社会' | '理科' | '英語';

interface RewardItem {
  id: string;
  subject: Subject;
  grade: string;
  homeworkName: string;
  timestamp: Date;
  exp: string;
}

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
        {/* 修正3: 括弧を赤、内側テキストを白に色分け */}
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
  const toggle = () => setIsExpanded(v => !v);

  return (
    <ImageBackground
      source={require('../../asset/reward/images/background screen.png')}
      style={styles.screenBackground}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {isExpanded ? (
          // ── 展開ビュー: リストが画面全体を占有 ──
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
          // ── 通常ビュー: ボタン + タイトル + リスト ──
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 修正1: ImageBackground+AppText の二重構造を廃止し Image 単体に変更 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => console.log('AIアドバイスボタンがタップされました')}
              style={styles.aiButtonWrapper}
            >
              <Image
                source={require('../../asset/reward/images/Button M.png')}
                style={styles.aiButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <AppText style={styles.screenTitle}>リワード一覧表</AppText>

            {/* 修正2: backgroundColor を不透過グレーに設定 */}
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

  // 通常ビュー
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: TAB_BAR_HEIGHT + 16,
  },

  // ボタン幅を Dimensions で算出した固定値にすることで ScrollView 内でも正確に描画
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

  // 修正2: 不透過グレー背景
  listContainer: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    padding: 20,
  },

  // 展開ビュー
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

  // ヘッダー行
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
  // 修正3: 括弧は赤、内側テキストは白
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

  separator: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    marginVertical: 12,
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
