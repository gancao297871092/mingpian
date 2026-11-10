# 阿里云号码认证一键登录 Android SDK

从阿里云控制台下载：**号码认证 → 概览 → API&SDK → 号码认证 / APP端 / 安卓 → 下载 SDK**。

解压后把以下 3 个 aar 放入本目录（`android/app/libs`）：

- `auth-*.aar` —— 号码认证主包（一键登录/本机号码校验）
- `logger-*.aar` —— 日志组件（必须）
- `main-*.aar` —— 基础功能组件（必须）

`app/build.gradle` 已通过 `fileTree(dir: 'libs', include: ['*.aar'])` 自动引入。
