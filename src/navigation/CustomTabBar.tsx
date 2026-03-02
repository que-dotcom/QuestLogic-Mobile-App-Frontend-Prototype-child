import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS = {
  Home: require('../../asset/home/images/Home icon.png'),
  Camera: require('../../asset/home/images/Camera icon.png'),
  Reward: require('../../asset/home/images/Reward Icon.png'),
  Settings: require('../../asset/home/images/Settings icon.png'),
} as const;

type TabName = keyof typeof TAB_ICONS;

export default function CustomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <ImageBackground
        source={require('../../asset/home/images/Menu Bar.png')}
        style={styles.tabBar}
        resizeMode="stretch"
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const routeName = route.name as TabName;
          const iconSource = TAB_ICONS[routeName];

          const onPress = () => {
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
            >
              <Image
                source={iconSource}
                style={[
                  styles.tabIcon,
                  { opacity: isFocused ? 1 : 0.55 },
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#7a4a1a',
  },
  tabBar: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIcon: {
    width: 32,
    height: 32,
  },
});
