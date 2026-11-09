# 版本与内部测试发布

首次内部测试：版本号 `1.0.0`，构建号 `1`。

## 更新规则

- 版本号采用 `主版本.次版本.修订版本`，例如 `1.0.0`。
- 同一版本修正测试问题并重新上传：保留版本号，递增构建号，例如 `1.0.0 (2)`。
- 发布修复版：例如 `1.0.1`；发布新功能版：例如 `1.1.0`；重大版本：例如 `2.0.0`。
- 构建号采用持续递增的正整数，跨版本也不重置。上传前确认大于后台已上传的构建号。
- TestFlight 测试版本也使用数字版本号，不添加 `beta`、`debug` 等后缀。

## 需要同步的配置

| 配置文件 | 版本号 | 构建号 |
| --- | --- | --- |
| `ios/RnBaseTemplate.xcodeproj/project.pbxproj` | Debug、Release 的 `MARKETING_VERSION` | Debug、Release 的 `CURRENT_PROJECT_VERSION` |
| `android/app/build.gradle` | `versionName` | `versionCode` |
| `package.json` | `version` | 无 |
| `package-lock.json` | 顶层和 `packages[""]` 的 `version` | 无 |

iOS 的 `Info.plist` 已引用构建变量，不要再写死另一份版本号。

## 上传 TestFlight

1. 打开 `ios/RnBaseTemplate.xcworkspace`，确认目标 App 的 Version / Build。
2. 选择真机或 Any iOS Device，使用 Product → Archive 创建 Release 归档。
3. 在 Organizer 中检查归档版本，通过 Distribute App → App Store Connect 上传。
4. 后台构建处理完成后，在 TestFlight 中将构建加入内部测试组，并完成后台要求的信息。

本地版本配置不代表已上传。若后台已存在构建号 `1` 或更高，上传前必须增加本地构建号。
