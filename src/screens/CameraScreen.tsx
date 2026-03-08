import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import AppText from '../components/AppText';
import { RootTabParamList } from '../navigation/AppNavigator';
import { useHomework } from '../context/HomeworkContext';
import { useAdvice } from '../context/AdviceContext';
import { submitQuest } from '../api/quests';
import { getApiErrorMessage } from '../api/client';
import type { SubmitQuestResponse } from '../types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PHOTO_WIDTH = SCREEN_WIDTH * 0.44;
const PHOTO_HEIGHT = PHOTO_WIDTH * 1.253;
const TABLE_WIDTH = SCREEN_WIDTH * 0.86;

// CustomTabBar の固定高さ（CustomTabBar.tsx の TAB_BAR_HEIGHT に合わせる）
const TAB_BAR_HEIGHT = 83;

// ── モーダル画像サイズ（Figmaの比率を維持してレスポンシブ計算） ──
// Alerts.png  Figma実寸: 363 × 110 px
const ALERT_IMG_W = SCREEN_WIDTH * 0.92;
const ALERT_IMG_H = ALERT_IMG_W * (110 / 363);
// Dialog.png  Figma実寸: 312 × 128 px (概算)
const DIALOG_IMG_W = SCREEN_WIDTH * 0.84;
const DIALOG_IMG_H = DIALOG_IMG_W * (128 / 312);

const SUBJECTS = ['国語', '数学(算数)', '理科', '社会', '英語', 'その他'] as const;

// ── 完了画面の写真ボックスサイズ
// Figma: 各ボックス width:166, height:208, 左margin:19, ギャップ:20
const COMPLETION_BOX_W = (SCREEN_WIDTH - 19 * 2 - 20) / 2;
const COMPLETION_BOX_H = COMPLETION_BOX_W * (208 / 166);

// ── Alerts photo.png 推定サイズ（やめる／アルバム／写真をとる の3ボタン横並び）
const ALERT_PHOTO_W = SCREEN_WIDTH * 0.92;
const ALERT_PHOTO_H = ALERT_PHOTO_W * (160 / 363);

// ── 採点結果画面の写真ボックスサイズ
// Figma: width:117, height:161 → アスペクト比 1:1.376
const RESULT_BOX_W = SCREEN_WIDTH * 0.3;
const RESULT_BOX_H = RESULT_BOX_W * (161 / 117);

// ── 結果画面ボタン画像サイズ
// Button S (Figma: width:175, height:44)
const BUTTON_S_W = SCREEN_WIDTH * 0.45;
const BUTTON_S_H = BUTTON_S_W * (44 / 175);
// Button M (Figma: width:291, height:96)
const BUTTON_M_W = SCREEN_WIDTH * 0.74;
const BUTTON_M_H = BUTTON_M_W * (96 / 291);


// ── 10点満点のスコアを5段階の星文字列に変換（切り捨て）──
const renderStars = (score10: number): string => {
  const filled = Math.floor(score10 / 2);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
};

const getUploadMimeType = (uri: string): string => {
  const normalizedUri = uri.toLowerCase();

  if (normalizedUri.endsWith('.png')) return 'image/png';
  if (normalizedUri.endsWith('.heic')) return 'image/heic';
  if (normalizedUri.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const buildUploadImage = (uri: string, fallbackName: string) => {
  const sanitizedUri = uri.split('?')[0];
  const fileName = sanitizedUri.split('/').pop() || fallbackName;

  return {
    uri,
    name: fileName,
    type: getUploadMimeType(fileName),
  };
};

// 学年は現状ハードコード。将来はユーザー情報から取得する
const GRADE = '中学1年生';

export default function CameraScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { setHomework } = useHomework();
  const {
    setHasNewAdvice,
    setOpenAdviceDirectly,
    setLatestAdviceText,
    prependRewardHistory,
  } = useAdvice();

  const [homeworkName, setHomeworkName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isChallenging, setIsChallenging] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  // 'before' = 挑戦前写真選択中、'after' = 挑戦後写真選択中、null = 非表示
  const [photoModalType, setPhotoModalType] = useState<'before' | 'after' | null>(null);
  const [afterPhotoUri, setAfterPhotoUri] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isResult, setIsResult] = useState(false);
  const [isBackendError, setIsBackendError] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitQuestResponse | null>(null);

  // setInterval の ID を ref で保持し、外部から即座に停止できるようにする
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 非同期処理中のアンマウントによる state 更新を防止
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // 採点中アニメーション（宝箱 + テキストを上下にゆっくりループ）
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isScoring) {
      bounceAnim.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 10,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isScoring]);

  // MM:SS フォーマット変換
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 挑戦中のみタイマーを起動。ref に ID を保存してクリーンアップも対応
  useEffect(() => {
    if (!isChallenging) return;
    timerRef.current = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isChallenging]);

  // タイマーを即座に停止する共通関数
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setSubjectOpen(false);
  };

  // ── カメラから写真取得（before / after 共用） ──────────────
  const pickPhotoFromCamera = async (type: 'before' | 'after') => {
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
      const uri = result.assets[0].uri;
      if (type === 'before') {
        setPhotoUri(uri);
      } else {
        stopTimer();
        setAfterPhotoUri(uri);
        setIsFinished(true);
      }
      setPhotoModalType(null);
    }
  };

  // ── アルバムから写真取得（before / after 共用） ────────────
  const pickPhotoFromLibrary = async (type: 'before' | 'after') => {
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
      const uri = result.assets[0].uri;
      if (type === 'before') {
        setPhotoUri(uri);
      } else {
        stopTimer();
        setAfterPhotoUri(uri);
        setIsFinished(true);
      }
      setPhotoModalType(null);
    }
  };

  // ── 写真を選択ボタン → モーダル（before 用）を開く ──────────
  const handlePickPhoto = () => {
    setPhotoModalType('before');
  };

  // ── 全 State をリセットして初期状態に戻す ──────────────────
  const resetCameraScreen = () => {
    setHomeworkName('');
    setSelectedSubject(null);
    setSubjectOpen(false);
    setPhotoUri(null);
    setShowErrorModal(false);
    setShowSuccessModal(false);
    setIsChallenging(false);
    setSecondsElapsed(0);
    setPhotoModalType(null);
    setAfterPhotoUri(null);
    setIsFinished(false);
    setIsScoring(false);
    setIsResult(false);
    setIsBackendError(false);
    setSubmitErrorMessage(null);
    setSubmitResult(null);
    stopTimer();
  };

  // ── 宿題を完了する：API送信 → 採点中 → 結果へ ────────────
  const handleSubmitHomework = async () => {
    const trimmedHomeworkName = homeworkName.trim();

    if (!photoUri || !afterPhotoUri || !selectedSubject || !trimmedHomeworkName) {
      Alert.alert(
        '入力不足',
        '提出する前に、宿題の名前・科目・挑戦前の写真・挑戦後の写真がそろっているか確認してください。'
      );
      return;
    }

    setIsBackendError(false);
    setSubmitErrorMessage(null);
    setIsScoring(true);

    try {
      const result = await submitQuest({
        beforeImage: buildUploadImage(photoUri, 'before.jpg'),
        afterImage: buildUploadImage(afterPhotoUri, 'after.jpg'),
        subject: selectedSubject,
        topic: trimmedHomeworkName,
      });

      if (!isMountedRef.current) return;
      const adviceText =
        result.data.aiResult.feedback_to_child ?? result.data.aiResult.summary ?? null;

      setLatestAdviceText(adviceText);
      prependRewardHistory({
        id: result.data.id,
        subject: selectedSubject,
        topic: trimmedHomeworkName,
        createdAt: new Date().toISOString(),
        earnedPoints: result.earnedPoints,
      });
      setSubmitResult(result);
      setIsBackendError(false);
      setSubmitErrorMessage(null);
      setIsScoring(false);
      setIsResult(true);
    } catch (e: unknown) {
      if (!isMountedRef.current) return;
      const message = getApiErrorMessage(e, '宿題の送信に失敗しました。');
      Alert.alert(
        '送信エラー',
        `宿題の送信に失敗しました。\n時間をおいて再度お試しください。\n\n${message}`
      );
      setIsBackendError(true);
      setSubmitErrorMessage(message);
      setIsScoring(false);
      setIsResult(true);
    }
  };

  // ── 登録するボタン：バリデーション ───────────────────────
  const handleRegister = () => {
    const trimmedHomeworkName = homeworkName.trim();

    if (!photoUri || !trimmedHomeworkName || !selectedSubject) {
      setShowErrorModal(true);
      return;
    }
    setShowSuccessModal(true);
  };

  return (
    <ImageBackground
      source={require('../../asset/camera/images/background screen.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {isResult ? (
          /* ══════════ 採点結果画面 ══════════ */
          <ScrollView
            contentContainerStyle={styles.resultScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* バックエンドエラー時のみ赤文字表示 */}
            {isBackendError && (
              <>
                <AppText style={styles.backendErrorText}>送信エラー</AppText>
                <AppText style={styles.backendErrorDetailText}>
                  {submitErrorMessage ?? '宿題の送信に失敗しました。'}
                </AppText>
              </>
            )}

            {/* SCORE：（エラー時はスコア数値なし） */}
            <AppText style={styles.resultScore}>
              {isBackendError
                ? 'SCORE：'
                : `SCORE：${submitResult?.data?.aiResult?.total_score ?? 0}点`}
            </AppText>

            {/* 二重線 */}
            <View style={styles.resultScoreDividerWrap}>
              <View style={styles.resultScoreDividerLine} />
              <View style={[styles.resultScoreDividerLine, { marginTop: 3 }]} />
            </View>

            {/* 写真枠：エラー時は挑戦前のみ1枚表示 */}
            <View style={styles.resultPhotosRow}>
              {/* 左：挑戦前の写真（beforePhotoUri = photoUri） */}
              <View style={styles.resultPhotoBox}>
                {photoUri && (
                  <Image source={{ uri: photoUri }} style={styles.completionPhotoImg} resizeMode="cover" />
                )}
              </View>
              {/* 右：挑戦後の写真（エラー時は非表示） */}
              {!isBackendError && (
                <View style={styles.resultPhotoBox}>
                  {afterPhotoUri && (
                    <Image source={{ uri: afterPhotoUri }} style={styles.completionPhotoImg} resizeMode="cover" />
                  )}
                </View>
              )}
            </View>

            {/* 評価項目：エラー時は星なし・ラベルのみ */}
            <View style={styles.ratingContainer}>
              <AppText style={styles.ratingText}>
                {`作業量：${isBackendError ? '' : renderStars(submitResult?.data?.aiResult?.score_breakdown?.volume ?? 0)}`}
              </AppText>
              <AppText style={styles.ratingText}>
                {`過程：${isBackendError ? '' : renderStars(submitResult?.data?.aiResult?.score_breakdown?.process ?? 0)}`}
              </AppText>
              <AppText style={styles.ratingText}>
                {`丁寧さ：${isBackendError ? '' : renderStars(submitResult?.data?.aiResult?.score_breakdown?.carefulness ?? 0)}`}
              </AppText>
              <AppText style={styles.ratingText}>
                {`振り返り：${isBackendError ? '' : renderStars(submitResult?.data?.aiResult?.score_breakdown?.review ?? 0)}`}
              </AppText>
            </View>

            {/* AIアドバイスボタン画像（エラー時は Button M2.png に切り替え） */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.resultButtonWrap}
              onPress={() => {
                if (!isBackendError) {
                  setHasNewAdvice(true);
                  setOpenAdviceDirectly(true);
                }
                setHomework(null);
                resetCameraScreen();
                navigation.navigate('Reward');
              }}
            >
              <Image
                source={
                  isBackendError
                    ? require('../../asset/camera/images/Button M2.png')
                    : require('../../asset/camera/images/Button M.png')
                }
                style={styles.buttonMImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* 振り返りを終わるボタン画像 */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.resultButtonWrap}
              onPress={() => {
                if (!isBackendError) {
                  setHasNewAdvice(true);
                }
                setHomework(null);
                resetCameraScreen();
                navigation.navigate('Home');
              }}
            >
              <Image
                source={require('../../asset/camera/images/Button S.png')}
                style={styles.buttonSImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <View style={styles.bottomPad} />
          </ScrollView>

        ) : isScoring ? (
          /* ══════════ 採点中画面 ══════════ */
          <View style={styles.scoringWrapper}>
            {/* 宝箱とテキストを1つの Animated.View で囲んで上下ループアニメーション */}
            <Animated.View
              style={[
                styles.scoringAnimated,
                { transform: [{ translateY: bounceAnim }] },
              ]}
            >
              <Image
                source={require('../../asset/camera/images/Chest.png')}
                style={styles.chestScoring}
                resizeMode="contain"
              />
              <AppText style={styles.scoringText}>採点中...</AppText>
            </Animated.View>
          </View>

        ) : isFinished ? (
          /* ══════════ 完了画面 UI ══════════ */
          <ScrollView
            contentContainerStyle={styles.completionScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* タイトル */}
            <AppText style={styles.completionTitle}>
              {'写真を登録して\n宿題を完了させよう！'}
            </AppText>

            {/* 挑戦前・挑戦後の写真を横並び */}
            <View style={styles.completionPhotosRow}>
              <View style={styles.completionPhotoBox}>
                {photoUri && (
                  <Image source={{ uri: photoUri }} style={styles.completionPhotoImg} resizeMode="cover" />
                )}
              </View>
              <View style={styles.completionPhotoBox}>
                {afterPhotoUri && (
                  <Image source={{ uri: afterPhotoUri }} style={styles.completionPhotoImg} resizeMode="cover" />
                )}
              </View>
            </View>

            {/* 宿題を完了するボタン */}
            <TouchableOpacity
              style={styles.completeButton}
              activeOpacity={0.8}
              onPress={handleSubmitHomework}
            >
              <AppText style={styles.completeButtonText}>宿題を完了する</AppText>
            </TouchableOpacity>

            <View style={styles.bottomPad} />
          </ScrollView>

        ) : isChallenging ? (
          /* ══════════ 挑戦中 UI ══════════ */
          <View style={styles.challengeWrapper}>

            {/* 1. 赤い角丸情報ボックス */}
            <View style={styles.challengeInfoBox}>
              <AppText style={styles.challengeInfoText}>
                {GRADE + '：' + (selectedSubject ?? '') + '\n' + homeworkName + '\nに挑戦中！'}
              </AppText>
            </View>

            {/* 2. タイマー */}
            <AppText style={styles.timerText}>{formatTime(secondsElapsed)}</AppText>

            {/* 3. 宿題を終えた！ボタン → 写真撮影モーダルを開く */}
            <TouchableOpacity
              style={styles.finishButton}
              activeOpacity={0.8}
              onPress={() => setPhotoModalType('after')}
            >
              <AppText style={styles.finishButtonText}>おわった宿題を{'\n'}すぐ写真に撮る！</AppText>
            </TouchableOpacity>

            {/* 4. キャラクターと宝箱エリア */}
            <View style={styles.charactersArea}>
              <Image
                source={require('../../asset/camera/images/Character on the left.png')}
                style={styles.charLeft}
                resizeMode="contain"
              />
              <Image
                source={require('../../asset/camera/images/Chest.png')}
                style={styles.chest}
                resizeMode="contain"
              />
              <Image
                source={require('../../asset/camera/images/Character on the right.png')}
                style={styles.charRight}
                resizeMode="contain"
              />
            </View>

            {/* タブバー分の余白 */}
            <View style={styles.bottomPad} />
          </View>

        ) : (
          /* ══════════ 入力フォーム UI ══════════ */
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
                <AppText style={styles.registerButtonText}>この宿題に挑戦！</AppText>
              </TouchableOpacity>

              {/* タブバー（オーバーレイ）分の余白 */}
              <View style={styles.bottomPad} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── 写真撮影モーダル（Alerts photo.png）── before/after 共用 */}
        {photoModalType !== null && (
          <View style={styles.modalOverlay}>
            <View style={styles.alertPhotoContainer}>
              <Image
                source={require('../../asset/camera/images/Alerts photo.png')}
                style={styles.alertPhotoImage}
                resizeMode="contain"
              />
              {/* 「やめる」ヒットボックス：左列 */}
              <TouchableOpacity
                style={styles.photoModalCancelHitbox}
                onPress={() => setPhotoModalType(null)}
                activeOpacity={0.7}
              />
              {/* 「アルバム」ヒットボックス：中列 */}
              <TouchableOpacity
                style={styles.photoModalAlbumHitbox}
                onPress={() => pickPhotoFromLibrary(photoModalType)}
                activeOpacity={0.7}
              />
              {/* 「写真をとる」ヒットボックス：右列 */}
              <TouchableOpacity
                style={styles.photoModalCameraHitbox}
                onPress={() => pickPhotoFromCamera(photoModalType)}
                activeOpacity={0.7}
              />
            </View>
          </View>
        )}

        {/* ── エラーモーダル（Alerts.png）── */}
        {showErrorModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.alertContainer}>
              <Image
                source={require('../../asset/camera/images/Alerts.png')}
                style={styles.alertImage}
                resizeMode="contain"
              />
              {/* × 閉じるヒットボックス：Figma上 y≈74%・横方向中央 */}
              <TouchableOpacity
                style={styles.alertCloseHitbox}
                onPress={() => setShowErrorModal(false)}
                activeOpacity={0.7}
              />
            </View>
          </View>
        )}

        {/* ── 成功モーダル（Dialog.png）── */}
        {showSuccessModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.dialogContainer}>
              <Image
                source={require('../../asset/camera/images/Dialog.png')}
                style={styles.dialogImage}
                resizeMode="contain"
              />
              {/* 「挑戦しない」ヒットボックス：左列・下部 */}
              <TouchableOpacity
                style={styles.dialogCancelHitbox}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.7}
              />
              {/* 「挑戦する！」ヒットボックス：右列・下部 */}
              <TouchableOpacity
                style={styles.dialogConfirmHitbox}
                onPress={() => {
                  // ホーム画面に宿題情報を反映（Contextを更新）
                  setHomework({
                    grade: GRADE,
                    subject: selectedSubject ?? '',
                    name: homeworkName.trim(),
                  });
                  setShowSuccessModal(false);
                  setSecondsElapsed(0);
                  setIsChallenging(true);
                }}
                activeOpacity={0.7}
              />
            </View>
          </View>
        )}

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

  // ════════════════════════════════════════
  //  採点中 UI（isScoring === true）
  // ════════════════════════════════════════

  // 採点中画面のルートコンテナ
  scoringWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Animated.View（宝箱 + テキストを一体でアニメーション）
  scoringAnimated: {
    alignItems: 'center',
  },

  // 宝箱画像（採点中）
  // Figma: 画面中央に大きく配置
  chestScoring: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5 * 0.78,
  },

  // 「採点中...」テキスト
  // Figma: fontSize:40, DotGothic16, 白文字, 中央揃え
  scoringText: {
    fontSize: 40,
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 20,
  },

  // ════════════════════════════════════════
  //  採点結果画面 UI（isResult === true）
  // ════════════════════════════════════════

  resultScrollContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 19,
    paddingBottom: 20,
  },

  // 「SCORE：80点」タイトル
  // Figma: fontSize:32, DotGothic16, 白文字, 中央揃え
  resultScore: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
  },

  // スコア下の二重線コンテナ
  resultScoreDividerWrap: {
    width: SCREEN_WIDTH - 38,
    marginBottom: 16,
  },

  // 二重線の1本（2本並べることで二重線を表現）
  resultScoreDividerLine: {
    height: 2,
    backgroundColor: '#FFFFFF',
  },

  // 挑戦前・挑戦後の写真横並び（結果画面）
  resultPhotosRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },

  // 結果画面の写真ボックス
  // Figma: width:117, height:161, border:2px #fffbfb
  resultPhotoBox: {
    width: RESULT_BOX_W,
    height: RESULT_BOX_H,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(20, 20, 20, 0.45)',
    overflow: 'hidden',
  },

  // 評価項目（星）のコンテナ
  ratingContainer: {
    width: '100%',
    paddingLeft: 4,
    marginBottom: 16,
  },

  // 各評価行のテキスト
  // Figma: fontSize:20, DotGothic16, 白文字, 左揃え, lineHeight:36
  ratingText: {
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 1,
    lineHeight: 36,
  },

  // バックエンドエラーテキスト（赤文字・上部）
  // Figma: fontSize:32, DotGothic16, 赤文字, 中央揃え
  backendErrorText: {
    fontSize: 28,
    color: '#ff0000',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 4,
  },
  backendErrorDetailText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
    paddingHorizontal: 20,
  },

  // ボタン画像共通：中央揃えのラッパー
  resultButtonWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },

  // Button M.png / Button M2.png（AIアドバイスボタン画像）
  // Figma: width:291, height:96
  buttonMImage: {
    width: BUTTON_M_W,
    height: BUTTON_M_H,
  },

  // Button S.png（振り返りを終わるボタン画像）
  // Figma: width:175, height:44
  buttonSImage: {
    width: BUTTON_S_W,
    height: BUTTON_S_H,
  },

  // ════════════════════════════════════════
  //  完了画面 UI（isFinished === true）
  // ════════════════════════════════════════

  completionScrollContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },

  // タイトル: Figma fontSize:32, 中央揃え
  completionTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 44,
    marginBottom: 24,
  },

  // 2枚の写真ボックスを横並びにするコンテナ
  completionPhotosRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    paddingHorizontal: 19,
  },

  // 挑戦前・挑戦後の写真枠（各 166×208 相当）
  // Figma: border:2px #fffbfb, bg:#1e1e1e
  completionPhotoBox: {
    width: COMPLETION_BOX_W,
    height: COMPLETION_BOX_H,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(20, 20, 20, 0.45)',
    overflow: 'hidden',
  },

  completionPhotoImg: {
    width: '100%',
    height: '100%',
  },

  // 「宿題を完了する」ボタン
  // Figma: width:204, height:71, bg:#1e3c9f, border:white
  completeButton: {
    backgroundColor: '#1e3c9f',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    width: SCREEN_WIDTH * 0.52,
    height: 71,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  completeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ════════════════════════════════════════
  //  挑戦中 UI
  // ════════════════════════════════════════

  // 挑戦中画面のルートコンテナ
  challengeWrapper: {
    flex: 1,
    alignItems: 'center',
  },

  // 赤い角丸ボックス
  // Figma: left:19, top:25, width:361, height:144, borderRadius:50, bg:#9f1e1e
  challengeInfoBox: {
    width: SCREEN_WIDTH - 38,     // 19px margin × 2
    marginTop: 24,
    marginHorizontal: 19,
    backgroundColor: '#9f1e1e',
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 144,
  },
  challengeInfoText: {
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 40,
  },

  // タイマー
  // Figma: fontSize:48, centered
  timerText: {
    fontSize: 52,
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 28,
    marginBottom: 16,
  },

  // 「宿題を終えた！」ボタン
  // Figma: width:204, height:71, bg:#1e3c9f, border:white
  finishButton: {
    backgroundColor: '#1e3c9f',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    width: SCREEN_WIDTH * 0.52,
    height: 71,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  finishButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // キャラクター + 宝箱 エリア
  // タイマーとフィニッシュボタンのちょうど中間あたりの高さに絶対配置する。
  // challengeWrapper（flex:1）を基準に top を指定。
  charactersArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '25%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  charLeft: {
    width: SCREEN_WIDTH * 0.33,
    height: SCREEN_WIDTH * 1.1 * (113 / 126),
  },
  chest: {
    flex: 1,
    height: SCREEN_WIDTH * 0.42,
  },
  charRight: {
    width: SCREEN_WIDTH * 0.25,
    height: SCREEN_WIDTH * 0.8 * (128 / 95),
  },

  // ════════════════════════════════════════
  //  カスタムモーダル共通
  // ════════════════════════════════════════
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },

  // ── 写真モーダル（Alerts photo.png） ──────
  // やめる／アルバム／写真をとる の3ボタン横並びを想定
  alertPhotoContainer: {
    width: ALERT_PHOTO_W,
    height: ALERT_PHOTO_H,
  },
  alertPhotoImage: {
    width: ALERT_PHOTO_W,
    height: ALERT_PHOTO_H,
  },
  // 「やめる」 ← 左列（0〜33%）・下部60%〜
  photoModalCancelHitbox: {
    position: 'absolute',
    left: 0,
    width: ALERT_PHOTO_W * 0.33,
    top: ALERT_PHOTO_H * 0.55,
    bottom: 0,
  },
  // 「アルバム」 ← 中列（33〜66%）・下部60%〜
  photoModalAlbumHitbox: {
    position: 'absolute',
    left: ALERT_PHOTO_W * 0.33,
    width: ALERT_PHOTO_W * 0.34,
    top: ALERT_PHOTO_H * 0.55,
    bottom: 0,
  },
  // 「写真をとる」 ← 右列（66〜100%）・下部60%〜
  photoModalCameraHitbox: {
    position: 'absolute',
    left: ALERT_PHOTO_W * 0.67,
    right: 0,
    top: ALERT_PHOTO_H * 0.55,
    bottom: 0,
  },

  // ── エラーモーダル（Alerts.png） ──────────
  alertContainer: {
    width: ALERT_IMG_W,
    height: ALERT_IMG_H,
  },
  alertImage: {
    width: ALERT_IMG_W,
    height: ALERT_IMG_H,
  },
  // × ボタンのヒットボックス
  // Figma上: y ≈ 74% から底、横方向は中央寄り
  alertCloseHitbox: {
    position: 'absolute',
    top: ALERT_IMG_H * 0.72,
    left: ALERT_IMG_W * 0.33,
    right: ALERT_IMG_W * 0.33,
    bottom: ALERT_IMG_H * 0.04,
  },

  // ── 成功モーダル（Dialog.png） ───────────
  dialogContainer: {
    width: DIALOG_IMG_W,
    height: DIALOG_IMG_H,
  },
  dialogImage: {
    width: DIALOG_IMG_W,
    height: DIALOG_IMG_H,
  },
  // 「挑戦しない」ヒットボックス（左半分・下部）
  // Figma: ボタン行は下部 ~31%、左ボタンは幅の左半分
  dialogCancelHitbox: {
    position: 'absolute',
    left: DIALOG_IMG_W * 0.02,
    right: DIALOG_IMG_W * 0.52,
    bottom: DIALOG_IMG_H * 0.03,
    height: DIALOG_IMG_H * 0.29,
  },
  // 「挑戦する！」ヒットボックス（右半分・下部）
  dialogConfirmHitbox: {
    position: 'absolute',
    left: DIALOG_IMG_W * 0.52,
    right: DIALOG_IMG_W * 0.02,
    bottom: DIALOG_IMG_H * 0.03,
    height: DIALOG_IMG_H * 0.29,
  },
});
