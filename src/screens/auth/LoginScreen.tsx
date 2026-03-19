import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../context/AuthContext';
import { testLogin, googleAuth } from '../../api/auth';
import type { UserRole } from '../../types/api';

WebBrowser.maybeCompleteAuthSession();

const EXPO_GO_OAUTH_MESSAGE =
  'Expo 公式ドキュメント上、OAuth / OpenID Connect は Expo Go での動作確認対象外です。Google ログインは development build または本番ビルドで確認してください。';
const NATIVE_GOOGLE_REDIRECT_URI = 'com.raitsumugu.child-app:/oauthredirect';

export default function LoginScreen() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('CHILD');
  const requestedRoleRef = useRef<UserRole>('CHILD');

  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const hasGoogleClientId =
    Platform.select({
      ios: Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
      android: Boolean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
      default: Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
    }) ?? false;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
    shouldAutoExchangeCode: true,
  }, {
    native: NATIVE_GOOGLE_REDIRECT_URI,
  });

  useEffect(() => {
    WebBrowser.warmUpAsync().catch(() => {});
    return () => {
      WebBrowser.coolDownAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!response) {
      return;
    }

    let isActive = true;

    const completeGoogleLogin = async () => {
      if (response.type === 'success') {
        try {
          const idToken =
            response.params.id_token ?? response.authentication?.idToken;

          if (!idToken) {
            throw new Error('Google から idToken を取得できませんでした。');
          }

          const res = await googleAuth({
            idToken,
            role: requestedRoleRef.current,
          });

          if (!isActive) {
            return;
          }

          await login(res.token, res.user);
        } catch (e: unknown) {
          if (!isActive) {
            return;
          }

          const message =
            e instanceof Error ? e.message : 'ログインに失敗しました。';
          Alert.alert('ログインエラー', message);
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
        return;
      }

      if (response.type === 'error') {
        if (isActive) {
          const message =
            response.error?.message ?? 'Google ログインに失敗しました。';
          Alert.alert('ログインエラー', message);
        }
      }

      if (isActive) {
        setIsLoading(false);
      }
    };

    completeGoogleLogin();

    return () => {
      isActive = false;
    };
  }, [login, response]);

  const handleGoogleLogin = async () => {
    if (isExpoGo) {
      Alert.alert('Expo Go では未対応', EXPO_GO_OAUTH_MESSAGE);
      return;
    }

    if (!hasGoogleClientId) {
      Alert.alert(
        '設定エラー',
        'Google OAuth クライアント ID が未設定です。.env を確認してください。'
      );
      return;
    }

    if (!request) {
      Alert.alert(
        '準備中',
        'Google ログインの初期化中です。数秒待ってから再度お試しください。'
      );
      return;
    }

    requestedRoleRef.current = selectedRole;
    setIsLoading(true);

    try {
      const result = await promptAsync();
      if (
        result.type === 'cancel' ||
        result.type === 'dismiss' ||
        result.type === 'locked'
      ) {
        setIsLoading(false);
      }
    } catch (e: unknown) {
      setIsLoading(false);
      const message =
        e instanceof Error ? e.message : 'Google ログインの起動に失敗しました。';
      Alert.alert('ログインエラー', message);
    }
  };

  const handleTestLogin = async () => {
    setIsLoading(true);
    try {
      const role = selectedRole === 'CHILD' ? 'child' : 'parent';
      const res = await testLogin(role);
      await login(res.token, res.user);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'ログインに失敗しました。';
      Alert.alert('ログインエラー', message);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLoginHint = isExpoGo
    ? EXPO_GO_OAUTH_MESSAGE
    : !hasGoogleClientId
      ? 'この端末向けの Google OAuth クライアント ID が不足しています。.env を確認してください。'
      : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QuestLogic</Text>
      <Text style={styles.subtitle}>ログイン</Text>

      {/* ロール選択 */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === 'CHILD' && styles.roleButtonActive,
          ]}
          onPress={() => setSelectedRole('CHILD')}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.roleButtonText,
              selectedRole === 'CHILD' && styles.roleButtonTextActive,
            ]}
          >
            子ども
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === 'PARENT' && styles.roleButtonActive,
          ]}
          onPress={() => setSelectedRole('PARENT')}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.roleButtonText,
              selectedRole === 'PARENT' && styles.roleButtonTextActive,
            ]}
          >
            保護者
          </Text>
        </TouchableOpacity>
      </View>

      {/* Google ログインボタン */}
      <TouchableOpacity
        style={[styles.button, styles.googleButton, isLoading && styles.buttonDisabled]}
        onPress={handleGoogleLogin}
        disabled={isLoading || isExpoGo || !hasGoogleClientId || !request}
      >
        {isLoading ? (
          <ActivityIndicator color="#0a0a14" />
        ) : (
          <Text style={styles.buttonText}>Google でログイン</Text>
        )}
      </TouchableOpacity>

      {googleLoginHint && (
        <Text style={styles.helperText}>{googleLoginHint}</Text>
      )}

      {/* 開発用テストログイン（__DEV__ のみ表示） */}
      {__DEV__ && (
        <TouchableOpacity
          style={[styles.button, styles.devButton, isLoading && styles.buttonDisabled]}
          onPress={handleTestLogin}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.devButtonText]}>
            [DEV] テストログイン
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontFamily: 'DotGothic16_400Regular',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaaacc',
    fontFamily: 'DotGothic16_400Regular',
    marginBottom: 24,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444466',
    backgroundColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: '#7b68ee',
    borderColor: '#7b68ee',
  },
  roleButtonText: {
    color: '#aaaacc',
    fontSize: 14,
    fontFamily: 'DotGothic16_400Regular',
  },
  roleButtonTextActive: {
    color: '#0a0a14',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 240,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#7b68ee',
  },
  devButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444466',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0a0a14',
    fontSize: 15,
    fontFamily: 'DotGothic16_400Regular',
  },
  helperText: {
    maxWidth: 260,
    color: '#8888aa',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'DotGothic16_400Regular',
  },
  devButtonText: {
    color: '#666688',
  },
});
