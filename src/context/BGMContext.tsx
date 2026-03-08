import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

// ─── 型定義 ──────────────────────────────────────────────────────────────────

export type BgmCategory = 'battle' | 'stylish' | 'relaxing';

// ─── BGM ソースマップ（require は静的解決が必要なためここで全て宣言） ──────────
// 仮ファイル（battle / stylish）: 差し替え時は各 require のパスを変更すること
export const BGM_SOURCES: Record<BgmCategory, ReturnType<typeof require>> = {
  battle:   require('../../asset/settings/BGM/moonlit.free204.wav'), // TODO: battle.wav
  stylish:  require('../../asset/settings/BGM/moonlit.free204.wav'), // TODO: stylish.wav
  relaxing: require('../../asset/settings/BGM/moonlit.free204.wav'),
};

// ─── AsyncStorage キー（SettingsScreen の STORAGE_KEYS と一致させる） ───────
const STORAGE_KEY_ENABLED  = 'settings_bgmEnabled';
const STORAGE_KEY_CATEGORY = 'settings_bgmCategory';

// ─── Context 型 ──────────────────────────────────────────────────────────────

type BGMContextValue = {
  isPlaying: boolean;
  selectedCategory: BgmCategory;
  play: (category?: BgmCategory) => Promise<void>;
  stop: () => Promise<void>;
  changeCategory: (category: BgmCategory) => Promise<void>;
};

const BGMContext = createContext<BGMContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function BGMProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying]               = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BgmCategory>('relaxing');

  // Sound オブジェクトは ref で保持（再レンダリングで破棄されない）
  const soundRef    = useRef<Audio.Sound | null>(null);
  // 非同期ハンドラ内から常に最新のカテゴリを参照するための ref
  const categoryRef = useRef<BgmCategory>('relaxing');

  // ── 起動時: AsyncStorage から設定を復元し、ON なら即座に再生 ──────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const [enabledRaw, categoryRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_ENABLED),
          AsyncStorage.getItem(STORAGE_KEY_CATEGORY),
        ]);

        const restoredCategory: BgmCategory =
          categoryRaw ? (JSON.parse(categoryRaw) as BgmCategory) : 'relaxing';
        const restoredEnabled: boolean =
          enabledRaw ? JSON.parse(enabledRaw) : false;

        setSelectedCategory(restoredCategory);
        categoryRef.current = restoredCategory;

        if (restoredEnabled) {
          await loadAndPlay(restoredCategory);
        }
      } catch (e) {
        console.warn('[BGM] restore failed:', e);
      }
    };

    restore();

    // アプリ終了時にサウンドリソースを解放
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 内部: ロード → 再生（常にアンロードから始める） ──────────────────────

  const loadAndPlay = async (category: BgmCategory) => {
    // 既存サウンドを完全にアンロード
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

    // shouldPlay: true でロードと同時に再生を開始（separate playAsync 不要）
    const { sound } = await Audio.Sound.createAsync(
      BGM_SOURCES[category],
      { isLooping: true, shouldPlay: true }
    );
    soundRef.current = sound;
    setIsPlaying(true);
  };

  // ── 公開 API ─────────────────────────────────────────────────────────────

  const play = async (category: BgmCategory = categoryRef.current) => {
    try {
      await loadAndPlay(category);
      categoryRef.current = category;
      setSelectedCategory(category);
      await AsyncStorage.setItem(STORAGE_KEY_ENABLED,  JSON.stringify(true));
      await AsyncStorage.setItem(STORAGE_KEY_CATEGORY, JSON.stringify(category));
    } catch (e) {
      console.warn('[BGM] play failed:', e);
    }
  };

  const stop = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      await AsyncStorage.setItem(STORAGE_KEY_ENABLED, JSON.stringify(false));
    } catch (e) {
      console.warn('[BGM] stop failed:', e);
    }
  };

  const changeCategory = async (category: BgmCategory) => {
    categoryRef.current = category;
    setSelectedCategory(category);
    await AsyncStorage.setItem(STORAGE_KEY_CATEGORY, JSON.stringify(category));

    // 再生中であれば新しい曲に切り替え
    if (isPlaying) {
      try {
        await loadAndPlay(category);
        await AsyncStorage.setItem(STORAGE_KEY_ENABLED, JSON.stringify(true));
      } catch (e) {
        console.warn('[BGM] changeCategory failed:', e);
      }
    }
  };

  return (
    <BGMContext.Provider value={{ isPlaying, selectedCategory, play, stop, changeCategory }}>
      {children}
    </BGMContext.Provider>
  );
}

// ─── カスタムフック ──────────────────────────────────────────────────────────

export function useBGM(): BGMContextValue {
  const ctx = useContext(BGMContext);
  if (!ctx) throw new Error('useBGM must be used within BGMProvider');
  return ctx;
}
