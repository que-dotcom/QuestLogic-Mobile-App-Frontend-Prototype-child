import React, { useRef, useEffect } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import AppText from './AppText';
import { levelProgress, expProgressLabel } from '../utils/levelHelper';

interface StatusBarsProps {
  level: number;
  exp: number;
  freetimeRemainingMin: number;
  freetimeTotalMin: number;
}

/**
 * Status_bar.png (325×87) をフレームとして使用し、
 * バー部分に Animated.View を絶対配置でオーバーレイする。
 *
 * 画像内のバー行 (% は Status_bar.png の幅/高さ基準):
 *   左端(円の右側): left ≈ 27%
 *   右端(宝石の左側): right ≈ 4%
 *   Row1 (Freetime): top ≈ 9%,  height ≈ 12%
 *   Row3 (EXP):      top ≈ 72%, height ≈ 12%
 */
const STATUS_BAR_ASPECT = 3580 / 1152; // Status＿bar2.png の実寸

export default function StatusBars({
  level,
  exp,
  freetimeRemainingMin,
  freetimeTotalMin,
}: StatusBarsProps) {
  const freetimeAnim = useRef(new Animated.Value(0)).current;
  const expBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const freetimeProgress =
      freetimeTotalMin > 0 ? Math.min(1, freetimeRemainingMin / freetimeTotalMin) : 0;
    const lvProgress = levelProgress(level, exp);

    Animated.parallel([
      Animated.timing(freetimeAnim, {
        toValue: freetimeProgress,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.timing(expBarAnim, {
        toValue: lvProgress,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();
  }, [freetimeRemainingMin, freetimeTotalMin, level, exp]);

  const freetimeWidth = freetimeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const expBarWidth = expBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Status_bar.png フレーム + バーオーバーレイ */}
      <View style={styles.frameWrapper}>
        {/* Row1: Freetime バー（画像の下に描画） */}
        <View style={styles.barTrackRow1} pointerEvents="none">
          <Animated.View
            style={[styles.barFill, { width: freetimeWidth, backgroundColor: '#C0392B' }]}
          />
        </View>

        {/* Row3: EXP バー（画像の下に描画） */}
        <View style={styles.barTrackRow3} pointerEvents="none">
          <Animated.View
            style={[styles.barFill, { width: expBarWidth, backgroundColor: '#90EE90' }]}
          />
        </View>

        {/* フレーム画像（バーの上に重ねる） */}
        <Image
          source={require('../../asset/home/images/Status_bar2.png')}
          style={styles.frameImage}
          resizeMode="stretch"
        />

        {/* Lv. バッジ（最前面） */}
        <View style={styles.levelBadge} pointerEvents="none">
          <AppText style={styles.levelText}>Lv.{level}</AppText>
        </View>
      </View>

      {/* ラベル行 */}
      <View style={styles.labelsRow}>
        <AppText style={[styles.barLabel, { color: '#C0392B' }]}>
          Freetime {freetimeRemainingMin}min
        </AppText>
        <AppText style={[styles.barLabel, { color: '#90EE90' }]}>
          EXP {expProgressLabel(level, exp)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginTop: 4,
    marginLeft: '4%',
  },
  frameWrapper: {
    width: '90%',
    aspectRatio: STATUS_BAR_ASPECT,
    position: 'relative',
  },
  frameImage: {
    width: '100%',
    height: '100%',
  },
  levelBadge: {
    position: 'absolute',
    left: '2%',
    width: '26%',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  // バートラック：画像内のバー行に合わせて絶対配置
  barTrackRow1: {
    position: 'absolute',
    left: '27%',
    right: '3%',
    top: '19%',
    height: '20%',
    overflow: 'hidden',
    borderRadius: 999,
  },
  barTrackRow3: {
    position: 'absolute',
    left: '27%',
    right: '3%',
    top: '66%',
    height: '20%',
    overflow: 'hidden',
    borderRadius: 999,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    opacity: 0.75,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  barLabel: {
    fontSize: 12,
  },
});
