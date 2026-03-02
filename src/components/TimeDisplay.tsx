import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from './AppText';

interface TimeDisplayProps {
  gameLimitMin: number;
  smartphoneLimitMin: number;
  level: number;
}

interface TimeRowProps {
  color: string;
  label: string;
}

function TimeRow({ color, label }: TimeRowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <AppText style={[styles.timeText, { color }]}>{label}</AppText>
    </View>
  );
}

export default function TimeDisplay({
  gameLimitMin,
  smartphoneLimitMin,
  level,
}: TimeDisplayProps) {
  return (
    <View style={styles.container}>
      {/* 3つのパラメータ表示 */}
      <View style={styles.paramList}>
        <TimeRow color="#e84040" label={`Game ${gameLimitMin}min`} />
        <TimeRow color="#4080e8" label={`Smartphone ${smartphoneLimitMin}min`} />
        <TimeRow color="#40c840" label={`Level ${level}`} />
      </View>

      {/* チャレンジメッセージ */}
      <AppText style={styles.challengeText}>let's challenge!</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginTop: 8,
  },
  paramList: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 22,
    height: 3,
    borderRadius: 1,
  },
  timeText: {
    fontSize: 14,
  },
  challengeText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 10,
    textAlign: 'center',
  },
});
