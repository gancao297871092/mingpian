import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme';
import LiquidGlassTabBar from '@/components/LiquidGlassTabBar';
import { navigationRef } from './navigationRef';
import type { RootStackParamList, MainTabParamList } from './map';

import Home from '@/pages/home';
import LinkPage from '@/pages/link';
import MessagePage from '@/pages/message';
import My from '@/pages/my';
import LoginHome from '@/pages/login';
import OtherNumberLogin from '@/pages/login/OtherNumberLogin';
import AgreementPage from '@/pages/login/AgreementPage';
import EditCard from '@/pages/editCard';
import AddItem from '@/pages/editCard/AddItem';
import RichTextEdit from '@/pages/common/RichTextEdit';
import Publish from '@/pages/publish';
import PublishCover from '@/pages/publish/CoverSelect';
import LongTextEdit from '@/pages/publish/LongTextEdit';
import DraftBox from '@/pages/publish/DraftBox';
import BbsDetail from '@/pages/bbsDetail';
import ReportBbs from '@/pages/report';

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
  return (
    <Tab.Navigator
      tabBar={props => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        freezeOnBlur: true,
      }}
    >
      <Tab.Screen
        name="home"
        component={Home}
        options={{ title: '广场', headerShown: false }}
      />
      <Tab.Screen
        name="link"
        component={LinkPage}
        options={{ title: '链接', headerShown: false }}
      />
      <Tab.Screen
        name="message"
        component={MessagePage}
        options={{ title: '消息', headerShown: false }}
      />
      <Tab.Screen
        name="my"
        component={My}
        options={{ title: '我的' }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const navTheme = useNavTheme();
  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false}}
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
        <Stack.Screen
          name="editCard"
          component={EditCard}
          options={{ title: '', headerStyle: { backgroundColor: '#FFFFFF' }, headerShadowVisible: false, }}
        />
        <Stack.Screen
          name="addItem"
          component={AddItem}
          options={{ title: '', headerStyle: { backgroundColor: '#FFFFFF' }, headerShadowVisible: false, }}
        />
        <Stack.Screen
          name="richTextEdit"
          component={RichTextEdit}
          options={{ title: '', headerStyle: { backgroundColor: '#FFFFFF' }, headerShadowVisible: false, }}
        />
        <Stack.Screen
          name="publish"
          component={Publish}
          options={{
            title: '统一发布',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
            headerBackButtonMenuEnabled: false,
          }}
        />
        <Stack.Screen
          name="publishLongText"
          component={LongTextEdit}
          options={{
            title: '编辑正文',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="draftBox"
          component={DraftBox}
          options={{
            title: '草稿箱',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="publishCover"
          component={PublishCover}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="bbsDetail"
          component={BbsDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="reportBbs"
          component={ReportBbs}
          options={{
            title: '举报动态',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
