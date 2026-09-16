import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LiquidGlass } from '@/components/capabilities';
import { getBottomSpaces, scaleSizeH, scaleSizeW, setSpText } from '@/utils/screenUtils';

const TAB_ICONS: Record<string, { active: number; inactive: number }> = {
  home: {
    active: require('@/assets/tab-icons/home-active.png'),
    inactive: require('@/assets/tab-icons/home-inactive.png'),
  },
  link: {
    active: require('@/assets/tab-icons/link-active.png'),
    inactive: require('@/assets/tab-icons/link-inactive.png'),
  },
  message: {
    active: require('@/assets/tab-icons/message-active.png'),
    inactive: require('@/assets/tab-icons/message-inactive.png'),
  },
  my: {
    active: require('@/assets/tab-icons/my-active.png'),
    inactive: require('@/assets/tab-icons/my-inactive.png'),
  },
};

const ACTIVE_COLOR = '#000000';
const INACTIVE_COLOR = '#818181';
const PUBLISH_BG = '#2962D4';
const PUBLISH_SHADOW = '#BED4FF';

const TabIcon = ({ routeName, focused }: { routeName: string; focused: boolean }) => {
  const icon = TAB_ICONS[routeName];
  if (!icon) return null;
  return (
    <Image
      source={focused ? icon.active : icon.inactive}
      style={styles.tabIcon}
      resizeMode="contain"
    />
  );
};

function TabItem({
  route,
  index,
  descriptors,
  state,
  navigation,
}: {
  route: BottomTabBarProps['state']['routes'][number];
  index: number;
  descriptors: BottomTabBarProps['descriptors'];
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
}) {
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

  return (
    <TouchableOpacity
      key={route.key}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={styles.tab}
    >
      <TabIcon routeName={route.name} focused={isFocused} />
      {typeof label === 'string' ? (
        <Text style={[styles.tabLabel, { color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR }]}>
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function LiquidGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <LiquidGlass
        style={styles.toolbar}
        effect="regular"
        tintColor="rgba(255,255,255,0.80)"
        colorScheme="light"
        interactive
      >
        <View style={styles.tabsRow}>
          {/* 广场 */}
          <TabItem route={state.routes[0]} index={0} descriptors={descriptors} state={state} navigation={navigation} />
          {/* 链接 */}
          <TabItem route={state.routes[1]} index={1} descriptors={descriptors} state={state} navigation={navigation} />
          {/* 发布按钮 */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="发布"
            activeOpacity={0.8}
            style={styles.publishBtn}
            onPress={() => navigation.navigate('publish' as never)}
          >
            <Image
              source={require('@/assets/tab-icons/publish.png')}
              style={styles.publishIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {/* 消息 */}
          <TabItem route={state.routes[2]} index={2} descriptors={descriptors} state={state} navigation={navigation} />
          {/* 我的 */}
          <TabItem route={state.routes[3]} index={3} descriptors={descriptors} state={state} navigation={navigation} />
        </View>
      </LiquidGlass>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scaleSizeH(80),
    alignItems: 'center',
    zIndex: 10,
  },
  toolbar: {
    width: '100%',
    height: scaleSizeH(70) + getBottomSpaces(),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        shadowOpacity: 1,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleSizeW(38),
    height: scaleSizeH(70),
    backgroundColor:'red'
  },
  tab: {
    width: scaleSizeW(27),
    height: scaleSizeH(41),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: scaleSizeW(24),
    height: scaleSizeH(24),
  },
  tabLabel: {
    fontSize: setSpText(10),
    fontWeight: '400',
    marginTop: scaleSizeH(3),
  },
  publishBtn: {
    width: scaleSizeW(66),
    height: scaleSizeH(35),
    borderRadius: scaleSizeH(18),
    backgroundColor: PUBLISH_BG,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: PUBLISH_SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 4,
        shadowOpacity: 1,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  publishIcon: {
    width: scaleSizeW(16),
    height: scaleSizeH(16),
  },
});
