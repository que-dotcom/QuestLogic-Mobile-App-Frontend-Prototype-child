import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { testLogin } from '../../api/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLogin = async () => {
    setIsLoading(true);
    try {
      const res = await testLogin('child');
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
      <Text style={styles.subtitle}>開発用ログイン</Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleTestLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#0a0a14" />
        ) : (
          <Text style={styles.buttonText}>子供としてテストログイン</Text>
        )}
      </TouchableOpacity>
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
  button: {
    backgroundColor: '#7b68ee',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 240,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0a0a14',
    fontSize: 15,
    fontFamily: 'DotGothic16_400Regular',
  },
});
