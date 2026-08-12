import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView,
} from 'react-native';
import { TabView, TabBar, type Route } from 'react-native-tab-view';
import { LiquidGlass } from '@/components/capabilities';

const initialLayout = { width: Dimensions.get('window').width };

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
];

const TABS = [
  { key: 'tab1', title: '推荐' },
  { key: 'tab2', title: '关注' },
  { key: 'tab3', title: '热门' },
  { key: 'tab4', title: '同城' },
  { key: 'tab5', title: '视频' },
  { key: 'tab6', title: '直播' },
  { key: 'tab7', title: '数码' },
  { key: 'tab8', title: '美食' },
  { key: 'tab9', title: '旅游' },
  { key: 'tab10', title: '游戏' },
];

const TabContent = ({ color, label }: { color: string; label: string }) => (
  <View style={[styles.scene, { backgroundColor: color }]}>
    <Text style={styles.sceneText}>{label}</Text>
  </View>
);

export default function TabViewDemo() {
  const [index, setIndex] = useState(0);
  const [routes] = useState<Route[]>(TABS);

  const renderScene = useCallback(({ route }: { route: Route }) => {
    const idx = routes.findIndex(r => r.key === route.key);
    return (
      <TabContent
        color={COLORS[idx % COLORS.length]}
        label={(route.title || '') + ' 内容'}
      />
    );
  }, [routes]);

  const tabOptions = Object.fromEntries(
    routes.map(r => [r.key, { labelStyle: { fontWeight: '600', fontSize: 13 } as any }])
  );

  return (
    <SafeAreaView style={styles.container}>
      <LiquidGlass style={styles.header} effect="clear">
        <Text style={styles.title}>可滑动标签页</Text>
        <Text style={styles.desc}>10 个标签，支持左右滑动、懒加载</Text>
      </LiquidGlass>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={props => (
          <TabBar
            {...props}
            options={tabOptions}
            scrollEnabled
            indicatorStyle={styles.indicator}
            style={styles.tabBar}
            tabStyle={{ width: 'auto', paddingHorizontal: 12 }}
            activeColor="#1EA3B5"
            inactiveColor="#999"
          />
        )}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        lazy
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16, borderRadius: 0 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#666' },
  tabBar: {
    backgroundColor: '#fff',
    elevation: 0,
    shadowOpacity: 0,
  },
  tab: {
    width: 'auto',
    paddingHorizontal: 16,
  },
  indicator: {
    backgroundColor: '#1EA3B5',
    height: 3,
    borderRadius: 1.5,
  },
  scene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sceneText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
