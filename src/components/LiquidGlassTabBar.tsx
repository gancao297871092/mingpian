import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  type LayoutChangeEvent,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';
import { LiquidGlass } from '@/components/capabilities';
import { useTheme } from '@/theme';
import { getBottomSpaces, scaleSizeH, setSpText } from '@/utils/screenUtils';

interface TabIconDef {
  active: string;
  inactive: string;
}

const TAB_ICONS: Record<string, TabIconDef> = {
  home: {
    active: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    inactive: 'M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z',
  },
  demos: {
    active: 'M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z',
    inactive: 'M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm8-2h8v8h-8v-8zm2 2v4h4v-4h-4z',
  },
  my: {
    active: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    inactive: 'M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  },
};

const TabIcon = ({ routeName, focused, color }: { routeName: string; focused: boolean; color: string }) => {
  const icon = TAB_ICONS[routeName];
  if (!icon) return null;
  return (
    <Svg width={scaleSizeH(22)} height={scaleSizeH(22)} viewBox="0 0 24 24">
      <Path d={focused ? icon.active : icon.inactive} fill={color} />
    </Svg>
  );
};

const PILL_WIDTH = scaleSizeH(95);

export default function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(state.index)).current;
  const tabWidth = tabBarWidth > 0 ? tabBarWidth / state.routes.length : 0;
  const actualPillWidth = Math.min(PILL_WIDTH, tabWidth - 16);

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(indicatorAnim, {
        toValue: state.index,
        useNativeDriver: true,
        tension: 120,
        friction: 12,
      }).start();
    }
  }, [state.index, tabWidth, indicatorAnim]);

  const onLayout = (e: LayoutChangeEvent) => {
    setTabBarWidth(e.nativeEvent.layout.width);
  };

  return (
    <LiquidGlass
      style={styles.toolbar}
      effect="regular"
      tintColor="rgba(231,231,231,0.12)"
      colorScheme="light"
      interactive
      onLayout={onLayout}
    >
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.pill,
            {
              backgroundColor:
                Platform.OS === 'android' ? 'rgba(220,220,220,0.4)' : 'rgba(231,231,231,0.4)',
              width: actualPillWidth,
              left: (tabWidth - actualPillWidth) / 2,
              transform: [
                {
                  translateX: indicatorAnim.interpolate({
                    inputRange: [0, state.routes.length - 1],
                    outputRange: [0, (state.routes.length - 1) * tabWidth],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />
      )}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        const publishButton = index === 0 ? (
          <TouchableOpacity
            key="publish-button"
            accessibilityRole="button"
            accessibilityLabel="发布"
            activeOpacity={0.8}
            style={styles.publishBtn}
            onPress={() => navigation.navigate('publish' as never)}
          >
            <Svg width={scaleSizeH(22)} height={scaleSizeH(22)} viewBox="0 0 24 24">
              <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        ) : null;

        return (
          <React.Fragment key={route.key}>
            {publishButton}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <TabIcon
                routeName={route.name}
                focused={isFocused}
                color={isFocused ? theme.primary : theme.placeholder}
              />
              {typeof label === 'string' ? (
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? theme.primary : theme.placeholder },
                  ]}
                >
                  {label}
                </Text>
              ) : null}
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </LiquidGlass>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    position: 'absolute',
    borderRadius: 25,
    bottom: getBottomSpaces(),
    left: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    height: 50,
    zIndex: 10,
  },
  pill: {
    position: 'absolute',
    top: 5,
    height: 40,
    borderRadius: 87,
  },
  tab: {
    flex: 1,
    height: scaleSizeH(44),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: setSpText(10),
    marginTop: scaleSizeH(2),
  },
  publishBtn: {
    width: scaleSizeH(44),
    height: scaleSizeH(44),
    borderRadius: scaleSizeH(22),
    backgroundColor: '#2962D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scaleSizeH(8),
  },
});
