import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AppText from './AppText';

interface StatusBarsProps {
  level: number;
  gameLimitMin: number;
  smartphoneLimitMin: number;
}

/**
 * Status bar (Group 353): Figma width=325, height=87 → aspectRatio ≈ 3.74
 * 各バー行の画像は細い線のアイコンとして表示し、右横にラベルテキストを配置。
 */
const STATUS_BAR_ASPECT_RATIO = 325 / 87;

const BAR_ROWS: Array<{
  image: ReturnType<typeof require>;
  getLabel: (props: StatusBarsProps) => string;
  color: string;
}> = [
  {
    image: require('../../asset/home/images/Game bar.png'),
    getLabel: ({ gameLimitMin }) => `Game ${gameLimitMin}min`,
    color: '#F08080',
  },
  {
    image: require('../../asset/home/images/Smartphone bar.png'),
    getLabel: ({ smartphoneLimitMin }) => `Smartphone ${smartphoneLimitMin}min`,
    color: '#87CEFA',
  },
  {
    image: require('../../asset/home/images/Level bar.png'),
    getLabel: ({ level }) => `Level ${level}`,
    color: '#90EE90',
  },
];

export default function StatusBars({
  level,
  gameLimitMin,
  smartphoneLimitMin,
}: StatusBarsProps) {
  const props = { level, gameLimitMin, smartphoneLimitMin };

  return (
    <View style={styles.container}>
      {/* Status bar 画像 + Lv.テキストを円の中央に重ね表示 */}
      <View style={styles.statusBarWrapper}>
        <Image
          source={require('../../asset/home/images/Status bar.png')}
          style={styles.statusBarImage}
          resizeMode="contain"
        />
        <View style={styles.levelBadge} pointerEvents="none">
          <AppText style={styles.levelText}>Lv.{level}</AppText>
        </View>
      </View>

      {/* 3本のバー画像 + テキストを横並びで縦に配置 */}
      <View style={styles.barsColumn}>
        {BAR_ROWS.map(({ image, getLabel, color }, index) => (
          <View key={index} style={styles.barRow}>
            <Image
              source={image}
              style={styles.barImage}
              resizeMode="stretch"
            />
            <AppText style={[styles.barLabel, { color }]}>
              {getLabel(props)}
            </AppText>
          </View>
        ))}
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
  statusBarWrapper: {
    width: '100%',
    aspectRatio: STATUS_BAR_ASPECT_RATIO,
    backgroundColor: 'transparent',
  },
  statusBarImage: {
    width: '100%',
    height: '100%',
  },
  levelBadge: {
    position: 'absolute',
    // Figma: Lv.1 テキスト中心 x ≈ 127.93 / 325px = ~39% の位置に合わせる
    // left: 22% + width: 34% の中心 = 39%
    left: '5%',
    width: '34%',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 16,
    color: '#ffffff',
  },
  barsColumn: {
    marginTop: 6,
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barImage: {
    width: 80,
    height: 10,
  },
  barLabel: {
    fontSize: 14,
  },
});
