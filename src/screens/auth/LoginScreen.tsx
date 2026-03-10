import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuth } from '../../context/AuthContext';
import { testLogin, googleAuth } from '../../api/auth';
import type { UserRole } from '../../types/api';

// Google Sign-In 初期化
// androidClientId は未設定: Android では webClientId でのフローにフォールバックするため不要
GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default function LoginScreen() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('CHILD');

  // 前回のサインインセッションをクリア（画面表示時）
  useEffect(() => {
    GoogleSignin.signOut().catch(() => {});
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('Google から idToken を取得できませんでした。');
      }

      const res = await googleAuth({ idToken, role: selectedRole });
      await login(res.token, res.user);
    } catch (e: unknown) {
      if (isErrorWithCode(e)) {
        if (e.code === statusCodes.SIGN_IN_CANCELLED) {
          // ユーザーがキャンセル → 何もしない
          return;
        }
        if (e.code === statusCodes.IN_PROGRESS) {
          return;
        }
        if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert('エラー', 'Google Play サービスが利用できません。');
          return;
        }
      }
      const message =
        e instanceof Error ? e.message : 'ログインに失敗しました。';
      Alert.alert('ログインエラー', message);
    } finally {
      setIsLoading(false);
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
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#0a0a14" />
        ) : (
          <Text style={styles.buttonText}>Google でログイン</Text>
        )}
      </TouchableOpacity>

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
  devButtonText: {
    color: '#666688',
  },
});
