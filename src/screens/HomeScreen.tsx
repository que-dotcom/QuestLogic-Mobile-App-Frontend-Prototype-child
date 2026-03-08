import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// SettingsScreen が AsyncStorage に保存する表示名のキー（共通定数）
const SETTINGS_USER_NAME_KEY = 'settings_userName';

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, refreshUser } = useAuth();
  const [localUserName, setLocalUserName] = useState<string>('ゲスト');

  useFocusEffect(
    useCallback(() => {
      void refreshUser();

      // SettingsScreen が保存した表示名を読み込む。
      // エラーや不正な値の場合は state を変えずフォールバック値を維持する。
      const loadLocalUserName = async () => {
        try {
          const raw = await AsyncStorage.getItem(SETTINGS_USER_NAME_KEY);
          if (raw !== null) {
            const parsed: unknown = JSON.parse(raw);
            if (typeof parsed === 'string' && parsed.trim().length > 0) {
              setLocalUserName(parsed);
            }
          }
        } catch {
          // 読み込み・パース失敗時は現在の state（'ゲスト'）を維持する
        }
      };

      void loadLocalUserName();
    }, [refreshUser])
  );

  // バックエンドのアカウント名を優先し、なければ設定画面の表示名、それもなければ 'ゲスト'
  const userName = user?.name || localUserName;
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
