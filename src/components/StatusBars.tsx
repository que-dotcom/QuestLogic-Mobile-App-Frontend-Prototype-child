import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AppText from './AppText';

interface StatusBarsProps {
  level: number;
}

export default function StatusBars({ level }: StatusBarsProps) {
  return (
    <View style={styles.container}>
      {/* ステータスバー画像（HP/MP風ゲージ + レベル円形枠を含む） */}
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
  },
  barImage: {
    width: '100%',
    height: 88,
  },
  levelBadge: {
    position: 'absolute',
    left: '3%',
    top: 0,
    bottom: 0,
    width: '22%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 13,
    color: '#ffffff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
