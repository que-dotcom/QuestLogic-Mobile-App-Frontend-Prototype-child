import React from 'react';
import {
  View,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AppText from './AppText';

interface Homework {
  id: string;
  label: string;
}

interface MainActionAreaProps {
  hasHomework: boolean;
  homeworkList: Homework[];
  onRegisterPress: () => void;
}

export default function MainActionArea({
  hasHomework,
  homeworkList,
  onRegisterPress,
}: MainActionAreaProps) {
  return (
    /*
     * 外側 View が flex:1 で残り全高を占有する。
     * ScrollView 廃止により flex:1 が正常に機能する。
     * marginHorizontal で左右の余白を確保。
     */
    <View style={styles.outerContainer}>
      <ImageBackground
        source={require('../../asset/home/images/Map icon.png')}
        style={styles.mapBackground}
        /*
         * "cover": コンテナ全体を羊皮紙画像で埋める。
         * "stretch" は比率が崩れる。"contain" は余白が出る。
         * "cover" が最もデザイン意図に近い。
         */
        resizeMode="cover"
      >
        {hasHomework ? (
          /* 宿題登録後: 宿題リスト表示 */
          <View style={styles.homeworkContainer}>
            {homeworkList.map((hw) => (
              <AppText key={hw.id} style={styles.homeworkItem}>
                {hw.label}
              </AppText>
            ))}
          </View>
        ) : (
          /* デフォルト: 登録促進テキスト + 登録ボタン */
          <View style={styles.defaultContainer}>
            <AppText style={styles.promptText}>
              {'宿題を登録して\n取り組もう！'}
            </AppText>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={onRegisterPress}
              activeOpacity={0.8}
            >
              <AppText style={styles.registerButtonText}>登録する</AppText>
            </TouchableOpacity>
          </View>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  mapBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /* --- デフォルト状態 --- */
  defaultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  promptText: {
    fontSize: 22,
    /*
     * 羊皮紙（薄色背景）の上のテキストは黒にする。
     * 前回の暗い赤では羊皮紙上で見えなかった。
     */
    color: '#000000',
    textAlign: 'center',
    lineHeight: 40,
  },
  registerButton: {
    backgroundColor: '#2255cc',
    paddingVertical: 12,
    paddingHorizontal: 52,
    borderRadius: 2,
  },
  registerButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  /* --- 宿題登録後状態 --- */
  homeworkContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 14,
  },
  homeworkItem: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
  },
});
