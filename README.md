# RnBaseTemplate

React Native 0.86 新架构基础模版。

## 技术栈

| 类别 | 库 | 版本 |
|---|---|---|
| 核心 | react-native | 0.86.0 |
| | react | 19.2 |
| | typescript | 5.x |
| 导航 | @react-navigation/native / native-stack / bottom-tabs | 7.x |
| 手势/动画 | react-native-gesture-handler | 3.x |
| | react-native-reanimated + worklets | 4.5 / 0.11 |
| 屏幕 | react-native-screens / safe-area-context | 4.x / 5.x |
| 存储 | react-native-mmkv（Nitro） | 4.x |
| 状态管理 | zustand（persist + MMKV） | 5.x |
| 网络 | axios + @tanstack/react-query | 1.x / 5.x |
| 国际化 | i18n-js + react-native-localize | 4.x |
| 动画 | lottie-react-native | 7.x |
| 工具 | dayjs | 1.x |

## 目录结构

```
src/
├── api/            # API 接口层（namespace 风格，基于 axios 封装）
├── assets/         # 静态资源（lottile/ 动画）
├── components/     # 通用组件（Empty / End / LottieRefreshList）
├── hooks/          # usePageList（分页）/ useDetail（详情）
├── language/       # 国际化 cn / tw / us + i18n 实例
├── route/          # 路由：NavigationContainer + Stack + Tabs，map.ts 路由参数类型
├── pages/          # 页面：home（Lottie 下拉刷新列表示例）/ detail / my
├── store/          # zustand 状态（user 示例，MMKV 持久化）
├── config/         # 环境配置（env.ts，基于 react-native-config）
├── theme/          # 主题：ThemeProvider + useTheme（亮/暗色板）
└── utils/
    ├── storage.ts      # MMKV 存储封装
    ├── request.ts      # axios 实例 + 拦截器 + 统一响应类型
    ├── screenUtils.ts  # 屏幕适配 scaleSizeW / scaleSizeH / setSpText
    └── permission.ts   # 统一权限：requestPermission / checkPermission / openAppSettings
```

## 约定

- 路径别名：`@/*` → `src/*`（babel module-resolver + tsconfig paths + jest moduleNameMapper）
- 接口返回统一格式：`ResponseResult<T>`（code/msg/data）、`PageList<T>`（分页）
- 响应拦截器自动携带 `token`（存于 MMKV），401 自动清除
- 国际化使用 `i18n.t('中文key')`，语言持久化到 MMKV
- Tab 页已开启 `freezeOnBlur`

## 主题（亮/暗模式）

基于 `src/theme`：`ThemeProvider` 提供 `useTheme()`，导航（NavigationContainer / Tab）与页面自动随主题切换。主题模式（跟随系统 / 浅色 / 深色）存于 `src/store/theme.ts`（MMKV 持久化），「我的」页提供切换入口：

```tsx
const theme = useTheme();
const { mode, setMode } = useThemeMode(); // 'system' | 'light' | 'dark'
<View style={{ backgroundColor: theme.background }}>
  <Text style={{ color: theme.text }} />
</View>
```

色板 token：`primary / background / card / text / subText / placeholder / border / danger`。

## 权限统一封装

`src/utils/permission.ts` 提供跨平台统一权限 API，避免各页面各自处理：

| API | 说明 |
|---|---|
| `requestPermission('camera' \| 'microphone' \| 'photo' \| 'location')` | 发起请求，返回 `{ status, granted }` |
| `checkPermission(type)` | 仅检查当前状态 |
| `openAppSettings()` | 跳转系统设置（被拒后引导用） |

`status` 取值：`granted / denied / blocked / restricted / not-determined`。相机走 vision-camera，相册走 `PermissionsAndroid`（API 33+ 用 READ_MEDIA_IMAGES），定位走高德模块。

## 多环境配置

基于 `react-native-config` + `.env` 文件，`src/config/env.ts` 提供类型化入口：

| 环境 | 文件 | iOS | Android |
|---|---|---|---|
| dev | `.env` | Debug 构建默认 | debug 构建默认 |
| staging | `.env.staging` | `ENVFILE=.env.staging` | `ENVFILE=.env.staging ./gradlew assembleRelease` |
| prod | `.env.prod` | Release 构建默认 | release 构建默认（build.gradle `envConfigFiles`） |

- `.env` / `.env.*` 均不入库（gitignore），需从 `.env.example` 复制
- 变量禁止使用 `ENV` 等 Expo 保留键名（会导致 iOS EXConstants 脚本失败），统一使用 `APP_ENV`
- 代码中通过 `import { env } from '@/config/env'` 读取（含兜底逻辑）

## 启动屏

基于 `react-native-bootsplash`，启动即显示蓝色 Logo 屏（原生 storyboard / Android theme），JS 首帧挂载后淡出：

```tsx
useEffect(() => {
  BootSplash.hide({ fade: true });
}, []);
```

修改 Logo / 背景色后重新生成资源：

```bash
npx react-native-bootsplash generate <logo.png> \
  --platforms=android,ios --background=2563EB --logo-width=100 \
  --assets-output=assets/bootsplash
```

## Lottie 下拉刷新

`LottieRefreshList`：纯 JS 实现（reanimated + gesture-handler），不依赖 smart-refresh。
下拉过程 lottie 按距离逐帧播放，超过阈值触发刷新并循环播放，`refreshing` 置 false 后自动收起。

```tsx
<LottieRefreshList
  source={require('@/assets/lottile/materialAdapter.json')}
  refreshing={fetching}
  onRefresh={refresh}
  data={list}
  renderItem={...}
/>
```

注意：列表已禁用原生回弹（`bounces={false}`），下拉手势完全由组件接管。

## 常用命令

```bash
npm start              # 启动 metro
npm run ios            # iOS（首次需 cd ios && bundle exec pod install）
npm run android        # Android
npm run lint           # eslint
npm test               # jest
npx tsc --noEmit       # 类型检查
```

## iOS 首次运行

```bash
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
```
