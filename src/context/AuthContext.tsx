import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { saveToken, getToken, removeToken } from "../utils/tokenStorage";
import { getCurrentUser } from "../api/users";
import type { User } from "../types/api";

// ============================================================
// 型定義
// ============================================================

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  /** ログイン成功時: トークンをSecureStoreに保存しStateを更新する */
  login: (token: string, user: User) => Promise<void>;
  /** ログアウト時: トークンをSecureStoreから削除しStateをクリアする */
  logout: () => Promise<void>;
  /** バックエンドから最新のユーザー情報を再取得する */
  refreshUser: () => Promise<User | null>;
}

type AuthContextValue = AuthState & AuthActions;

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================
// Provider
// ============================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await getCurrentUser();
      setUser(response.data);
      return response.data;
    } catch {
      return null;
    }
  }, []);

  // アプリ起動時: SecureStoreにトークンが残っていれば復元する
  useEffect(() => {
    const restoreToken = async () => {
      try {
        const stored = await getToken();
        if (stored) {
          setToken(stored);
          await refreshUser();
        }
      } catch {
        // トークン読み込み失敗時は未認証のままにする
      } finally {
        setIsLoading(false);
      }
    };

    restoreToken();
  }, [refreshUser]);

  const login = useCallback(async (newToken: string, newUser: User) => {
    await saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await removeToken();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: token !== null,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// カスタムフック
// ============================================================

/**
 * 認証状態とアクションを取得するカスタムフック。
 * AuthProvider の内側でのみ使用可能。
 */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth は AuthProvider の内側で使用してください");
  }
  return ctx;
};
