import React, { createContext, useContext, useState } from 'react';

interface AdviceContextValue {
  /** 未読のAIアドバイスが存在するか */
  hasNewAdvice: boolean;
  setHasNewAdvice: (value: boolean) => void;
  /** CameraScreen の Button M からリワード画面へ直接遷移し、アドバイスを即時開く */
  openAdviceDirectly: boolean;
  setOpenAdviceDirectly: (value: boolean) => void;
}

const AdviceContext = createContext<AdviceContextValue>({
  hasNewAdvice: false,
  setHasNewAdvice: () => {},
  openAdviceDirectly: false,
  setOpenAdviceDirectly: () => {},
});

export function AdviceProvider({ children }: { children: React.ReactNode }) {
  const [hasNewAdvice, setHasNewAdvice] = useState(false);
  const [openAdviceDirectly, setOpenAdviceDirectly] = useState(false);

  return (
    <AdviceContext.Provider
      value={{ hasNewAdvice, setHasNewAdvice, openAdviceDirectly, setOpenAdviceDirectly }}
    >
      {children}
    </AdviceContext.Provider>
  );
}

export function useAdvice(): AdviceContextValue {
  return useContext(AdviceContext);
}
