import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AppText from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../navigation/AppNavigator';
import { getTitleByExp } from '../utils/titleHelper';
import HeaderProfile from '../components/HeaderProfile';
import StatusBars from '../components/StatusBars';
import TimeDisplay from '../components/TimeDisplay';
import MainActionArea from '../components/MainActionArea';

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

interface Homework {
  id: string;
  label: string;
}

const INITIAL_HOMEWORK: Homework[] = [
  { id: '1', label: '中1数学：文字と式' },
  { id: '2', label: '小6国語：漢字ドリル' },
  { id: '3', label: '中1歴史：歴史' },
];

export default function HomeScreen({ navigation }: Props) {
  const [hasHomework, setHasHomework] = useState(false);
  const [gameLimitMin] = useState(60);
  const [smartphoneLimitMin] = useState(60);
  const [level] = useState(1);
  const [exp] = useState(3000);
  const [userName] = useState('匿名さん');
  const [homeworkList] = useState<Homework[]>(INITIAL_HOMEWORK);

  const title = getTitleByExp(exp);

  const handleRegisterPress = () => {
    navigation.navigate('Camera');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* A. ヘッダー（プロフィール） */}
        <HeaderProfile title={title} userName={userName} />

        {/* B. ステータスバー（HP/MP風ゲージ） */}
        <StatusBars level={level} />

        {/* C. 制限時間・ステータス表示 */}
        <TimeDisplay
          gameLimitMin={gameLimitMin}
          smartphoneLimitMin={smartphoneLimitMin}
          level={level}
        />

        {/* D. メインエリア（地図/スクロール領域） */}
        <MainActionArea
          hasHomework={hasHomework}
          homeworkList={homeworkList}
          onRegisterPress={handleRegisterPress}
        />

        {/* 開発用: 宿題登録状態の切り替えボタン */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.devToggle}
            onPress={() => setHasHomework((prev) => !prev)}
          >
            <AppText style={styles.devToggleText}>
              [DEV] 宿題状態: {hasHomework ? 'あり' : 'なし'}
            </AppText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  devToggle: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#333344',
    borderRadius: 4,
  },
  devToggleText: {
    fontSize: 11,
    color: '#aaaacc',
  },
});
