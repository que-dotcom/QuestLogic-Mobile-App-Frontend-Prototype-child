import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AppText from './AppText';

interface HeaderProfileProps {
  title: string;
  userName: string;
}

export default function HeaderProfile({ title, userName }: HeaderProfileProps) {
  return (
    <View style={styles.container}>
      {/* キャラクター枠 */}
      <View style={styles.characterFrame}>
        <Image
          source={require('../../asset/home/images/Default Character.png')}
          style={styles.characterImage}
          resizeMode="contain"
        />
      </View>

      {/* 称号・ユーザー名 */}
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
    alignItems: 'center',
    marginHorizontal: 8,
    marginTop: 8,
    borderWidth: 3,
    borderColor: '#5a5a7a',
    backgroundColor: '#0d0d1e',
    minHeight: 90,
  },
  characterFrame: {
    width: 72,
    height: 84,
    borderRightWidth: 3,
    borderRightColor: '#5a5a7a',
    backgroundColor: '#12122a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  characterImage: {
    width: 58,
    height: 72,
  },
  infoContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 14,
    color: '#c0c0d8',
  },
  nameText: {
    fontSize: 22,
    color: '#ffffff',
  },
});
