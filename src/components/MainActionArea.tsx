import React from 'react';
import {
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
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

export default function MainActionArea({
  homework,
  onRegisterPress,
}: MainActionAreaProps) {
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
            <AppText style={styles.challengeText}>let's challenge!</AppText>
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
    color: '#ffffff',
    textAlign: 'center',
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
