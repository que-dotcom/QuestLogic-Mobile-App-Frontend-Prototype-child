// インストールコマンド: npx expo install expo-secure-store
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "ql_auth_token";

/**
 * JWTトークンをSecureStoreに保存する。
 */
export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

/**
 * SecureStoreからJWTトークンを取得する。
 * トークンが存在しない場合は null を返す。
 */
export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

/**
 * SecureStoreからJWTトークンを削除する（ログアウト時に使用）。
 */
export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
