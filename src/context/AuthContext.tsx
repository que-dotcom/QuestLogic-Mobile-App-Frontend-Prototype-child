import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveToken, getToken, removeToken } from "../utils/tokenStorage";
import { getCurrentUser } from "../api/users";
import type { User } from "../types/api";

// ============================================================
// 定数
// ============================================================

/** ローカル表示名の AsyncStorage キー（設定画面で保存・全画面で参照） */
const LOCAL_USER_NAME_KEY = "local_userName";

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
  /**
   * ローカル表示名を更新する。
   * AsyncStorage（local_userName）に保存し、Context の user.name を即座に上書きする。
   */
  updateLocalUserName: (name: string) => Promise<void>;
}

type AuthContextValue = AuthState & AuthActions;

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================
// ヘルパー: local_userName でバックエンドの name を上書き
// ============================================================

/**
 * AsyncStorage の local_userName が存在すればそちらを優先して user.name を差し替える。
 * ネットワーク由来の値よりローカル設定を最優先とするための処理。
 */
const applyLocalUserName = async (apiUser: User): Promise<User> => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_USER_NAME_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "string" && parsed.trim().length > 0) {
        return { ...apiUser, name: parsed };
      }
    }
  } catch {
    // AsyncStorage 読み込み失敗時はバックエンドの値をそのまま使用
  }
  return apiUser;
};

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
      // バックエンドの name よりローカル保存名を優先して適用
      const merged = await applyLocalUserName(response.data);
      setUser(merged);
      return merged;
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
          await refreshUser(); // refreshUser 内で local_userName の上書きも適用される
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
    // ログイン直後も local_userName を優先して適用
    const merged = await applyLocalUserName(newUser);
    setUser(merged);
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await removeToken();
    setToken(null);
    setUser(null);
  }, []);

  /**
   * 設定画面から呼び出す。
   * AsyncStorage に保存後、Context の user.name を即座に差し替えてUI全体に反映させる。
   */
  const updateLocalUserName = useCallback(async (name: string) => {
    await AsyncStorage.setItem(LOCAL_USER_NAME_KEY, JSON.stringify(name));
    setUser((prev) => (prev ? { ...prev, name } : null));
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
        updateLocalUserName,
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
