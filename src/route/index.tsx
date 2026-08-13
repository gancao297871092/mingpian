import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import i18n from '@/language';
import { useTheme } from '@/theme';
import LiquidGlassTabBar from '@/components/LiquidGlassTabBar';
import type { RootStackParamList, MainTabParamList } from './map';

import Home from '@/pages/home';
import My from '@/pages/my';
import LoginHome from '@/pages/login';
import OtherNumberLogin from '@/pages/login/OtherNumberLogin';
import AgreementPage from '@/pages/login/AgreementPage';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function useNavTheme() {
  const theme = useTheme();
  return {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.danger,
    },
  };
}

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      tabBar={props => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.placeholder,
        freezeOnBlur: true,
      }}
    >
      <Tab.Screen
        name="home"
        component={Home}
        options={{ title: i18n.t('首页'), headerShown: false}}
      />
      <Tab.Screen
        name="my"
        component={My}
        options={{ title: i18n.t('我的') }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const navTheme = useNavTheme();
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="login"
          component={LoginHome}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="otherLogin"
          component={OtherNumberLogin}
          options={{
            headerTitle: '',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitleStyle: { color: '#000000' },
          }}
        />
        <Stack.Screen
          name="agreement"
          component={AgreementPage}
          options={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitleStyle: { color: '#000000' },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
