import React, { useState } from 'react';
import {
  View,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AppText from '../components/AppText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PHOTO_WIDTH = SCREEN_WIDTH * 0.44;
const PHOTO_HEIGHT = PHOTO_WIDTH * 1.253;
const TABLE_WIDTH = SCREEN_WIDTH * 0.86;

// CustomTabBar の固定高さ（CustomTabBar.tsx の TAB_BAR_HEIGHT に合わせる）
const TAB_BAR_HEIGHT = 83;

const SUBJECTS = ['国語', '数学(算数)', '理科', '社会', '英語', 'その他'] as const;

export default function CameraScreen() {
  const [homeworkName, setHomeworkName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setSubjectOpen(false);
  };

  // ── 画像取得：カメラ ──────────────────────────────────────
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'カメラへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // ── 画像取得：アルバム ────────────────────────────────────
  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'メディアライブラリへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // ── 写真を選択ボタン：選択肢ポップアップ ──────────────────
  const handlePickPhoto = () => {
    Alert.alert('写真を選択', '', [
      { text: 'カメラで撮影', onPress: pickFromCamera },
      { text: 'アルバムから選択', onPress: pickFromLibrary },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  // ── 登録するボタン：バリデーション ───────────────────────
  const handleRegister = () => {
    if (!photoUri || !homeworkName.trim() || !selectedSubject) {
      Alert.alert('エラー', 'すべての項目を入力・選択してください');
      return;
    }
    Alert.alert('成功！');
  };

  return (
    <ImageBackground
      source={require('../../asset/camera/images/background screen.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* タイトル */}
            <AppText style={styles.title}>
              {'宿題の写真と内容を\n入力しよう！'}
            </AppText>

            {/* 写真プレビュー枠：画像あり→Image表示、なし→空枠 */}
            <View style={styles.photoPreview}>
              {photoUri && (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* 写真を選択ボタン */}
            <TouchableOpacity
              style={styles.photoButton}
              activeOpacity={0.7}
              onPress={handlePickPhoto}
            >
              <AppText style={styles.photoButtonText}>写真を選択　＞</AppText>
            </TouchableOpacity>

            {/* 入力フォーム（テーブル風） */}
            <View style={[styles.table, { width: TABLE_WIDTH }]}>

              {/* 行1: 宿題の名前（TextInput） */}
              <View style={[styles.tableRow, styles.tableRowDivider]}>
                <View style={[styles.labelCell, styles.labelCellBorder]}>
                  <AppText style={styles.labelText}>宿題の名前</AppText>
                </View>
                <View style={styles.valueCell}>
                  <TextInput
                    value={homeworkName}
                    onChangeText={setHomeworkName}
                    placeholder="宿題の名前を記入"
                    placeholderTextColor="rgba(255,255,255,0.55)"
                    style={styles.textInput}
                    returnKeyType="done"
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>

              {/* 行2: 科目 + インライン展開ドロップダウン */}
              <View>
                {/* 科目ヘッダー行 */}
                <View style={subjectOpen ? styles.tableRowDivider : undefined}>
                  <View style={styles.tableRow}>
                    <View style={[styles.labelCell, styles.labelCellBorder]}>
                      <AppText style={styles.labelText}>科目</AppText>
                    </View>
                    <TouchableOpacity
                      style={styles.valueCell}
                      activeOpacity={0.7}
                      onPress={() => setSubjectOpen((prev) => !prev)}
                    >
                      <AppText style={styles.placeholderText}>
                        {selectedSubject ?? '科目を選択'}{subjectOpen ? '　∨' : '　＞'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 展開リスト */}
                {subjectOpen && (
                  <View style={styles.dropdownList}>
                    {SUBJECTS.map((subject, index) => (
                      <TouchableOpacity
                        key={subject}
                        style={[
                          styles.dropdownItem,
                          index < SUBJECTS.length - 1 && styles.dropdownItemDivider,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleSubjectSelect(subject)}
                      >
                        <AppText style={styles.dropdownItemText}>{subject}</AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

            </View>

            {/* 登録するボタン */}
            <TouchableOpacity
              style={styles.registerButton}
              activeOpacity={0.8}
              onPress={handleRegister}
            >
              <AppText style={styles.registerButtonText}>登録する</AppText>
            </TouchableOpacity>

            {/* タブバー（オーバーレイ）分の余白 */}
            <View style={styles.bottomPad} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },

  // ---------- タイトル ----------
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 44,
    marginBottom: 20,
  },

  // ---------- 写真プレビュー ----------
  photoPreview: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(20, 20, 20, 0.45)',
    marginBottom: 18,
  },

  // 取得済み画像をプレビュー枠いっぱいに表示
  photoImage: {
    width: '100%',
    height: '100%',
  },

  // ---------- 写真選択ボタン ----------
  photoButton: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 22,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ---------- テーブル ----------
  table: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 22,
  },
  tableRow: {
    flexDirection: 'row',
    height: 37,
  },
  tableRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#7c7c7c',
  },

  // ラベルセル（左列 37%）
  labelCell: {
    width: '37%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  labelCellBorder: {
    borderRightWidth: 1,
    borderRightColor: '#7c7c7c',
  },
  labelText: {
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // 値セル（右列 残り）
  valueCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  placeholderText: {
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // ---------- TextInput（宿題の名前） ----------
  textInput: {
    width: '100%',
    height: 37,
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
    fontFamily: 'DotGothic16_400Regular',
    padding: 0,
    textAlignVertical: 'center',
  },

  // ---------- 科目ドロップダウン ----------
  dropdownList: {
    // 左ラベルカラム（37%）分だけ右にオフセットして右列と揃える
    marginLeft: '37%',
    backgroundColor: '#323232',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderTopWidth: 0,
  },
  dropdownItem: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // ---------- 登録するボタン ----------
  registerButton: {
    backgroundColor: '#1e3c9f',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  registerButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ---------- タブバーオーバーレイ分の余白 ----------
  bottomPad: {
    height: TAB_BAR_HEIGHT + 24,
  },
});
