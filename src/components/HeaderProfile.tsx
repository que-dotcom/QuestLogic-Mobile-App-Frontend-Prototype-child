import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AppText from './AppText';

interface HeaderProfileProps {
  title: string;
  userName: string;
}

export default function HeaderProfile({ title, userName }: HeaderProfileProps) {
  return (
    /*
     * Figma: Group 352, x=-5, y=4, width=382, height=111
     * 横方向ほぼフル幅。左右 marginHorizontal: 6 で端に合わせる。
     */
    <View style={styles.container}>
      {/* キャラクター枠（左側） */}
      <View style={styles.characterFrame}>
        <Image
          source={require('../../asset/home/images/Default Character.png')}
          style={styles.characterImage}
          resizeMode="contain"
        />
      </View>

      {/* 称号・ユーザー名（右側） */}
      <View style={styles.infoContainer}>
        <AppText style={styles.titleText}>{title}</AppText>
        <AppText style={styles.nameText}>{userName}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: 6,
    marginTop: 6,
    borderWidth: 3,
    borderColor: '#4a4a6a',
    backgroundColor: '#0d0d20',
    minHeight: 90,
  },
  characterFrame: {
    width: 70,
    borderRightWidth: 3,
    borderRightColor: '#4a4a6a',
    backgroundColor: '#10102a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  characterImage: {
    width: 54,
    height: 68,
  },
  infoContainer: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 4,
  },
  titleText: {
    fontSize: 13,
    color: '#b8b8d0',
  },
  nameText: {
    fontSize: 22,
    color: '#ffffff',
  },
});
