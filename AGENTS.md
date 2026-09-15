# AGENTS.md

## 约定

- 页面头部第一原则：能使用路由（React Navigation）自带的 header 就使用自带的（在 `src/route/index.tsx` 的 `Stack.Screen options` 中配置 `title`、`headerStyle`、`headerTitleStyle`、`headerShadowVisible`），不要自定义头部；使用路由头部后页面内 `SafeView` 不要预留顶部 inset（用默认 `disableTop`）。
- 验证命令：`npx tsc --noEmit` 与 `npx eslint <改动文件>`，完成后必须运行通过。
- 安装依赖使用 `npm install --legacy-peer-deps`（项目 gesture-handler v3 与部分库存在历史 peer 冲突）。
