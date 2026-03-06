import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AppText from './AppText';

interface StatusBarsProps {
  level: number;
  gameRatio?: number;
  smartphoneRatio?: number;
  levelRatio?: number;
}

/**
 * Figma上のステータスバーグループ寸法 (width=325, height=87) に基づく
 * アスペクト比 ≈ 3.74。
 * `width: '100%'` + `aspectRatio` で、固定高さ指定によるアスペクト比崩壊を防ぐ。
 */
const STATUS_BAR_ASPECT_RATIO = 325 / 87; // ≈ 3.74

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function StatusBars({
  level,
  gameRatio = 1,
  smartphoneRatio = 1,
  levelRatio = 1,
}: StatusBarsProps) {
  return (
    <View style={styles.container}>
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
    height: undefined,
    aspectRatio: STATUS_BAR_ASPECT_RATIO,
    backgroundColor: 'transparent',
  },
  gaugeLayer: {
    position: 'absolute',
    left: '28%',
    right: '10%',
    top: '18%',
    bottom: '18%',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  gaugeTrack: {
    width: '100%',
    height: '23%',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  gaugeTrackTop: {
    marginBottom: '2%',
  },
  gaugeTrackMiddle: {
    marginBottom: '2%',
  },
  gaugeTrackBottom: {},
  gaugeFill: {
    height: '100%',
    backgroundColor: 'transparent',
  },
  levelBadge: {
    position: 'absolute',
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
