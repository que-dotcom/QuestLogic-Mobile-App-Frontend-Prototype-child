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

/*
 * Figma上のタブバー寸法: width=358, height=83。
 * height を固定値で指定し、SafeArea への追加はバー画像の外側（下）に行う。
 * これにより ImageBackground 自体が間延びしない。
 */
const TAB_BAR_HEIGHT = 83;

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
    <View style={styles.wrapper}>
      {/*
       * Menu Bar.png をタブバーの背景として使用。
       * height を固定値にすることで肥大化を防ぐ。
       * resizeMode="stretch" でバー画像を指定幅に引き伸ばす（高さ固定のため比率崩れは無い）。
       */}
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
                  { opacity: isFocused ? 1 : 0.5 },
                ]}
                resizeMode="contain"
                /*
                 * shadow 系プロパティは一切使用しない。
                 * アイコンに影がかかる場合は PNG 自体の問題。
                 */
              />
            </TouchableOpacity>
          );
        })}
      </ImageBackground>

      {/*
       * SafeArea 分の余白は ImageBackground の外側（下）に配置。
       * タブバー画像が引き伸ばされず、同じ背景色で自然に続く。
       */}
      <View
        style={[
          styles.safeAreaExtension,
          { height: insets.bottom },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    // 画面最下部にオーバーレイ配置することで、
    // 各スクリーンの ImageBackground がタブバーの裏まで全面描画される
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 34,
    height: 34,
  },
  safeAreaExtension: {
    backgroundColor: 'transparent',
  },
});
