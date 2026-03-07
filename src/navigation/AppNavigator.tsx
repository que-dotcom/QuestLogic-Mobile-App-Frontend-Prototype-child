import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import RewardScreen from '../screens/RewardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CustomTabBar from './CustomTabBar';

export type RootTabParamList = {
  Home: undefined;
  Camera: undefined;
  Reward: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // タブバーをスクリーン最下部に絶対配置することで、
        // 背景画像（ImageBackground）がタブバーの裏まで全画面描画される
        tabBarStyle: { position: 'absolute', elevation: 0, borderTopWidth: 0 },
      }}
      // スクリーンコンテナ自体の背景を透明にし、白塗りで塞がれないようにする
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Reward" component={RewardScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
