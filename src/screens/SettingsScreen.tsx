import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  ImageBackground,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/AppText';

// ─── 型定義 ────────────────────────────────────────────────────────────────

type SectionKey = 'notification' | 'volume' | 'logout' | 'howto' | 'about';

type HowtoTopic = 'home' | 'camera' | 'reward';

type HowtoPageLayout =
  | 'home1' | 'home2' | 'home3' | 'home4'
  | 'camera1' | 'camera2' | 'camera3' | 'camera4'
  | 'reward1' | 'reward2' | 'reward3' | 'reward4';

type HowtoPage = {
  layout: HowtoPageLayout;
  title: string;
  subtitle?: string;
  bodyTitle: string;
  bodyText: string;
};

// ─── 定数 ──────────────────────────────────────────────────────────────────

const SECTIONS: Array<{ key: SectionKey; label: string; icon: string }> = [
  { key: 'notification', label: '通知設定', icon: '⏰' },
  { key: 'volume', label: 'BGM / SE 音量', icon: '🔊' },
  { key: 'howto', label: '使い方・遊び方・コツ', icon: '❓' },
  { key: 'about', label: 'クレジット・制作者・バージョン', icon: '📄' },
  { key: 'logout', label: 'ログアウト', icon: '⏏️' },
];

const STORAGE_KEYS = {
  userName: 'settings_userName',
  notificationsEnabled: 'settings_notificationsEnabled',
  bgmEnabled: 'settings_bgmEnabled',
  seEnabled: 'settings_seEnabled',
  bgmVolume: 'settings_bgmVolume',
  seVolume: 'settings_seVolume',
} as const;

// ─── タブヘッダー画像マップ ────────────────────────────────────────────────────

const SECTION_HEADER_IMAGES: Record<SectionKey, ReturnType<typeof require>> = {
  notification: require('../../asset/settings/images/Notification settings.png'),
  volume: require('../../asset/settings/images/BGM Settings.png'),
  logout: require('../../asset/settings/images/Logout.png'),
  howto: require('../../asset/settings/images/How to use.png'),
  about: require('../../asset/settings/images/credit.png'),
};

// ─── How-to 画像マップ ───────────────────────────────────────────────────────
// asset/settings/images/ 配下の画像を参照する。
// 画像が未配置の場合はビルドエラーになるため、実際のファイル配置に合わせて管理すること。

const howtoImages: Record<HowtoPageLayout, ReturnType<typeof require>> = {
  home1: require('../../asset/settings/images/image 3.png'),
  home2: require('../../asset/settings/images/image 4.png'),
  home3: require('../../asset/settings/images/image 5.png'),
  home4: require('../../asset/settings/images/image 6.png'),
  camera1: require('../../asset/settings/images/image 11.png'),
  camera2: require('../../asset/settings/images/image 12.png'),
  camera3: require('../../asset/settings/images/image 13.png'),
  camera4: require('../../asset/settings/images/image 14.png'),
  reward1: require('../../asset/settings/images/image 7.png'),
  reward2: require('../../asset/settings/images/image 8.png'),
  reward3: require('../../asset/settings/images/image 9.png'),
  reward4: require('../../asset/settings/images/image 10.png'),
};

// ─── How-to コンテンツ定義 ──────────────────────────────────────────────────

const howtoPages: Record<HowtoTopic, HowtoPage[]> = {
  home: [
    {
      layout: 'home1',
      title: "let's challenge!",
      subtitle: '宿題を登録して取り組もう！',
      bodyTitle: 'ホーム画面の遊び方 (1)',
      bodyText: 'はじめてみようときには、うえの画面にある「＋」ボタンをおして、宿題を登録してみよう！',
    },
    {
      layout: 'home2',
      title: "let's challenge!",
      subtitle: '中1数学：文字と式\n小6国語：漢字ドリル\n中1歴史：歴史',
      bodyTitle: 'ホーム画面の遊び方 (2)',
      bodyText: 'この画面では、宿題の種類とたいせつなポイントを確認しながら、あそぶことができるよ。',
    },
    {
      layout: 'home3',
      title: "let's challenge!",
      subtitle: 'Game 60min\nSmartphone 60min\nLevel 1',
      bodyTitle: 'ホーム画面の遊び方 (3)',
      bodyText: 'たくさんの宿題に挑戦すると、スマホやゲームの時間（ゲージ）がふえていくよ。',
    },
    {
      layout: 'home4',
      title: "let's challenge!",
      subtitle: '伝説の勇者\n匿名さん',
      bodyTitle: 'ホーム画面の遊び方 (4)',
      bodyText: 'たくさんの宿題に挑戦すると「伝説の勇者」の称号がもらえるよ。がんばってみよう！',
    },
  ],
  camera: [
    {
      layout: 'camera1',
      title: '写真を登録して宿題を完了させよう！',
      bodyTitle: 'カメラ画面のコツ (1)',
      bodyText: 'あたらしい宿題を登録するときは、「写真を選択」ボタンで写真をとってね。きれいにとれたら正解しやすいよ。',
    },
    {
      layout: 'camera2',
      title: '宿題の名前と学年を記入',
      bodyTitle: 'カメラ画面のコツ (2)',
      bodyText: '「宿題の名前」「学年」「科目」を入力して「登録する」を押すと、宿題を追加できるよ。',
    },
    {
      layout: 'camera3',
      title: 'どの宿題に挑戦する？',
      bodyTitle: 'カメラ画面のコツ (3)',
      bodyText: '宿題のリストから挑戦したいものを選んで、ゲームスタート！',
    },
    {
      layout: 'camera4',
      title: '写真を登録して宿題を完了させよう！',
      bodyTitle: 'カメラ画面のコツ (4)',
      bodyText: '写真を登録したら、「宿題を完了する」ボタンでチェックしてみよう。報酬がもらえるよ！',
    },
  ],
  reward: [
    {
      layout: 'reward1',
      title: 'あと+10EXPでLv.2',
      subtitle: 'もっと見る',
      bodyTitle: 'リワード画面の使い方 (1)',
      bodyText: 'みどりのバーは宿題でたまった経験値（EXP）だよ。たくさん宿題をこなすとレベル2になるよ。',
    },
    {
      layout: 'reward2',
      title: 'あと+10EXPでLv.2',
      subtitle: '（小さくする）',
      bodyTitle: 'リワード画面の使い方 (2)',
      bodyText: 'ここでは、終わった宿題の一覧と獲得したEXPが見られるよ。',
    },
    {
      layout: 'reward3',
      title: 'AIのアドバイスを見てみる',
      subtitle: '新しいメッセージが来ています',
      bodyTitle: 'リワード画面の使い方 (3)',
      bodyText: 'AIのフィードバックを読んで、次の宿題でよりよい成績をめざそう。',
    },
    {
      layout: 'reward4',
      title: '今日',
      subtitle: '戻る',
      bodyTitle: 'リワード画面の使い方 (4)',
      bodyText: '○○さん、お疲れさまでした！がんばったところや、もっとこうすると良いところが見られるよ。',
    },
  ],
};

// ─── メインコンポーネント ────────────────────────────────────────────────────

export default function SettingsScreen() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState<SectionKey | null>(null);

  // ユーザー名
  const [userName, setUserName] = useState('匿名さん');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  // 通知
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // BGM / SE
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [seEnabled, setSeEnabled] = useState(true);
  const [bgmVolume, setBgmVolume] = useState(0.8);
  const [seVolume, setSeVolume] = useState(0.6);

  // 使い方モーダル
  const [howtoModalVisible, setHowtoModalVisible] = useState(false);
  const [howtoModalTopic, setHowtoModalTopic] = useState<HowtoTopic>('home');
  const [howtoModalPage, setHowtoModalPage] = useState(0);

  // ── 永続化ヘルパー ────────────────────────────────────────────────────────

  const persistValue = async <T,>(key: string, value: T) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // 書き込みエラーは無視
    }
  };

  // ── 設定の読み込み ────────────────────────────────────────────────────────

  const loadStoredSettings = async () => {
    try {
      const [userNameRaw, notificationsRaw, bgmEnabledRaw, seEnabledRaw, bgmVolumeRaw, seVolumeRaw] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.userName),
          AsyncStorage.getItem(STORAGE_KEYS.notificationsEnabled),
          AsyncStorage.getItem(STORAGE_KEYS.bgmEnabled),
          AsyncStorage.getItem(STORAGE_KEYS.seEnabled),
          AsyncStorage.getItem(STORAGE_KEYS.bgmVolume),
          AsyncStorage.getItem(STORAGE_KEYS.seVolume),
        ]);
      if (userNameRaw) setUserName(JSON.parse(userNameRaw));
      if (notificationsRaw) setNotificationsEnabled(JSON.parse(notificationsRaw));
      if (bgmEnabledRaw) setBgmEnabled(JSON.parse(bgmEnabledRaw));
      if (seEnabledRaw) setSeEnabled(JSON.parse(seEnabledRaw));
      if (bgmVolumeRaw) setBgmVolume(JSON.parse(bgmVolumeRaw));
      if (seVolumeRaw) setSeVolume(JSON.parse(seVolumeRaw));
    } catch (_) {
      // 読み込みエラーは無視
    }
  };

  useEffect(() => {
    loadStoredSettings();
  }, []);

  // ── セクション開閉 ────────────────────────────────────────────────────────

  const toggleExpand = (key: SectionKey) => {
    setExpanded((prev) => {
      const next = prev === key ? null : key;
      if (next !== 'howto') {
        setHowtoModalVisible(false);
        setHowtoModalPage(0);
      }
      return next;
    });
  };

  // ── ユーザー名編集 ────────────────────────────────────────────────────────

  const openNameEditor = () => {
    setNameDraft(userName);
    setEditingName(true);
  };

  const saveName = () => {
    setUserName(nameDraft);
    persistValue(STORAGE_KEYS.userName, nameDraft);
    setEditingName(false);
  };

  const cancelNameEdit = () => {
    setEditingName(false);
  };

  // ── ログアウト ────────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert('ログアウト', '本当にログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: () => {} },
    ]);
  };

  // ── How-to モーダル ───────────────────────────────────────────────────────

  const renderHowtoModal = () => {
    const pages = howtoPages[howtoModalTopic];
    const pageIndex = Math.min(Math.max(howtoModalPage, 0), pages.length - 1);
    const page = pages[pageIndex];

    const window = Dimensions.get('window');
    const targetWidth = 280 * 1.2;
    const targetHeight = 440 * 1.2;
    const maxWidthLimit = window.width - 40;
    const maxHeightLimit = window.height - 40;
    const scale = Math.min(1, maxWidthLimit / targetWidth, maxHeightLimit / targetHeight);
    const modalWidth = targetWidth * scale;
    const modalHeight = targetHeight * scale;

    const source = howtoImages[page.layout];
    const { width: imgW, height: imgH } = Image.resolveAssetSource(source);

    let imageWidth = modalWidth * 0.7;
    let imageHeight = imageWidth * (imgH / imgW);
    const maxImageHeight = modalHeight * 0.55;
    if (imageHeight > maxImageHeight) {
      imageHeight = maxImageHeight;
      imageWidth = imageHeight * (imgW / imgH);
    }

    return (
      <Modal
        visible={howtoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHowtoModalVisible(false)}
      >
        <View style={styles.howtoModalOverlay}>
          <View style={[styles.howtoModalContent, { width: modalWidth, height: modalHeight }]}>
            {/* ヘッダー */}
            <View style={styles.howtoModalHeader}>
              <AppText style={styles.howtoModalTitle}>{page.title}</AppText>
              <TouchableOpacity
                style={styles.howtoModalCloseButton}
                onPress={() => setHowtoModalVisible(false)}
                activeOpacity={0.7}
              >
                <AppText style={styles.howtoModalCloseText}>✕</AppText>
              </TouchableOpacity>
            </View>

            {/* メインエリア（画像 + 説明） */}
            <View style={styles.howtoModalMain}>
              <View style={styles.howtoModalImageWrapper}>
                <Image
                  source={source}
                  style={{ width: imageWidth, height: imageHeight }}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.howtoModalBody}>
                <AppText style={styles.howtoModalBodyTitle}>{page.bodyTitle}</AppText>
                <AppText style={styles.howtoModalBodyText}>{page.bodyText}</AppText>
              </View>
            </View>

            {/* フッター（ページネーション） */}
            <View style={styles.howtoModalFooter}>
              <TouchableOpacity
                style={styles.howtoModalNavButton}
                disabled={howtoModalPage <= 0}
                onPress={() => setHowtoModalPage((prev) => Math.max(0, prev - 1))}
                activeOpacity={0.7}
              >
                <AppText style={styles.howtoModalNavText}>{'＜'}</AppText>
              </TouchableOpacity>
              <AppText style={styles.howtoModalPageText}>
                {`${howtoModalPage + 1}/${pages.length}`}
              </AppText>
              <TouchableOpacity
                style={styles.howtoModalNavButton}
                disabled={howtoModalPage >= pages.length - 1}
                onPress={() => setHowtoModalPage((prev) => Math.min(pages.length - 1, prev + 1))}
                activeOpacity={0.7}
              >
                <AppText style={styles.howtoModalNavText}>{'＞'}</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ── セクション本体 ────────────────────────────────────────────────────────

  const renderSectionBody = (key: SectionKey) => {
    switch (key) {
      case 'notification':
        return (
          <View style={styles.notificationSection}>
            <View style={styles.notificationHint}>
              <View style={styles.notificationHintRow}>
                <AppText style={styles.notificationHintIcon}>🔕</AppText>
                <AppText style={styles.notificationHintText}>なら、通知をオフ</AppText>
              </View>
              <View style={styles.notificationHintRow}>
                <AppText style={styles.notificationHintIcon}>⏰</AppText>
                <AppText style={styles.notificationHintText}>なら、通知をオン</AppText>
              </View>
              <AppText style={styles.notificationHintFooter}>
                {notificationsEnabled ? '⏰に設定されています' : '🔕に設定されています'}
              </AppText>
            </View>
            <View style={styles.notificationButtons}>
              <TouchableOpacity
                style={[
                  styles.notificationButton,
                  !notificationsEnabled && styles.notificationButtonActive,
                ]}
                onPress={() => {
                  setNotificationsEnabled(false);
                  persistValue(STORAGE_KEYS.notificationsEnabled, false);
                }}
                activeOpacity={0.7}
              >
                <AppText
                  style={[
                    styles.notificationButtonText,
                    !notificationsEnabled && styles.notificationButtonActiveText,
                  ]}
                >
                  通知を許可しない
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.notificationButton,
                  notificationsEnabled && styles.notificationButtonActive,
                  { marginBottom: 0 },
                ]}
                onPress={() => {
                  setNotificationsEnabled(true);
                  persistValue(STORAGE_KEYS.notificationsEnabled, true);
                }}
                activeOpacity={0.7}
              >
                <AppText
                  style={[
                    styles.notificationButtonText,
                    notificationsEnabled && styles.notificationButtonActiveText,
                  ]}
                >
                  通知を許可する
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'volume':
        return (
          <>
            <View style={styles.bodyRow}>
              <AppText style={styles.bodyText}>BGM 有効</AppText>
              <Switch
                value={bgmEnabled}
                onValueChange={(value) => {
                  setBgmEnabled(value);
                  persistValue(STORAGE_KEYS.bgmEnabled, value);
                }}
                trackColor={{ false: '#444', true: '#6d8cff' }}
                thumbColor={bgmEnabled ? '#cce0ff' : '#999'}
              />
            </View>
            <View style={[styles.bodyRow, !bgmEnabled && styles.disabledRow]}>
              <AppText style={styles.bodyText}>BGM 音量</AppText>
              <View style={styles.volumeControl}>
                <TouchableOpacity
                  style={styles.volumeButton}
                  disabled={!bgmEnabled}
                  onPress={() => {
                    const next = Math.max(0, Math.round((bgmVolume - 0.1) * 10) / 10);
                    setBgmVolume(next);
                    persistValue(STORAGE_KEYS.bgmVolume, next);
                  }}
                >
                  <AppText style={styles.volumeButtonText}>-</AppText>
                </TouchableOpacity>
                <AppText style={styles.volumeLabel}>{(bgmVolume * 100).toFixed(0)}%</AppText>
                <TouchableOpacity
                  style={styles.volumeButton}
                  disabled={!bgmEnabled}
                  onPress={() => {
                    const next = Math.min(1, Math.round((bgmVolume + 0.1) * 10) / 10);
                    setBgmVolume(next);
                    persistValue(STORAGE_KEYS.bgmVolume, next);
                  }}
                >
                  <AppText style={styles.volumeButtonText}>+</AppText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bodyRow}>
              <AppText style={styles.bodyText}>SE 有効</AppText>
              <Switch
                value={seEnabled}
                onValueChange={(value) => {
                  setSeEnabled(value);
                  persistValue(STORAGE_KEYS.seEnabled, value);
                }}
                trackColor={{ false: '#444', true: '#6d8cff' }}
                thumbColor={seEnabled ? '#cce0ff' : '#999'}
              />
            </View>
            <View style={[styles.bodyRow, !seEnabled && styles.disabledRow]}>
              <AppText style={styles.bodyText}>SE 音量</AppText>
              <View style={styles.volumeControl}>
                <TouchableOpacity
                  style={styles.volumeButton}
                  disabled={!seEnabled}
                  onPress={() => {
                    const next = Math.max(0, Math.round((seVolume - 0.1) * 10) / 10);
                    setSeVolume(next);
                    persistValue(STORAGE_KEYS.seVolume, next);
                  }}
                >
                  <AppText style={styles.volumeButtonText}>-</AppText>
                </TouchableOpacity>
                <AppText style={styles.volumeLabel}>{(seVolume * 100).toFixed(0)}%</AppText>
                <TouchableOpacity
                  style={styles.volumeButton}
                  disabled={!seEnabled}
                  onPress={() => {
                    const next = Math.min(1, Math.round((seVolume + 0.1) * 10) / 10);
                    setSeVolume(next);
                    persistValue(STORAGE_KEYS.seVolume, next);
                  }}
                >
                  <AppText style={styles.volumeButtonText}>+</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </>
        );

      case 'howto':
        return (
          <View style={styles.howtoSection}>
            <TouchableOpacity
              style={styles.guideButton}
              onPress={() => {
                setHowtoModalTopic('home');
                setHowtoModalPage(0);
                setHowtoModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <AppText style={styles.guideButtonText}>🏠 ホーム画面の遊び方について</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.guideButton}
              onPress={() => {
                setHowtoModalTopic('camera');
                setHowtoModalPage(0);
                setHowtoModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <AppText style={styles.guideButtonText}>📷 カメラ画面のコツについて</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.guideButton, { marginBottom: 0 }]}
              onPress={() => {
                setHowtoModalTopic('reward');
                setHowtoModalPage(0);
                setHowtoModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <AppText style={styles.guideButtonText}>🏆 リワード画面の使い方について</AppText>
            </TouchableOpacity>
            {renderHowtoModal()}
          </View>
        );

      case 'about':
        return (
          <View style={styles.bodyColumn}>
            <AppText style={styles.bodyText}>UI & Game Assets:</AppText>
            <AppText style={styles.bodyText}>
              "Pixel Design System" by Paolo Munna (Licensed under CC BY 4.0)
            </AppText>
            <AppText style={styles.bodyText}>
              "Pixel Game User Interface (Community)" by Maxim Tarasenkov (Licensed under CC BY 4.0)
            </AppText>
            <AppText style={styles.bodyText}>
              "1-Bit Platformer Pack" by Kenney (CC0 1.0)
            </AppText>
            <AppText style={styles.bodyText}>
              Illustrations: Akinori Matsuda - Adobe Stock
            </AppText>
            <AppText style={styles.bodyText}>Font:</AppText>
            <AppText style={styles.bodyText}>"Bitsy Pixels" by Paolo Munna</AppText>
            <AppText style={styles.bodyText}>
              "DotGothic16" by Fontworks Inc. (SIL Open Font License)
            </AppText>
            <AppText style={styles.bodyText}>制作者</AppText>
            <AppText style={styles.bodyText}>クエストロジックチーム</AppText>
            <AppText style={styles.bodyText}>バージョン</AppText>
            <AppText style={[styles.bodyText, styles.bodyTextLast]}>
              2026/02/27：ベータ版(1.00)
            </AppText>
          </View>
        );

      case 'logout':
        return (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <AppText style={styles.logoutButtonText}>ログアウト</AppText>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  // ── レンダリング ──────────────────────────────────────────────────────────

  return (
    <ImageBackground
      source={require('../../asset/settings/images/background screen.png.png')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.wrapper}>
        {/* トップバー（ユーザー名表示・編集） */}
        <View style={styles.topBar}>
          <View style={styles.topCharacterPlaceholder} />

          <TouchableOpacity style={styles.topCenter} onPress={openNameEditor} activeOpacity={0.8}>
            <View style={styles.topUnderline} />
            <AppText style={styles.topTitle}>{userName}</AppText>
          </TouchableOpacity>

          <Image
            source={require('../../asset/settings/images/edit-alt.png')}
            style={styles.topEditIconImage}
            resizeMode="contain"
          />
        </View>

        {/* ユーザー名編集モーダル */}
        <Modal
          visible={editingName}
          transparent
          animationType="fade"
          onRequestClose={cancelNameEdit}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <AppText style={styles.modalTitle}>表示名を編集</AppText>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                style={styles.modalInput}
                placeholder="名前を入力"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalButton} onPress={cancelNameEdit}>
                  <AppText style={styles.modalButtonText}>キャンセル</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={saveName}
                >
                  <AppText style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>
                    保存
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* セクション一覧 */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {SECTIONS.map((section) => {
            const isOpen = expanded === section.key;
            return (
              <View key={section.key} style={styles.sectionContainer}>
                <TouchableOpacity
                  onPress={() => toggleExpand(section.key)}
                  style={styles.sectionHeader}
                  activeOpacity={0.8}
                >
                  <Image
                    source={SECTION_HEADER_IMAGES[section.key]}
                    style={
                      section.key === 'about'
                        ? styles.tabImageCredit
                        : styles.tabImageNormal
                    }
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.sectionBody}>{renderSectionBody(section.key)}</View>
                )}
              </View>
            );
          })}
        </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ─── スタイル ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── レイアウト基盤 ─────────────────────────────────────────────────────────
  bgImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  wrapper: {
    flex: 1,
  },

  // ── トップバー ────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  topCharacterPlaceholder: {
    width: 42,
    height: 42,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topUnderline: {
    position: 'absolute',
    width: '60%',
    height: 2,
    transform: [{ translateY: 14 }],
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  topTitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 6,
  },
  topEditIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
  },
  topEditIconImage: {
    width: 28,
    height: 28,
  },

  // ── ユーザー名編集モーダル ─────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(15,15,25,0.95)',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modalTitle: {
    fontSize: 16,
    color: '#e3e3ff',
    marginBottom: 10,
  },
  modalInput: {
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#fff',
    marginBottom: 14,
    fontFamily: 'DotGothic16_400Regular',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonPrimary: {
    backgroundColor: 'rgba(110,140,255,0.18)',
    borderColor: 'rgba(110,140,255,0.3)',
  },
  modalButtonText: {
    fontSize: 14,
    color: '#c6c6db',
  },
  modalButtonPrimaryText: {
    color: '#e3e3ff',
  },

  // ── セクション共通 ────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
    marginHorizontal: 10,
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 38,
  },
  sectionContainer: {
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 0,
    overflow: 'hidden',
  },
  // 通常タブの画像（横幅いっぱいに表示）
  tabImageNormal: {
    width: '100%',
    height: 56,
  },
  // credit.png は小さめなので引き延ばさず左揃えで表示
  tabImageCredit: {
    width: 200,
    height: 44,
    alignSelf: 'flex-start',
  },
  sectionBody: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  disabledRow: {
    opacity: 0.45,
  },
  bodyColumn: {
    flexDirection: 'column',
  },
  bodyText: {
    fontSize: 14,
    color: '#c6c6db',
    marginBottom: 6,
  },
  bodyTextLast: {
    marginBottom: 0,
  },

  // ── 通知設定 ──────────────────────────────────────────────────────────────
  notificationSection: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 10,
    padding: 12,
  },
  notificationHint: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  notificationHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationHintIcon: {
    fontSize: 16,
    color: '#aab2ff',
    width: 20,
  },
  notificationHintText: {
    fontSize: 14,
    color: '#c6c6db',
  },
  notificationHintFooter: {
    fontSize: 14,
    color: '#c6c6db',
    marginTop: 6,
    textAlign: 'center',
  },
  notificationButtons: {
    flexDirection: 'column',
  },
  notificationButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 8,
  },
  notificationButtonActive: {
    borderColor: '#e33',
  },
  notificationButtonText: {
    fontSize: 15,
    color: '#c6c6db',
  },
  notificationButtonActiveText: {
    color: '#ff6b6b',
  },

  // ── 音量設定 ──────────────────────────────────────────────────────────────
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 140,
  },
  volumeButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  volumeButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  volumeLabel: {
    fontSize: 14,
    color: '#c6c6db',
    minWidth: 42,
    textAlign: 'center',
  },

  // ── 使い方セクション ──────────────────────────────────────────────────────
  howtoSection: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
  },
  guideButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ff2f2f',
    backgroundColor: '#dd1c1c',
    marginBottom: 10,
  },
  guideButtonText: {
    fontSize: 15,
    color: '#fff',
  },

  // ── 使い方モーダル ────────────────────────────────────────────────────────
  howtoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  howtoModalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  howtoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  howtoModalTitle: {
    fontSize: 16,
    color: '#e3e3ff',
  },
  howtoModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  howtoModalCloseText: {
    fontSize: 18,
    color: '#c6c6db',
  },
  howtoModalMain: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  howtoModalImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  howtoModalBody: {
    width: 318,
    height: 160,
    alignSelf: 'center',
    padding: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  howtoModalBodyTitle: {
    fontSize: 24,
    color: '#c6c6db',
    marginTop: 4,
    marginBottom: 6,
  },
  howtoModalBodyText: {
    fontSize: 14,
    color: '#c6c6db',
    lineHeight: 20,
  },
  howtoModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  howtoModalNavButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  howtoModalNavText: {
    fontSize: 13,
    color: '#c6c6db',
  },
  howtoModalPageText: {
    fontSize: 13,
    color: '#c6c6db',
  },

  // ── ログアウト ────────────────────────────────────────────────────────────
  logoutButton: {
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff2f2f',
    backgroundColor: '#dc1c1c',
  },
  logoutButtonText: {
    fontSize: 15,
    color: '#fff',
  },
});
