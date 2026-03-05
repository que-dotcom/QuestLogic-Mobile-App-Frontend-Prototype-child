import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AppText from './AppText';

interface StatusBarsProps {
  level: number;
}

/**
 * Figma上のステータスバーグループ寸法 (width=325, height=87) に基づく
 * アスペクト比 ≈ 3.74。
 * `width: '100%'` + `aspectRatio` で、固定高さ指定によるアスペクト比崩壊を防ぐ。
 */
const STATUS_BAR_ASPECT_RATIO = 325 / 87; // ≈ 3.74

export default function StatusBars({ level }: StatusBarsProps) {
  return (
    <View style={styles.container}>
      {/*
       * Image を非絶対配置にすることで、親 View の高さが
       * アスペクト比から自動計算される。
       * その親 View を参照して Lv バッジを absolute 配置できる。
       */}
      <Image
        source={require('../../asset/home/images/Status bar.png')}
        style={styles.barImage}
        resizeMode="contain"
      />

      {/* レベルテキストをゲージ左側の円形エリアに重ね表示 */}
      <View style={styles.levelBadge} pointerEvents="none">
        <AppText style={styles.levelText}>Lv.{level}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  barImage: {
    width: '100%',
    /*
     * height: undefined + aspectRatio で縦横比を保持。
     * 固定 height は画像が潰れる原因となるため使用しない。
     */
    height: undefined,
    aspectRatio: STATUS_BAR_ASPECT_RATIO,
    backgroundColor: 'transparent',
  },
  levelBadge: {
    position: 'absolute',
    /*
     * Figma: Lv.1 テキストは画像左端から約 26% の位置。
     * 視覚的に円形フレームの中心に合わせる。
     */
    left: 0,
    top: 0,
    bottom: 0,
    width: '28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 12,
    color: '#ffffff',
  },
});
