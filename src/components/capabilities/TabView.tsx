import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { TabView, TabBar, type Route } from 'react-native-tab-view';

const initialLayout = { width: Dimensions.get('window').width };

interface TabViewProps {
  routes?: Route[];
  renderScene?: (props: { route: Route }) => React.ReactNode;
  lazy?: boolean;
}

const defaultRoutes: Route[] = [
  { key: 'tab1', title: 'Tab 1' },
  { key: 'tab2', title: 'Tab 2' },
  { key: 'tab3', title: 'Tab 3' },
];

const Colors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
const Labels = ['内容区域 1', '内容区域 2', '内容区域 3'];

export default function CustomTabView({
  routes = defaultRoutes,
  lazy = true,
}: TabViewProps) {
  const [index, setIndex] = useState(0);

  const renderScene = useCallback(({ route }: { route: Route }) => {
    const idx = routes.findIndex(r => r.key === route.key);
    const color = Colors[idx % Colors.length] || '#999';
    return (
      <View style={[styles.page, { backgroundColor: color }]}>
        <Text style={styles.pageText}>{Labels[idx % Labels.length]}</Text>
      </View>
    );
  }, [routes]);

  const tabOptions = Object.fromEntries(
    routes.map(r => [r.key, { labelStyle: { fontWeight: '600', fontSize: 14 } as any }])
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      renderTabBar={props => (
        <TabBar
          {...props}
          options={tabOptions}
          indicatorStyle={styles.indicator}
          style={styles.tabBar}
          scrollEnabled
          tabStyle={{ width: 'auto', paddingHorizontal: 12 }}
          inactiveColor="rgba(255,255,255,0.6)"
        />
      )}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
      lazy={lazy}
    />
  );
}

export { TabView };
export type { Route };

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  indicator: {
    backgroundColor: '#fff',
    height: 3,
    borderRadius: 1.5,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
