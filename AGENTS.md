# AGENTS.md

## 约定

- 页面头部第一原则：能使用路由（React Navigation）自带的 header 就使用自带的（在 `src/route/index.tsx` 的 `Stack.Screen options` 中配置 `title`、`headerStyle`、`headerTitleStyle`、`headerShadowVisible`），不要自定义头部；使用路由头部后页面内 `SafeView` 不要预留顶部 inset（用默认 `disableTop`）。
- 例外：「我的」tab（`src/pages/my`）按设计稿「64.我的」不使用系统头（`headerShown: false`），状态栏压在渐变头部上（白色状态栏图标，离开时恢复），渐变背景通过绝对定位延伸至状态栏区域。
- 验证命令：`npx tsc --noEmit` 与 `npx eslint <改动文件>`，完成后必须运行通过。
- 安装依赖使用 `npm install --legacy-peer-deps`（项目 gesture-handler v3 与部分库存在历史 peer 冲突）。
