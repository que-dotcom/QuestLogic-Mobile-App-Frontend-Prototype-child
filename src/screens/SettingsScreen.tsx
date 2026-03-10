import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ImageBackground,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import { useAuth } from '../context/AuthContext';
import { useBGM, BgmCategory } from '../context/BGMContext';
import { getDevices, addDevice, deleteDevice, getAiSettings, updateAiSettings } from '../api/family';
import { getInviteCode, joinFamily } from '../api/users';
import * as Clipboard from 'expo-clipboard';
import type { Device, AiSettings } from '../types/api';

// ─── 型定義 ────────────────────────────────────────────────────────────────

type SectionKey = 'notification' | 'volume' | 'logout' | 'howto' | 'about' | 'devices' | 'aiSettings' | 'inviteCode' | 'joinFamily';

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

const SECTIONS: Array<{ key: SectionKey; label: string; icon: string; parentOnly?: boolean; childOnly?: boolean }> = [
  { key: 'notification', label: '通知設定', icon: '⏰' },
  { key: 'volume', label: 'BGM / SE 音量', icon: '🔊' },
  { key: 'devices', label: 'デバイス管理', icon: '📱', parentOnly: true },
  { key: 'inviteCode', label: '招待コードを発行する', icon: '🔑', parentOnly: true },
  { key: 'joinFamily', label: '家族に参加する', icon: '👨‍👩‍👧', childOnly: true },
  { key: 'aiSettings', label: 'AI採点設定', icon: '🤖', parentOnly: true },
  { key: 'howto', label: '使い方・遊び方・コツ', icon: '❓' },
  { key: 'about', label: 'クレジット・制作者・バージョン', icon: '📄' },
  { key: 'logout', label: 'ログアウト', icon: '⏏️' },
];

const STORAGE_KEYS = {
  isNotificationEnabled: 'isNotificationEnabled',
  bgmEnabled: 'settings_bgmEnabled',
  seEnabled: 'settings_seEnabled',
  bgmVolume: 'settings_bgmVolume',
  seVolume: 'settings_seVolume',
  bgmCategory: 'settings_bgmCategory',
} as const;

// BgmCategory 型は BGMContext から import

const BGM_CATEGORIES: Array<{ key: BgmCategory; label: string }> = [
  { key: 'battle', label: 'レトロ戦闘風に変更' },
  { key: 'stylish', label: 'レトロおしゃれ風に変更' },
  { key: 'relaxing', label: 'レトロやすらぎ風に変更' },
];

// カテゴリ選択時に表示するバナー画像（require は静的解決が必要なのでここで定義）
const BGM_CATEGORY_IMAGES: Record<BgmCategory, ReturnType<typeof require>> = {
  battle:   require('../../asset/settings/images/Retro_battle_style.png'),
  stylish:  require('../../asset/settings/images/Retro_stylish_style.png'),
  relaxing: require('../../asset/settings/images/Retro_and_relaxing_style.png'),
};

// ─── タブヘッダー画像マップ ────────────────────────────────────────────────────

const SECTION_HEADER_IMAGES: Partial<Record<SectionKey, ReturnType<typeof require>>> = {
  notification: require('../../asset/settings/images/Notification_settings.png'),
  volume: require('../../asset/settings/images/BGM_Settings.png'),
  logout: require('../../asset/settings/images/Logout.png'),
  howto: require('../../asset/settings/images/How_to_use.png'),
  about: require('../../asset/settings/images/credit.png'),
  // devices: 画像なし → テキストヘッダーで代替
};

// ─── How-to 画像マップ ───────────────────────────────────────────────────────

const howtoImages: Record<HowtoPageLayout, ReturnType<typeof require>> = {
  home1: require('../../asset/settings/images/image_3.png'),
  home2: require('../../asset/settings/images/image_4.png'),
  home3: require('../../asset/settings/images/image_5.png'),
  home4: require('../../asset/settings/images/image_6.png'),
  camera1: require('../../asset/settings/images/image_11.png'),
  camera2: require('../../asset/settings/images/image_12.png'),
  camera3: require('../../asset/settings/images/image_13.png'),
  camera4: require('../../asset/settings/images/image_14.png'),
  reward1: require('../../asset/settings/images/image_7.png'),
  reward2: require('../../asset/settings/images/image_8.png'),
  reward3: require('../../asset/settings/images/image_9.png'),
  reward4: require('../../asset/settings/images/image_10.png'),
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

// 通知ボタン画像の幅（セクション内余白を引いた実効幅）
const { width: SCREEN_W } = Dimensions.get('window');
const NOTIF_IMG_W = SCREEN_W - 20 - 24; // sectionsContainer margin×2 + sectionBody padding×2

export default function SettingsScreen() {
  const { user, updateLocalUserName, refreshUser, logout } = useAuth();

  // ── State ─────────────────────────────────────────────────────────────────

  // 複数タブを同時に開けるよう Record 管理に変更
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    notification: false,
    volume: false,
    logout: false,
    howto: false,
    about: false,
    devices: false,
    aiSettings: false,
    inviteCode: false,
    joinFamily: false,
  });

  // 招待コード（親専用）
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);

  // 家族参加（子専用）
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // AI採点設定
  // TASK-13: PATCH /api/family/settings/ai を呼ぶ。
  // React Native ネイティブビルドでは CORS が適用されないため問題なし。
  // Web/Expo Go 環境でのみバックエンド側で PATCH を CORS 許可する必要がある。
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);
  const [aiSettingsSaving, setAiSettingsSaving] = useState(false);

  // デバイス管理
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [addDeviceModalVisible, setAddDeviceModalVisible] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);

  // ユーザー名（AuthContext の user.name を Single Source of Truth とし、ローカル state は表示用）
  const [userName, setUserName] = useState('匿名さん');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    }
  }, [user?.name]);

  // 通知
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [showNotificationDesc, setShowNotificationDesc] = useState(true);

  // BGM（再生状態は BGMContext が管理）
  const { isPlaying, selectedCategory, play, stop, changeCategory } = useBGM();
  const [seEnabled, setSeEnabled] = useState(true);
  const [bgmVolume, setBgmVolume] = useState(0.8);
  const [seVolume, setSeVolume] = useState(0.6);
  const [bgmCategoryOpen, setBgmCategoryOpen] = useState(false);

  // 音量インジケーターのパルスアニメーション（0=min / 1=mid / 2=max）
  const pulseAnim     = useRef(new Animated.Value(0)).current;
  const pulseLoopRef  = useRef<Animated.CompositeAnimation | null>(null);

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

  // ── 設定の読み込み（BGM 以外：通知・SE） ────────────────────────────────

  useEffect(() => {
    const initSettings = async () => {
      try {
        const [notificationRaw, seEnabledRaw, bgmVolumeRaw, seVolumeRaw] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.isNotificationEnabled),
            AsyncStorage.getItem(STORAGE_KEYS.seEnabled),
            AsyncStorage.getItem(STORAGE_KEYS.bgmVolume),
            AsyncStorage.getItem(STORAGE_KEYS.seVolume),
          ]);
        if (notificationRaw) setIsNotificationEnabled(JSON.parse(notificationRaw));
        if (seEnabledRaw)    setSeEnabled(JSON.parse(seEnabledRaw));
        if (bgmVolumeRaw)    setBgmVolume(JSON.parse(bgmVolumeRaw));
        if (seVolumeRaw)     setSeVolume(JSON.parse(seVolumeRaw));
      } catch (_) {
        // 読み込みエラーは無視
      }
    };
    initSettings();
  }, []);

  // ── 音量インジケーター パルスアニメーション ──────────────────────────────
  // isPlaying=true → min→mid→max→mid をループ
  // isPlaying=false → min (0) へフェードアウト

  useEffect(() => {
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
      pulseLoopRef.current = null;
    }

    if (isPlaying) {
      pulseAnim.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 2, duration: 480, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current = loop;
      loop.start();
    } else {
      Animated.timing(pulseAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start();
    }

    return () => {
      if (pulseLoopRef.current) {
        pulseLoopRef.current.stop();
        pulseLoopRef.current = null;
      }
    };
  }, [isPlaying]);

  // ── BGM ハンドラ（BGMContext に委譲） ────────────────────────────────────

  const handleBgmPlay = () => play(selectedCategory);

  const handleBgmStop = () => stop();

  const handleCategorySelect = (category: BgmCategory) => {
    setBgmCategoryOpen(false);
    changeCategory(category);
  };

  // ── セクション開閉（複数同時展開対応） ───────────────────────────────────

  const toggleExpand = (key: SectionKey) => {
    setExpanded((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // How-to モーダルはタブが閉じたときにリセット
      if (!next.howto) {
        setHowtoModalVisible(false);
        setHowtoModalPage(0);
      }
      // 通知タブを開いたとき：説明画像を再表示
      if (key === 'notification' && next[key]) {
        setShowNotificationDesc(true);
      }
      // デバイスタブを開いたとき：一覧を取得
      if (key === 'devices' && next[key]) {
        fetchDevices();
      }
      // AI設定タブを開いたとき：設定を取得
      if (key === 'aiSettings' && next[key]) {
        fetchAiSettings();
      }
      return next;
    });
  };

  // ── ユーザー名編集 ────────────────────────────────────────────────────────

  const openNameEditor = () => {
    setNameDraft(userName);
    setEditingName(true);
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      Alert.alert('入力エラー', '名前を入力してください。');
      return;
    }
    try {
      await updateLocalUserName(trimmed);
      setEditingName(false);
    } catch (error) {
      console.error('Save Name Error:', error);
      Alert.alert('保存エラー', '名前の更新に失敗しました。時間をおいて再度お試しください。');
    }
  };

  const cancelNameEdit = () => {
    setEditingName(false);
  };

  // ── 通知ハンドラ ──────────────────────────────────────────────────────────

  const handleDisableNotification = async () => {
    setIsNotificationEnabled(false);
    await persistValue(STORAGE_KEYS.isNotificationEnabled, false);
  };

  const handleEnableNotification = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setIsNotificationEnabled(true);
        await persistValue(STORAGE_KEYS.isNotificationEnabled, true);
      } else {
        Alert.alert(
          '通知の許可が必要です',
          'OSの設定アプリから、このアプリの通知を許可してください。'
        );
      }
    } catch (e) {
      // Expo Go など権限リクエストが使えない環境ではエラーを吸収して継続
      console.warn('[Notifications] requestPermissionsAsync failed:', e);
    }
  };

  // ── デバイス管理 ──────────────────────────────────────────────────────────

  const fetchDevices = useCallback(async () => {
    setDevicesLoading(true);
    try {
      const res = await getDevices();
      setDevices(res.data);
    } catch (e) {
      console.error('[Devices] fetch error:', e);
      Alert.alert('エラー', 'デバイス一覧の取得に失敗しました。');
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  const handleAddDevice = async () => {
    const trimmed = newDeviceName.trim();
    if (!trimmed) {
      Alert.alert('入力エラー', 'デバイス名を入力してください。');
      return;
    }
    setAddingDevice(true);
    try {
      const res = await addDevice({ name: trimmed });
      setDevices((prev) => [...prev, res.data]);
      setNewDeviceName('');
      setAddDeviceModalVisible(false);
    } catch (e) {
      console.error('[Devices] add error:', e);
      Alert.alert('エラー', 'デバイスの追加に失敗しました。');
    } finally {
      setAddingDevice(false);
    }
  };

  const handleDeleteDevice = (device: Device) => {
    Alert.alert(
      'デバイスを削除',
      `「${device.name}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDevice(device.id);
              setDevices((prev) => prev.filter((d) => d.id !== device.id));
            } catch (e) {
              console.error('[Devices] delete error:', e);
              Alert.alert('エラー', 'デバイスの削除に失敗しました。');
            }
          },
        },
      ]
    );
  };

  // ── 招待コード（親専用） ──────────────────────────────────────────────────

  const handleGetInviteCode = async () => {
    setInviteCodeLoading(true);
    try {
      const res = await getInviteCode();
      setInviteCode(res.inviteCode);
    } catch {
      Alert.alert('エラー', '招待コードの取得に失敗しました。');
    } finally {
      setInviteCodeLoading(false);
    }
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('コピーしました', '招待コードをクリップボードにコピーしました。');
  };

  // ── 家族参加（子専用） ────────────────────────────────────────────────────

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) {
      Alert.alert('エラー', '招待コードを入力してください。');
      return;
    }
    setJoinLoading(true);
    try {
      await joinFamily({ inviteCode: joinCode.trim() });
      await refreshUser();
      Alert.alert('完了', '家族への参加が完了しました！');
      setJoinCode('');
    } catch {
      Alert.alert('エラー', '参加に失敗しました。招待コードを確認してください。');
    } finally {
      setJoinLoading(false);
    }
  };

  // ── AI採点設定 ────────────────────────────────────────────────────────────

  const fetchAiSettings = useCallback(async () => {
    setAiSettingsLoading(true);
    try {
      const res = await getAiSettings();
      setAiSettings(res.data);
    } catch (e) {
      console.error('[AiSettings] fetch error:', e);
      Alert.alert('エラー', 'AI設定の取得に失敗しました。');
    } finally {
      setAiSettingsLoading(false);
    }
  }, []);

  const handleUpdateAiSettings = async (patch: Parameters<typeof updateAiSettings>[0]) => {
    setAiSettingsSaving(true);
    try {
      const res = await updateAiSettings(patch);
      setAiSettings(res.data);
    } catch (e) {
      console.error('[AiSettings] update error:', e);
      Alert.alert('エラー', 'AI設定の更新に失敗しました。');
    } finally {
      setAiSettingsSaving(false);
    }
  };

  // ── ログアウト ────────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert('ログアウト', '本当にログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: logout },
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
            {/* 説明画像（× で非表示、タブ再開で再表示） */}
            {showNotificationDesc && (
              <View style={styles.notificationDescWrapper}>
                <Image
                  source={require('../../asset/settings/images/Notification_Description.png')}
                  style={styles.notificationDescImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.notificationDescClose}
                  onPress={() => setShowNotificationDesc(false)}
                  activeOpacity={0.7}
                />
              </View>
            )}

            {/* 通知を許可しない ボタン */}
            <TouchableOpacity
              onPress={handleDisableNotification}
              activeOpacity={0.8}
              style={styles.notificationToggleButton}
            >
              <Image
                source={
                  !isNotificationEnabled
                    ? require('../../asset/settings/images/Notifications_disabled_on.png')
                    : require('../../asset/settings/images/Notifications_disabled_off.png')
                }
                style={styles.notificationToggleImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* 通知を許可する ボタン */}
            <TouchableOpacity
              onPress={handleEnableNotification}
              activeOpacity={0.8}
              style={[styles.notificationToggleButton, { marginBottom: 0 }]}
            >
              <Image
                source={
                  isNotificationEnabled
                    ? require('../../asset/settings/images/Notifications_enabled_on.png')
                    : require('../../asset/settings/images/Notifications_enabled_off.png')
                }
                style={styles.notificationToggleImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        );

      case 'volume': {
        // パルスアニメーション opacity の補間値
        const minOp = pulseAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 0, 0] });
        const midOp = pulseAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 0] });
        const maxOp = pulseAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0, 1] });

        return (
          <View style={styles.bgmSection}>

            {/* ── BGMを流すボタン（再生中は赤枠アクティブ） ── */}
            <TouchableOpacity
              style={[styles.bgmPlayButton, isPlaying && styles.bgmButtonActive]}
              onPress={handleBgmPlay}
              activeOpacity={0.8}
            >
              <AppText style={styles.bgmPlayButtonText}>BGMを流す</AppText>
            </TouchableOpacity>

            {/* ── 音量インジケーター（パルスアニメーション: min→mid→max→mid ループ） ── */}
            <View style={styles.bgmIndicatorWrapper}>
              <Animated.View style={[styles.bgmIndicatorLayer, { opacity: minOp }]}>
                <Image source={require('../../asset/settings/images/BGM_minimum.png')} style={styles.bgmIndicatorImage} resizeMode="contain" />
              </Animated.View>
              <Animated.View style={[styles.bgmIndicatorLayer, styles.bgmIndicatorLayerAbsolute, { opacity: midOp }]}>
                <Image source={require('../../asset/settings/images/BGM_middle.png')} style={styles.bgmIndicatorImage} resizeMode="contain" />
              </Animated.View>
              <Animated.View style={[styles.bgmIndicatorLayer, styles.bgmIndicatorLayerAbsolute, { opacity: maxOp }]}>
                <Image source={require('../../asset/settings/images/BGM_maximum.png')} style={styles.bgmIndicatorImage} resizeMode="contain" />
              </Animated.View>
            </View>

            {/* ── カテゴリバナー（選択中のスタイル画像） ─────── */}
            <Image
              source={BGM_CATEGORY_IMAGES[selectedCategory]}
              style={styles.bgmCategoryBanner}
              resizeMode="contain"
            />

            {/* ── カテゴリドロップダウン ─────────────────────── */}
            <TouchableOpacity
              style={styles.bgmCategoryButton}
              onPress={() => setBgmCategoryOpen((p) => !p)}
              activeOpacity={0.8}
            >
              <AppText style={styles.bgmCategoryButtonText}>レトロゲーム風</AppText>
              <AppText style={styles.bgmCategoryArrow}>{bgmCategoryOpen ? '∧' : '∨'}</AppText>
            </TouchableOpacity>

            {bgmCategoryOpen && (
              <View style={styles.bgmCategoryList}>
                {BGM_CATEGORIES.map(({ key, label }, index) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.bgmCategoryItem,
                      selectedCategory === key && styles.bgmCategoryItemSelected,
                      index === BGM_CATEGORIES.length - 1 && styles.bgmCategoryItemLast,
                    ]}
                    onPress={() => handleCategorySelect(key)}
                    activeOpacity={0.7}
                  >
                    <AppText style={styles.bgmCategoryItemText}>{label}</AppText>
                    <AppText style={styles.bgmCategoryItemArrow}>›</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── BGMを流さないボタン（停止中は赤枠アクティブ） ── */}
            <TouchableOpacity
              style={[styles.bgmStopButton, !isPlaying && styles.bgmButtonActive]}
              onPress={handleBgmStop}
              activeOpacity={0.8}
            >
              <AppText style={styles.bgmStopButtonText}>BGMを流さない</AppText>
              <AppText style={styles.bgmStopButtonArrow}>›</AppText>
            </TouchableOpacity>

          </View>
        );
      }

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

      case 'devices':
        return (
          <View style={styles.devicesSection}>
            {devicesLoading ? (
              <ActivityIndicator color="#fff" style={{ marginVertical: 16 }} />
            ) : devices.length === 0 ? (
              <AppText style={styles.devicesEmptyText}>登録済みデバイスはありません</AppText>
            ) : (
              devices.map((device) => (
                <View key={device.id} style={styles.deviceItem}>
                  <AppText style={styles.deviceName}>📱 {device.name}</AppText>
                  <TouchableOpacity
                    style={styles.deviceDeleteButton}
                    onPress={() => handleDeleteDevice(device)}
                    activeOpacity={0.7}
                  >
                    <AppText style={styles.deviceDeleteText}>削除</AppText>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity
              style={styles.deviceAddButton}
              onPress={() => {
                setNewDeviceName('');
                setAddDeviceModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <AppText style={styles.deviceAddButtonText}>＋ デバイスを追加</AppText>
            </TouchableOpacity>
          </View>
        );

      case 'aiSettings':
        return (
          <View style={styles.aiSettingsSection}>
            {aiSettingsLoading ? (
              <ActivityIndicator color="#fff" style={{ marginVertical: 16 }} />
            ) : !aiSettings ? (
              <AppText style={styles.aiSettingsEmptyText}>設定を取得できませんでした</AppText>
            ) : (
              <>
                {/* 厳しさスライダー */}
                <View style={styles.aiSettingsRow}>
                  <AppText style={styles.aiSettingsLabel}>
                    {'厳しさ：' + aiSettings.strictness + ' / 5'}
                  </AppText>
                  <View style={styles.aiSettingsButtonRow}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <TouchableOpacity
                        key={v}
                        style={[
                          styles.aiSettingsStepButton,
                          aiSettings.strictness === v && styles.aiSettingsStepButtonActive,
                        ]}
                        onPress={() => handleUpdateAiSettings({ strictness: v })}
                        disabled={aiSettingsSaving}
                        activeOpacity={0.7}
                      >
                        <AppText style={styles.aiSettingsStepText}>{v}</AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 注目度スライダー */}
                <View style={styles.aiSettingsRow}>
                  <AppText style={styles.aiSettingsLabel}>
                    {'注目度：' + aiSettings.focus + ' / 5'}
                  </AppText>
                  <View style={styles.aiSettingsButtonRow}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <TouchableOpacity
                        key={v}
                        style={[
                          styles.aiSettingsStepButton,
                          aiSettings.focus === v && styles.aiSettingsStepButtonActive,
                        ]}
                        onPress={() => handleUpdateAiSettings({ focus: v })}
                        disabled={aiSettingsSaving}
                        activeOpacity={0.7}
                      >
                        <AppText style={styles.aiSettingsStepText}>{v}</AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* NG フラグ */}
                <AppText style={styles.aiSettingsSectionTitle}>NG判定</AppText>
                {(
                  [
                    { key: 'missingProcess', label: '過程の欠落を NG 判定' },
                    { key: 'workTimeMismatch', label: '作業時間の不一致を NG 判定' },
                    { key: 'imageReuse', label: '画像の使い回しを NG 判定' },
                  ] as const
                ).map(({ key: ngKey, label }) => (
                  <TouchableOpacity
                    key={ngKey}
                    style={styles.aiSettingsToggleRow}
                    onPress={() =>
                      handleUpdateAiSettings({
                        ng: { [ngKey]: !aiSettings.ng[ngKey] },
                      })
                    }
                    disabled={aiSettingsSaving}
                    activeOpacity={0.7}
                  >
                    <AppText style={styles.aiSettingsLabel}>{label}</AppText>
                    <AppText
                      style={[
                        styles.aiSettingsToggleText,
                        aiSettings.ng[ngKey] && styles.aiSettingsToggleTextOn,
                      ]}
                    >
                      {aiSettings.ng[ngKey] ? 'ON' : 'OFF'}
                    </AppText>
                  </TouchableOpacity>
                ))}

                {aiSettingsSaving && (
                  <ActivityIndicator color="#aaf" style={{ marginTop: 8 }} />
                )}
              </>
            )}
          </View>
        );

      case 'inviteCode':
        return (
          <View style={styles.devicesSection}>
            {inviteCodeLoading ? (
              <ActivityIndicator color="#fff" style={{ marginVertical: 16 }} />
            ) : inviteCode ? (
              <>
                <AppText style={styles.inviteCodeText}>{inviteCode}</AppText>
                <TouchableOpacity
                  style={styles.deviceAddButton}
                  onPress={handleCopyInviteCode}
                  activeOpacity={0.8}
                >
                  <AppText style={styles.deviceAddButtonText}>📋 コピー</AppText>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.deviceAddButton}
                onPress={handleGetInviteCode}
                activeOpacity={0.8}
              >
                <AppText style={styles.deviceAddButtonText}>🔑 招待コードを取得</AppText>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'joinFamily':
        return (
          <View style={styles.devicesSection}>
            {user?.familyId ? (
              <AppText style={styles.devicesEmptyText}>✅ 家族への参加が完了しています</AppText>
            ) : (
              <>
                <TextInput
                  value={joinCode}
                  onChangeText={setJoinCode}
                  style={styles.modalInput}
                  placeholder="招待コードを入力"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleJoinFamily}
                />
                <TouchableOpacity
                  style={styles.deviceAddButton}
                  onPress={handleJoinFamily}
                  disabled={joinLoading}
                  activeOpacity={0.8}
                >
                  {joinLoading ? (
                    <ActivityIndicator size="small" color="#e3e3ff" />
                  ) : (
                    <AppText style={styles.deviceAddButtonText}>👨‍👩‍👧 家族に参加する</AppText>
                  )}
                </TouchableOpacity>
              </>
            )}
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
      source={require('../../asset/settings/images/background_screen.png.png')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* ユーザー名編集モーダル（ScrollView の外に配置して確実にオーバーレイ表示） */}
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

        {/* デバイス追加モーダル */}
        <Modal
          visible={addDeviceModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAddDeviceModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <AppText style={styles.modalTitle}>デバイスを追加</AppText>
              <TextInput
                value={newDeviceName}
                onChangeText={setNewDeviceName}
                style={styles.modalInput}
                placeholder="デバイス名を入力"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleAddDevice}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setAddDeviceModalVisible(false)}
                  disabled={addingDevice}
                >
                  <AppText style={styles.modalButtonText}>キャンセル</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleAddDevice}
                  disabled={addingDevice}
                >
                  {addingDevice ? (
                    <ActivityIndicator size="small" color="#e3e3ff" />
                  ) : (
                    <AppText style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>
                      追加
                    </AppText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 画面全体をスクロール可能にする */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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

          {/* セクション一覧（各タブを独立して開閉） */}
          <View style={styles.sectionsContainer}>
            {SECTIONS.filter((s) => !s.parentOnly || user?.role === 'PARENT').map((section) => {
              const isOpen = expanded[section.key];
              const headerImage = SECTION_HEADER_IMAGES[section.key];
              return (
                <View key={section.key} style={styles.sectionContainer}>
                  <TouchableOpacity
                    onPress={() => toggleExpand(section.key)}
                    style={styles.sectionHeader}
                    activeOpacity={0.8}
                  >
                    {headerImage ? (
                      <Image
                        source={headerImage}
                        style={
                          section.key === 'about'
                            ? styles.tabImageCredit
                            : styles.tabImageNormal
                        }
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.tabTextHeader}>
                        <AppText style={styles.tabTextHeaderLabel}>
                          {section.icon} {section.label}
                        </AppText>
                        <AppText style={styles.tabTextHeaderArrow}>{isOpen ? '∧' : '∨'}</AppText>
                      </View>
                    )}
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={styles.sectionBody}>{renderSectionBody(section.key)}</View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
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

  // ── 画面全体スクロール ────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
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
  sectionsContainer: {
    marginHorizontal: 10,
    marginTop: 12,
  },
  sectionContainer: {
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 0,
    overflow: 'hidden',
  },
  tabImageNormal: {
    width: '100%',
    height: 56,
  },
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
    gap: 10,
  },
  // 説明画像のラッパー（×ボタンを絶対配置するために relative）
  notificationDescWrapper: {
    width: NOTIF_IMG_W,
    alignSelf: 'center',
    position: 'relative',
  },
  notificationDescImage: {
    width: NOTIF_IMG_W,
    height: undefined,
    // Figma: 306 × 82 px → アスペクト比を維持して高さ自動計算
    aspectRatio: 306 / 82,
    resizeMode: 'contain' as const,
  },
  // 説明画像右上の × ボタン
  notificationDescClose: {
    position: 'absolute',
    top: 4,
    right: 6,
    padding: 6,
  },
  notificationDescCloseText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  // トグル画像ボタンの共通ラッパー
  notificationToggleButton: {
    width: NOTIF_IMG_W,
    alignSelf: 'center',
    marginBottom: 10,
  },
  // ボタン画像本体（Figma: 196 × 35 px 相当、アスペクト比を維持）
  notificationToggleImage: {
    width: NOTIF_IMG_W,
    height: undefined,
    aspectRatio: 196 / 35,
    resizeMode: 'contain' as const,
  },

  // ── 旧音量設定（互換性のため残す） ─────────────────────────────────────────
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

  // ── BGM セクション（新デザイン） ───────────────────────────────────────────
  bgmSection: {
    alignItems: 'center',
    gap: 12,
  },
  // BGMを流すボタン（デフォルトは赤ボーダー Outline スタイル）
  bgmPlayButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: 196,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bgmPlayButtonText: {
    fontSize: 14,
    color: '#fff',
    letterSpacing: 1,
  },
  // アクティブ状態（選択中ボタン）は赤枠
  bgmButtonActive: {
    borderColor: '#d4031c',
    borderWidth: 2,
  },
  // 音量インジケーターラッパー（2枚の画像を重ねてフェード）
  bgmIndicatorWrapper: {
    width: '100%',
    height: 26,
  },
  bgmIndicatorLayer: {
    width: '100%',
    height: '100%',
  },
  bgmIndicatorLayerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgmIndicatorImage: {
    width: '100%',
    height: '100%',
  },
  // カテゴリバナー画像（選択カテゴリに応じて切り替わる）
  bgmCategoryBanner: {
    width: '100%',
    height: 60,
  },

  // カテゴリドロップダウンヘッダー
  bgmCategoryButton: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 30,
  },
  bgmCategoryButtonText: {
    fontSize: 12,
    color: '#fff',
    letterSpacing: 1,
  },
  bgmCategoryArrow: {
    fontSize: 10,
    color: '#fff',
  },
  // カテゴリリスト（展開時）
  bgmCategoryList: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#fff',
  },
  bgmCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  bgmCategoryItemSelected: {
    backgroundColor: 'rgba(212,3,28,0.12)',
  },
  bgmCategoryItemLast: {
    borderBottomWidth: 0,
  },
  bgmCategoryItemText: {
    fontSize: 12,
    color: '#fff',
    letterSpacing: 1,
  },
  bgmCategoryItemArrow: {
    fontSize: 14,
    color: '#fff',
  },
  // BGMを流さないボタン（デフォルトは半透明白ボーダー）
  bgmStopButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: 196,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bgmStopButtonText: {
    fontSize: 14,
    color: '#fff',
    letterSpacing: 1,
  },
  bgmStopButtonArrow: {
    fontSize: 14,
    color: '#fff',
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

  // ── セクションテキストヘッダー（画像なし代替） ────────────────────────────
  tabTextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  tabTextHeaderLabel: {
    fontSize: 14,
    color: '#e3e3ff',
    letterSpacing: 1,
  },
  tabTextHeaderArrow: {
    fontSize: 12,
    color: '#c6c6db',
  },

  // ── デバイス管理 ──────────────────────────────────────────────────────────
  devicesSection: {
    gap: 10,
  },
  devicesEmptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingVertical: 12,
  },
  inviteCodeText: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 4,
    paddingVertical: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  deviceName: {
    fontSize: 14,
    color: '#e3e3ff',
    flex: 1,
  },
  deviceDeleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(220,28,28,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(220,28,28,0.4)',
  },
  deviceDeleteText: {
    fontSize: 12,
    color: '#ff8080',
  },
  deviceAddButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(110,140,255,0.4)',
    backgroundColor: 'rgba(110,140,255,0.1)',
  },
  deviceAddButtonText: {
    fontSize: 14,
    color: '#a0b4ff',
    letterSpacing: 1,
  },

  // ── AI採点設定 ────────────────────────────────────────────────────────────
  aiSettingsSection: {
    paddingVertical: 4,
  },
  aiSettingsEmptyText: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  aiSettingsRow: {
    marginBottom: 14,
  },
  aiSettingsLabel: {
    fontSize: 13,
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 6,
  },
  aiSettingsButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aiSettingsStepButton: {
    width: 38,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#556',
    backgroundColor: '#2a2a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSettingsStepButtonActive: {
    borderColor: '#7b68ee',
    backgroundColor: '#7b68ee',
  },
  aiSettingsStepText: {
    color: '#fff',
    fontSize: 13,
  },
  aiSettingsSectionTitle: {
    fontSize: 12,
    color: '#aaaacc',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  aiSettingsToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334',
  },
  aiSettingsToggleText: {
    fontSize: 13,
    color: '#666',
    letterSpacing: 1,
  },
  aiSettingsToggleTextOn: {
    color: '#7b68ee',
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
