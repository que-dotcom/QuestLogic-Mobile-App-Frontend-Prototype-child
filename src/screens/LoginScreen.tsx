import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ColoredTitle from '../components/ColoredTitle';
import GoogleLoginButton from '../components/GoogleLoginButton';

type Props = {
  /** ログインボタン押下後に呼び出されるコールバック（ホーム画面へ遷移させるなど） */
  onLogin?: () => void;
};

/**
 * 子ども向け学習管理アプリのログイン・サインイン画面基盤。
 * - 背景は完全な黒 (#000000)
 * - 上部にカラフルなタイトル
 * - 中央付近に Google ログインボタン
 * という構成のみを持ち、認証処理はまだ実装しない。
 */
export default function LoginScreen({ onLogin }: Props) {
  const handleGoogleLogin = () => {
    // TODO: 実際の Google 認証処理をここに実装する
    if (onLogin) {
      onLogin();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.titleArea}>
          <ColoredTitle />
        </View>

        <View style={styles.buttonArea}>
          <GoogleLoginButton onPress={handleGoogleLogin} />
        </View>

        {/* 将来的にフッターのドット絵などを配置するための余白 */}
        <View style={styles.bottomSpacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  titleArea: {
    paddingTop: 40,
    alignItems: 'center',
  },
  // タイトルの下から画面中央あたりまでを占め、
  // ボタンを垂直方向の中央に配置する。
  buttonArea: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: 80,
  },
});

