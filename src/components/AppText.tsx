import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

type AppTextProps = TextProps & {
  children?: React.ReactNode;
};

/**
 * アプリ全体で DotGothic16 フォントをデフォルト適用するカスタムテキストコンポーネント。
 * 標準の <Text> の代わりに必ずこちらを使用すること。
 */
export default function AppText({ style, children, ...rest }: AppTextProps) {
  return (
    <Text style={[styles.base, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'DotGothic16_400Regular',
    color: '#ffffff',
  },
});
