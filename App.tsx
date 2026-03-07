import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  DotGothic16_400Regular,
} from '@expo-google-fonts/dotgothic16';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { HomeworkProvider } from './src/context/HomeworkContext';
import { AdviceProvider } from './src/context/AdviceContext';
import LoginScreen from './src/screens/LoginScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    DotGothic16_400Regular,
  });
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);

  useEffect(() => {
    const restoreLoginState = async () => {
      try {
        const stored = await AsyncStorage.getItem('child_login_hasSeen');
        if (stored) {
          setHasLoggedIn(JSON.parse(stored));
        }
      } catch {
        // 読み込み失敗時は未ログイン扱いのままにする
      } finally {
        setIsBootLoading(false);
      }
    };

    restoreLoginState();
  }, []);

  if (!fontsLoaded || isBootLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#aaaacc" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <HomeworkProvider>
        <AdviceProvider>
          <NavigationContainer>
            {hasLoggedIn ? (
              <>
                <StatusBar style="light" backgroundColor="#0a0a14" />
                <AppNavigator />
              </>
            ) : (
              <LoginScreen
                onLogin={async () => {
                  try {
                    await AsyncStorage.setItem(
                      'child_login_hasSeen',
                      JSON.stringify(true),
                    );
                  } catch {
                    // 書き込み失敗時も、少なくとも今回の起動中はログイン状態にする
                  }
                  setHasLoggedIn(true);
                }}
              />
            )}
          </NavigationContainer>
        </AdviceProvider>
      </HomeworkProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0a0a14',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
