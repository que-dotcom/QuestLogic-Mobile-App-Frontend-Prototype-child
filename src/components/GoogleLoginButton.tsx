import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import AppText from './AppText';

type Props = {
  onPress?: (event: GestureResponderEvent) => void;
};

/**
 * Google アカウントでログイン・サインインするためのカスタムボタン。
 * ドット絵風の二重フチと左右 5% マージンを持つ。
 */
export default function GoogleLoginButton({ onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.outer}
    >
      <View style={styles.inner}>
        <View style={styles.iconContainer}>
          <Image
            // ログイン画面専用のアセット配置に合わせる
            source={require('../../asset/login/images/google-logo.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <AppText style={styles.text}>
            Googleアカウントで{'\n'}ログイン・サインイン
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // 画面横幅に対して左右 5% ずつマージン
  outer: {
    marginHorizontal: '5%',
    backgroundColor: '#FDFDFD',
    borderWidth: 2,
    borderColor: '#FC2865', // ピンク系ドット風フチ
    borderRadius: 4,
    padding: 4,
  },
  inner: {
    borderWidth: 2,
    borderColor: '#000022', // 濃紺の内側フチ
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FDFDFD',
  },
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    width: 32,
    height: 32,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    color: '#000022',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
});

