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
import { useHomework } from '../context/HomeworkContext';
import HeaderProfile from '../components/HeaderProfile';
import StatusBars from '../components/StatusBars';
import MainActionArea from '../components/MainActionArea';

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

/** プレイヤーのステータス値。将来はバックエンドから取得してこの状態を更新する。 */
interface PlayerStatus {
  gameTime: number;
  smartphoneTime: number;
  level: number;
}

export default function HomeScreen({ navigation }: Props) {
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    gameTime: 60,
    smartphoneTime: 60,
    level: 1,
  });
  const [exp] = useState(3000);
  const [userName] = useState('匿名さん');

  const title = getTitleByExp(exp);
  const { homework } = useHomework();

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
            level={playerStatus.level}
            gameLimitMin={playerStatus.gameTime}
            smartphoneLimitMin={playerStatus.smartphoneTime}
          />

          {/* C. メインエリア（地図/羊皮紙） */}
          <MainActionArea
            homework={homework}
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
