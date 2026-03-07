import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from './AppText';

/**
 * ログイン画面用のカラフルなタイトルテキスト。
 * 「Let's start」 と 「Quest Logic !!」 をそれぞれ 1 行にして表示する。
 */
export default function ColoredTitle() {
  return (
    <View style={styles.container}>
      {/* 1 行目: "Let's start" */}
      <AppText style={styles.line}>
        <AppText style={[styles.word, styles.red]}>Let&apos;s</AppText>
        <AppText style={styles.word}>{' '}</AppText>
        <AppText style={[styles.word, styles.cyan]}>start</AppText>
      </AppText>

      {/* 2 行目: "Quest Logic !!" */}
      <AppText style={styles.line}>
        <AppText style={[styles.word, styles.green]}>Quest</AppText>
        <AppText style={styles.word}>{' '}</AppText>
        <AppText style={[styles.word, styles.orange]}>Logic</AppText>
        <AppText style={[styles.word, styles.purple]}> !!</AppText>
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  line: {
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
  },
  word: {
    fontSize: 32,
    lineHeight: 36,
  },
  red: {
    color: '#ff4a4a',
  },
  cyan: {
    color: '#48deff',
  },
  green: {
    color: '#49f540',
  },
  orange: {
    color: '#ff9346',
  },
  purple: {
    color: '#d362ff',
  },
});

