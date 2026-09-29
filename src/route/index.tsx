import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme';
import LiquidGlassTabBar from '@/components/LiquidGlassTabBar';
import { navigationRef } from './navigationRef';
import type { RootStackParamList, MainTabParamList } from './map';

import Home from '@/pages/square/home';
import LinkPage from '@/pages/link';
import MessagePage from '@/pages/message';
import My from '@/pages/my';
import EditProfile from '@/pages/my/EditProfile';
import Settings from '@/pages/my/settings';
import AccountSecurity from '@/pages/my/settings/AccountSecurity';
import VerifyIdentity from '@/pages/my/settings/VerifyIdentity';
import ChangePhoneVerify from '@/pages/my/settings/ChangePhoneVerify';
import BindPhone from '@/pages/my/settings/BindPhone';
import ChangePassword from '@/pages/my/settings/ChangePassword';
import CertificationCenter from '@/pages/my/settings/CertificationCenter';
import GeneralSettings from '@/pages/my/settings/GeneralSettings';
import DefaultHomeSetting from '@/pages/my/settings/DefaultHomeSetting';
import PrivacySettings from '@/pages/my/settings/PrivacySettings';
import HelpCenter from '@/pages/my/settings/HelpCenter';
import AboutUs from '@/pages/my/settings/AboutUs';
import WechatAuth from '@/pages/my/settings/WechatAuth';
import WechatBoundOther from '@/pages/my/settings/WechatBoundOther';
import WechatBindSuccess from '@/pages/my/settings/WechatBindSuccess';
import EditName from '@/pages/my/EditName';
import EditBio from '@/pages/my/EditBio';
import Follows from '@/pages/my/follows';
import Workbench from '@/pages/my/Workbench';
import TouchTasks from '@/pages/my/TouchTasks';
import TouchTaskDetail from '@/pages/my/TouchTaskDetail';
import BrowseHistory from '@/pages/my/BrowseHistory';
import CompanyManage from '@/pages/my/CompanyManage';
import CompanyInfo from '@/pages/my/company/CompanyInfo';
import CompanyModuleEdit from '@/pages/my/company/CompanyModuleEdit';
import CompanyContactEdit from '@/pages/my/company/CompanyContactEdit';
import CompanyMembers from '@/pages/my/company/CompanyMembers';
import CompanyMemberAudit from '@/pages/my/company/CompanyMemberAudit';
import CompanyBbsAudit from '@/pages/my/company/CompanyBbsAudit';
import CompanyCapCards from '@/pages/my/company/CompanyCapCards';
import CompanyJobChange from '@/pages/my/company/CompanyJobChange';
import CompanyJoin from '@/pages/my/company/CompanyJoin';
import CompanyRealName from '@/pages/my/company/CompanyRealName';
import LoginHome from '@/pages/login';
import OtherNumberLogin from '@/pages/login/OtherNumberLogin';
import AgreementPage from '@/pages/login/AgreementPage';
import EditCard from '@/pages/card/editCard';
import AddItem from '@/pages/card/editCard/AddItem';
import RichTextEdit from '@/pages/card/common/RichTextEdit';
import Publish from '@/pages/square/publish';
import PublishCover from '@/pages/square/publish/CoverSelect';
import LongTextEdit from '@/pages/square/publish/LongTextEdit';
import DraftBox from '@/pages/square/publish/DraftBox';
import BbsDetail from '@/pages/square/bbsDetail';
import BbsShareImage from '@/pages/square/bbsShareImage';
import SearchPage from '@/pages/square/search';
import ReportBbs from '@/pages/square/report';

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
        options={{ title: '我的', headerShown: false }}
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
          name="bbsShareImage"
          component={BbsShareImage}
          options={{
            title: '生成分享图',
            headerStyle: { backgroundColor: '#000000' },
            headerTitleStyle: { color: '#FFFFFF' },
            headerTintColor: '#FFFFFF',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="search"
          component={SearchPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="editProfile"
          component={EditProfile}
          options={({ navigation }) => ({
            title: '编辑资料',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
            headerRight: () => (
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#000000' }} onPress={() => navigation.goBack()}>
                预览
              </Text>
            ),
          })}
        />
        <Stack.Screen
          name="settings"
          component={Settings}
          options={{
            title: '设置',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="accountSecurity"
          component={AccountSecurity}
          options={{
            title: '账号与安全',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="verifyIdentity"
          component={VerifyIdentity}
          options={{
            headerTitle: '',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="changePhoneVerify"
          component={ChangePhoneVerify}
          options={{
            headerTitle: '',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="bindPhone"
          component={BindPhone}
          options={{
            headerTitle: '',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="changePassword"
          component={ChangePassword}
          options={{
            title: '修改密码',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="certificationCenter"
          component={CertificationCenter}
          options={{
            title: '',
            headerStyle: { backgroundColor: '#E8EFFF' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="generalSettings"
          component={GeneralSettings}
          options={{
            title: '通用设置',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="defaultHomeSetting"
          component={DefaultHomeSetting}
          options={{
            title: '默认首页设置',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="privacySettings"
          component={PrivacySettings}
          options={{
            title: '隐私与权限',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="helpCenter"
          component={HelpCenter}
          options={{
            title: '帮助与客服',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="aboutUs"
          component={AboutUs}
          options={{
            title: '关于我们',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="wechatAuth"
          component={WechatAuth}
          options={{
            headerTitle: '',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="wechatBoundOther"
          component={WechatBoundOther}
          options={{
            headerTitle: '',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="wechatBindSuccess"
          component={WechatBindSuccess}
          options={{
            headerTitle: '',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="editName"
          component={EditName}          options={{
            title: '编辑名字',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="editBio"
          component={EditBio}
          options={{
            title: '编辑简介',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
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
        <Stack.Screen
          name="follows"
          component={Follows}
          options={{
            title: '',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="workbench"
          component={Workbench}
          options={{
            title: '业务员工作台',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="touchTasks"
          component={TouchTasks}
          options={{
            title: '触达待办',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="touchTaskDetail"
          component={TouchTaskDetail}
          options={{
            title: '任务详情',
            headerStyle: { backgroundColor: '#E8EFFF' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="browseHistory"
          component={BrowseHistory}
          options={{
            title: '浏览记录',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="companyManage"
          component={CompanyManage}
          options={{
            title: '企业管理',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="companyInfo"
          component={CompanyInfo}
          options={{
            title: '企业信息',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="companyModuleEdit"
          component={CompanyModuleEdit}
          options={{
            title: '编辑模块',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="companyContactEdit"
          component={CompanyContactEdit}
          options={{
            title: '联系方式',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="companyMembers"
          component={CompanyMembers}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="companyMemberAudit"
          component={CompanyMemberAudit}
          options={{
            title: '成员审核',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="companyBbsAudit"
          component={CompanyBbsAudit}
          options={{
            title: '动态审核',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="companyCapCards"
          component={CompanyCapCards}
          options={{
            title: '能力卡管理',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="companyJobChange"
          component={CompanyJobChange}
          options={{
            title: '职位变更',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="companyJoin"
          component={CompanyJoin}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="companyRealName"
          component={CompanyRealName}
          options={{
            title: '实名认证',
            headerStyle: { backgroundColor: '#F6F7FB' },
            headerTitleStyle: { color: '#000000' },
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
