# 阿里云号码认证一键登录 iOS SDK

从阿里云控制台下载：**号码认证 → 概览 → API&SDK → 号码认证 / APP端 / iOS → 下载 SDK**。

解压后把 **`ATAuthSDK_D.xcframework`**（动态库版，含真机 + 模拟器切片）放入本目录（`ios/PhoneLogin/`），
使目录结构如下：

```
ios/PhoneLogin/
├── PhoneLogin.podspec
├── LCPhoneLogin.h
├── LCPhoneLogin.m
└── ATAuthSDK_D.xcframework/
```

注意：
- `ATAuthSDK_D`（动态库）与 `ATAuthSDK`（静态库）只能二选一，本项目使用动态库。
- 请使用 **xcframework**（不是 frameworks 目录下的 .framework，那个只有真机 arm64 切片，
  模拟器编译会失败）。
- 放入后执行 `pod install`（在 ios 目录）。
