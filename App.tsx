import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  DotGothic16_400Regular,
} from '@expo-google-fonts/dotgothic16';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { HomeworkProvider } from './src/context/HomeworkContext';
import { AdviceProvider } from './src/context/AdviceContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';

// ルートガード: 認証状態に応じて表示するナビゲーターを切り替える
function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#aaaacc" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <AppNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DotGothic16_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#aaaacc" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HomeworkProvider>
          <AdviceProvider>
            <NavigationContainer>
              <StatusBar style="light" backgroundColor="#0a0a14" />
              <RootNavigator />
            </NavigationContainer>
          </AdviceProvider>
        </HomeworkProvider>
      </AuthProvider>
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
