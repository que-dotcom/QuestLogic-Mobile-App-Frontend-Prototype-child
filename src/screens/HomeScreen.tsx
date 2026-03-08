import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootTabParamList } from '../navigation/AppNavigator';
import { getTitleByExp } from '../utils/titleHelper';
import { useHomework } from '../context/HomeworkContext';
import { useAuth } from '../context/AuthContext';
import HeaderProfile from '../components/HeaderProfile';
import StatusBars from '../components/StatusBars';
import MainActionArea from '../components/MainActionArea';

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();

  useFocusEffect(
    useCallback(() => {
      void refreshUser();
    }, [refreshUser])
  );

  const userName = user?.name || 'ゲスト';
  const exp = user?.exp || 0;
  const currentMinutes =
    user?.currentMinutes ?? (user?.currentPoints ?? 0) * (user?.minutesPerPoint ?? 0);
  const currentLevel = user?.level || 1;

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
            level={currentLevel}
            gameLimitMin={currentMinutes}
            smartphoneLimitMin={currentMinutes}
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
