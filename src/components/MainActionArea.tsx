import React, { useRef, useEffect } from 'react';
import {
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import AppText from './AppText';
import type { HomeworkInfo } from '../context/HomeworkContext';

interface MainActionAreaProps {
  homework: HomeworkInfo | null;
  onRegisterPress: () => void;
}

/**
 * 教科ごとの表示カラー定義。
 * CameraScreen の SUBJECTS 定義 ['国語','数学(算数)','理科','社会','英語','その他'] に対応。
 */
const SUBJECT_COLORS: Record<string, string> = {
  '国語':      '#FF3B30',
  '数学(算数)': '#007AFF',
  '英語':      '#FF69B4',
  '社会':      '#DAA520',
  '理科':      '#34C759',
  'その他':    '#8E8E93',
};

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] ?? '#8E8E93';
}

/**
 * Figma: Group 387 (Map エリア) width=394, height=305
 * この比率を ImageBackground に指定して縦方向への間延びを防ぐ。
 */
const MAP_ASPECT_RATIO = 394 / 306;

/**
 * 「let's challenge!」の文字色を赤→ピンク→オレンジ→黄→緑→青→紫→赤の順に
 * 約7秒かけてループするミュートカラーアニメーション。
 * color は useNativeDriver 非対応のため JS スレッドで動かす。
 */
const CHALLENGE_COLORS = [
  '#b33939', // 赤
  '#cc5e84', // ピンク
  '#cd6133', // オレンジ
  '#cca72b', // 黄
  '#218c74', // 緑
  '#227093', // 青
  '#40407a', // 紫
  '#b33939', // 赤（ループ折り返し）
];

export default function MainActionArea({
  homework,
  onRegisterPress,
}: MainActionAreaProps) {
  const colorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(colorAnim, {
        toValue: CHALLENGE_COLORS.length - 1,
        duration: 7000,
        useNativeDriver: false,
      })
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const animatedColor = colorAnim.interpolate({
    inputRange: CHALLENGE_COLORS.map((_, i) => i),
    outputRange: CHALLENGE_COLORS,
  });

  return (
    <View style={styles.outerContainer}>
      <ImageBackground
        source={require('../../asset/home/images/Map icon.png')}
        style={styles.mapBackground}
        resizeMode="stretch"
      >
        {homework ? (
          /* 宿題登録後: 「{学年}{教科}：{宿題名}」を教科色で表示 */
          <View style={styles.homeworkContainer}>
            <AppText
              style={[
                styles.homeworkText,
                { color: getSubjectColor(homework.subject) },
              ]}
            >
              {`${homework.grade}${homework.subject}：${homework.name}`}
            </AppText>
          </View>
        ) : (
          /* デフォルト: チャレンジ促進テキスト + 登録ボタン */
          <View style={styles.defaultContainer}>
            <Animated.Text
              style={[styles.challengeText, { color: animatedColor }]}
            >
              let's challenge!
            </Animated.Text>
            <AppText style={styles.promptText}>
              {'宿題を登録して\n取り組もう！'}
            </AppText>
            <TouchableOpacity onPress={onRegisterPress} activeOpacity={0.75}>
              <Image
                source={require('../../asset/home/images/Button S2.png')}
                style={styles.registerButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  mapBackground: {
    width: '100%',
    aspectRatio: MAP_ASPECT_RATIO,
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
  challengeText: {
    fontSize: 18,
    color: '#b33939',
    textAlign: 'center',
    fontFamily: 'DotGothic16_400Regular',
  },
  promptText: {
    fontSize: 22,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 40,
  },
  registerButtonImage: {
    width: 205,
    height: 57,
  },
  /* --- 宿題登録後状態 --- */
  homeworkContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  homeworkText: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 36,
  },
});
