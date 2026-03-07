import React, { createContext, useContext, useState } from 'react';

export interface HomeworkInfo {
  grade: string;
  subject: string;
  name: string;
}

interface HomeworkContextValue {
  homework: HomeworkInfo | null;
  setHomework: (info: HomeworkInfo | null) => void;
}

const HomeworkContext = createContext<HomeworkContextValue>({
  homework: null,
  setHomework: () => {},
});

export function HomeworkProvider({ children }: { children: React.ReactNode }) {
  const [homework, setHomework] = useState<HomeworkInfo | null>(null);

  return (
    <HomeworkContext.Provider value={{ homework, setHomework }}>
      {children}
    </HomeworkContext.Provider>
  );
}

export function useHomework(): HomeworkContextValue {
  return useContext(HomeworkContext);
}
