import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../navigation/AppNavigator';
import { getTitleByExp } from '../utils/titleHelper';
import HeaderProfile from '../components/HeaderProfile';
import StatusBars from '../components/StatusBars';
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
  const [hasHomework] = useState(false);
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
    <ImageBackground
      source={require('../../asset/home/images/background screen.png')}
      style={styles.screenBackground}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          {/* A. ヘッダー（プロフィール） */}
          <HeaderProfile title={title} userName={userName} />

          {/* B. ステータスバー + バー画像ラベル */}
          <StatusBars
            level={level}
            gameLimitMin={gameLimitMin}
            smartphoneLimitMin={smartphoneLimitMin}
          />

          {/* C. メインエリア（地図/羊皮紙）— flex:1 で残り全高を占有 */}
          <MainActionArea
            hasHomework={hasHomework}
            homeworkList={homeworkList}
            onRegisterPress={handleRegisterPress}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screenBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
});
