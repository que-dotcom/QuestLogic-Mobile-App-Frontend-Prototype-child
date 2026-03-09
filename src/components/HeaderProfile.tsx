import React from 'react';
import { View, Image, ImageBackground, StyleSheet } from 'react-native';
import AppText from './AppText';

interface HeaderProfileProps {
  title: string;
  userName: string;
}

/**
 * Figma: Group 352, x=-5, y=4, width=382, height=111
 * cha bar.png をヘッダー全体の背景として使用。
 * aspectRatio (382/111 ≈ 3.44) で端末サイズに関わらず縦横比を維持。
 */
const CHA_BAR_ASPECT_RATIO = 382 / 111;

export default function HeaderProfile({ title, userName }: HeaderProfileProps) {
  return (
    <ImageBackground
      source={require('../../asset/home/images/cha_bar.png')}
      style={styles.container}
      resizeMode="stretch"
    >
      {/* キャラクター画像（左側） */}
      <View style={styles.characterFrame}>
        <Image
          source={require('../../asset/home/images/Default_Character.png')}
          style={styles.characterImage}
          resizeMode="contain"
        />
      </View>

      {/* 称号・ユーザー名（右側） */}
      <View style={styles.infoContainer}>
        <AppText style={styles.titleText}>{title}</AppText>
        <AppText style={styles.nameText}>{userName}</AppText>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    marginTop: 6,
    aspectRatio: CHA_BAR_ASPECT_RATIO,
  },
  characterFrame: {
    width: '20%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '2%',
  },
  characterImage: {
    width: '85%',
    height: '85%',
  },
  infoContainer: {
    flex: 1,
    paddingHorizontal: '4%',
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
