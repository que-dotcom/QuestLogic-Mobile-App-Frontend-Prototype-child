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
    <ImageBackground
      source={require('../../asset/home/images/background screen.png')}
      style={styles.mapBackground}
      resizeMode="stretch"
    >
      {hasHomework ? (
        /* 宿題登録後: 宿題リスト表示 */
        <View style={styles.homeworkList}>
          {homeworkList.map((hw) => (
            <AppText key={hw.id} style={styles.homeworkItem}>
              {hw.label}
            </AppText>
          ))}
        </View>
      ) : (
        /* デフォルト: 登録促進テキスト + 登録ボタン */
        <View style={styles.defaultContent}>
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
  );
}

const styles = StyleSheet.create({
  mapBackground: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 220,
    borderRadius: 4,
    overflow: 'hidden',
  },
  /* --- デフォルト状態 --- */
  defaultContent: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 24,
  },
  promptText: {
    fontSize: 22,
    color: '#3a2010',
    textAlign: 'center',
    lineHeight: 38,
  },
  registerButton: {
    backgroundColor: '#2255cc',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 4,
  },
  registerButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  /* --- 宿題登録後状態 --- */
  homeworkList: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  homeworkItem: {
    fontSize: 18,
    color: '#b84010',
    textAlign: 'center',
  },
});
