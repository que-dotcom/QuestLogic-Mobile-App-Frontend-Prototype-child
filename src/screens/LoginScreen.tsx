import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
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

        {/* 下部のドット絵装飾エリア */}
        <View style={styles.bottomSpacer}>
          {/* 左側のタイル群
              下段: 2087, 2088, 2089 を横並び
              上段: 2082 を 2088 のやや 2087 側に寄せて配置
           */}
          <View style={styles.bottomColumnLeft}>
            <View style={styles.bottomAboveRow}>
              <Image
                source={require('../../asset/login/images/Rectangle 2082.png')}
                style={styles.bottomImage}
              />
            </View>
            <View style={styles.bottomLeftRow}>
              <Image
                source={require('../../asset/login/images/Rectangle 2087.png')}
                style={styles.bottomImage}
              />
              <Image
                source={require('../../asset/login/images/Rectangle 2088.png')}
                style={styles.bottomImage}
              />
              <Image
                source={require('../../asset/login/images/Rectangle 2089.png')}
                style={styles.bottomImage}
              />
            </View>
          </View>

          {/* 右側のタイル群（2 段構成。3 段目は中央左へ移動済み） */}
          <View style={styles.bottomColumnRight}>
            {/* Rectangle 2031 の下に Rectangle 2071 が来るように縦に配置 */}
            <View style={styles.bottomRowRight}>
              <Image
                source={require('../../asset/login/images/Rectangle 2031.png')}
                style={styles.bottomImage}
              />
            </View>
            <View style={styles.bottomRowRight}>
              <Image
                source={require('../../asset/login/images/Rectangle 2071.png')}
                style={styles.bottomImage}
              />
            </View>
          </View>
        </View>
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
    position: 'relative',
    zIndex: 2,
  },
  bottomSpacer: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  bottomColumnLeft: {
    flexDirection: 'column',
  },
  bottomColumnRight: {
    flexDirection: 'column',
    // 画面下端からおよそ 100px 分持ち上げる
    marginBottom: 100,
  },
  bottomRowRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  bottomImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  bottomLeftRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bottomAboveRow: {
    flexDirection: 'row',
    // 2087・2088 のちょうど上にくっついて見えるように、
    // わずかに下方向へ重ねる
    marginLeft: 70,
    marginBottom: -8,
  },
});

