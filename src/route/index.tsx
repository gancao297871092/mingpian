import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import i18n from '@/language';
import { useTheme } from '@/theme';
import type { RootStackParamList, MainTabParamList } from './map';

import Home from '@/pages/home';
import My from '@/pages/my';
import LoginHome from '@/pages/login';
import OtherNumberLogin from '@/pages/login/OtherNumberLogin';
import AgreementPage from '@/pages/login/AgreementPage';
import Detail from '@/pages/detail';
import DemosPage from '@/pages/demos';
import CameraDemo from '@/pages/demos/CameraDemo';
import GalleryDemo from '@/pages/demos/GalleryDemo';
import VideoDemo from '@/pages/demos/VideoDemo';
import QRCodeDemo from '@/pages/demos/QRCodeDemo';
import PosterDemo from '@/pages/demos/PosterDemo';
import ShareDemo from '@/pages/demos/ShareDemo';
import CarouselDemo from '@/pages/demos/CarouselDemo';
import DragSortDemo from '@/pages/demos/DragSortDemo';
import UploadDemo from '@/pages/demos/UploadDemo';
import LiquidGlassDemo from '@/pages/demos/LiquidGlassDemo';
import GaodeMapDemo from '@/pages/demos/GaodeMapDemo';
import SwipeDeleteDemo from '@/pages/demos/SwipeDeleteDemo';
import AccordionDemo from '@/pages/demos/AccordionDemo';
import TabViewDemo from '@/pages/demos/TabViewDemo';
import WebViewDemo from '@/pages/demos/WebViewDemo';
import RichTextDemo from '@/pages/demos/RichTextDemo';
import BottomSheetDemo from '@/pages/demos/BottomSheetDemo';
import NetInfoDemo from '@/pages/demos/NetInfoDemo';
import CompressorDemo from '@/pages/demos/CompressorDemo';
import ExitAppDemo from '@/pages/demos/ExitAppDemo';
import HapticDemo from '@/pages/demos/HapticDemo';
import LinearGradientDemo from '@/pages/demos/LinearGradientDemo';
import GradientTextDemo from '@/pages/demos/GradientTextDemo';
import SkeletonDemo from '@/pages/demos/SkeletonDemo';
import WheelyDemo from '@/pages/demos/WheelyDemo';
import MaskedViewDemo from '@/pages/demos/MaskedViewDemo';
import BgTimerDemo from '@/pages/demos/BgTimerDemo';
import SvgaDemo from '@/pages/demos/SvgaDemo';
import FastImageDemo from '@/pages/demos/FastImageDemo';
import ImagePreviewDemo from '@/pages/demos/ImagePreviewDemo';

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

const demoTitles: Record<string, string> = {
  CameraDemo: '摄像头',
  GalleryDemo: '相册',
  VideoDemo: '播放器',
  QRCodeDemo: '二维码',
  PosterDemo: '海报',
  ShareDemo: '分享',
  CarouselDemo: '轮播图',
  DragSortDemo: '拖拽排序',
  UploadDemo: '上传组件',
  LiquidGlassDemo: '液态玻璃',
  GaodeMapDemo: '高德地图',
  SwipeDeleteDemo: '滑块删除',
  AccordionDemo: '手风琴',
  TabViewDemo: '标签页',
  WebViewDemo: '浏览器',
  RichTextDemo: '富文本',
  BottomSheetDemo: '底部弹层',
  NetInfoDemo: '网络状态',
  CompressorDemo: '文件压缩',
  ExitAppDemo: '退出应用',
  HapticDemo: '触感反馈',
  LinearGradientDemo: '线性渐变',
  GradientTextDemo: '渐变文字',
  SkeletonDemo: '骨架屏',
  WheelyDemo: '滚轮选择',
  MaskedViewDemo: '遮罩视图',
  BgTimerDemo: '后台定时器',
  SvgaDemo: 'SVGA 动画',
  FastImageDemo: '图片缓存',
  ImagePreviewDemo: '图片预览',
};

const demoComponents: Record<string, React.ComponentType<any>> = {
  CameraDemo,
  GalleryDemo,
  VideoDemo,
  QRCodeDemo,
  PosterDemo,
  ShareDemo,
  CarouselDemo,
  DragSortDemo,
  UploadDemo,
  LiquidGlassDemo,
  GaodeMapDemo,
  SwipeDeleteDemo,
  AccordionDemo,
  TabViewDemo,
  WebViewDemo,
  RichTextDemo,
  BottomSheetDemo,
  NetInfoDemo,
  CompressorDemo,
  ExitAppDemo,
  HapticDemo,
  LinearGradientDemo,
  GradientTextDemo,
  SkeletonDemo,
  WheelyDemo,
  MaskedViewDemo,
  BgTimerDemo,
  SvgaDemo,
  FastImageDemo,
  ImagePreviewDemo,
};

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        // headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.placeholder,
        freezeOnBlur: true,
      }}
    >
      <Tab.Screen
        name="home"
        component={Home}
        options={{ title: i18n.t('首页') }}
      />
      <Tab.Screen
        name="demos"
        component={DemosPage}
        options={{ title: i18n.t('组件') }}
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
        <Stack.Screen
          name="detail"
          component={Detail}
          options={{ title: i18n.t('详情') }}
        />
        <Stack.Screen
          name="Demos"
          component={DemosPage}
          options={{ title: i18n.t('组件演示') }}
        />
        {Object.entries(demoComponents).map(([name, component]) => (
          <Stack.Screen
            key={name}
            name={name as keyof RootStackParamList}
            component={component}
            options={{ title: demoTitles[name] }}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
