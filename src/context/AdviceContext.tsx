import React, { createContext, useContext, useState } from 'react';

export interface RewardHistoryEntry {
  id: string;
  subject: string;
  topic: string;
  createdAt: string;
  earnedPoints: number;
}

interface AdviceContextValue {
  /** 未読のAIアドバイスが存在するか */
  hasNewAdvice: boolean;
  setHasNewAdvice: (value: boolean) => void;
  /** CameraScreen の Button M からリワード画面へ直接遷移し、アドバイスを即時開く */
  openAdviceDirectly: boolean;
  setOpenAdviceDirectly: (value: boolean) => void;
  /** 最新のAIアドバイス本文 */
  latestAdviceText: string | null;
  setLatestAdviceText: (value: string | null) => void;
  /** 直近の提出履歴。RewardScreen で API 一覧を補完する */
  rewardHistory: RewardHistoryEntry[];
  setRewardHistory: (entries: RewardHistoryEntry[]) => void;
  prependRewardHistory: (entry: RewardHistoryEntry) => void;
}

const AdviceContext = createContext<AdviceContextValue>({
  hasNewAdvice: false,
  setHasNewAdvice: () => {},
  openAdviceDirectly: false,
  setOpenAdviceDirectly: () => {},
  latestAdviceText: null,
  setLatestAdviceText: () => {},
  rewardHistory: [],
  setRewardHistory: () => {},
  prependRewardHistory: () => {},
});

export function AdviceProvider({ children }: { children: React.ReactNode }) {
  const [hasNewAdvice, setHasNewAdvice] = useState(false);
  const [openAdviceDirectly, setOpenAdviceDirectly] = useState(false);
  const [latestAdviceText, setLatestAdviceText] = useState<string | null>(null);
  const [rewardHistory, setRewardHistory] = useState<RewardHistoryEntry[]>([]);

  const prependRewardHistory = (entry: RewardHistoryEntry) => {
    setRewardHistory((prev) => {
      const remaining = prev.filter((item) => item.id !== entry.id);
      return [entry, ...remaining];
    });
  };

  return (
    <AdviceContext.Provider
      value={{
        hasNewAdvice,
        setHasNewAdvice,
        openAdviceDirectly,
        setOpenAdviceDirectly,
        latestAdviceText,
        setLatestAdviceText,
        rewardHistory,
        setRewardHistory,
        prependRewardHistory,
      }}
    >
      {children}
    </AdviceContext.Provider>
  );
}

export function useAdvice(): AdviceContextValue {
  return useContext(AdviceContext);
}
