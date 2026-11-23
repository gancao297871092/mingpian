# 推送全链路自检报告 & 客户测试指引（2026-11-17）

> 范围：极光推送 + 5 家厂商通道（华为/荣耀/OPPO/小米/vivo）集成后的上架前自检。
> 结论：**可发客户测试包**。静态自检全部通过，真机验收项由客户代测（见文末指引）。

---

## 一、自检结果总览

| # | 检查项 | 方法 | 结果 |
|---|---|---|---|
| 1 | 厂商通道参数落位 | 反编译 release 合并 manifest | ✅ 荣耀 AppID、OPPO 三件套、华为 json（assets）全部正确 |
| 2 | 小米/vivo 空占位安全性 | 反编译 jpush 6.3.0 主 SDK | ✅ 空 appid 被 `TextUtils.isEmpty` 跳过，惰性无害 |
| 3 | 隐私合规链 | 代码审查 | ✅ 同意前 `JCollectionAuth.setAuth(false)` 冻结；同意后 init |
| 4 | JS 初始化链 | 代码审查 | ✅ `setAuth(true) → init → rid 重试 3 次 → 后端 bind` |
| 5 | iOS 生产环境 | entitlements + JS init 参数 | ✅ release 自动 `production=true` + Xcode 自动签名换生产 APNs |
| 6 | 后端 bind 接口 | 代码审查（端点/参数/落库） | ✅ `/common/push/bind` upsert rid，登录态回填 userId |
| 7 | 后端推送覆盖 | JpushService 审查 | ✅ android+ios 双平台；APNs 生产环境（REST 默认） |
| 8 | 诊断埋点清理 | `PUSH_DIAG=false` | ✅ 客户包无诊断 toast |
| 9 | 混淆/签名 | build.gradle 审查 | ✅ release 未开 minify；debug/release 同 keystore，厂商登记指纹通用 |
| 10 | 鸿蒙 NEXT（卓易通容器） | 真机实测 | ⚠️ 容器限制：推送不可用（含极光通道），行业通病，不阻塞上架 |

---

## 二、厂商通道状态矩阵

| 通道 | 客户端配置 | 平台侧状态 | 本次可验 |
|---|---|---|---|
| 华为 | ✅ `assets/agconnect-services.json`（app_id 114919015） | ✅ 已配置 | ✅ 安卓底华为/老荣耀真机 |
| 荣耀 | ✅ `HONOR_APPID=104603894` | ✅ 已配置 | ✅ 新荣耀真机 |
| OPPO | ✅ AppID/Key/Secret 三件套 | ✅ 已配置 | ✅ OPPO/一加/realme 真机 |
| 小米 | ⏳ 占位留空（安全） | 🔒 上架小米商店后开通 | ❌ 本次仅验极光在线通道 |
| vivo | ⏳ 占位留空（安全） | 🔒 上架 vivo 商店后开通 | ❌ 同上 |

**小米/vivo 补充说明**：两家推送服务要求 App 先上架对应商店才能开通，属流程死结。客户端已用空占位符集成完毕（反编译验证空值被 SDK 跳过，对任何设备无影响），上架开通后 **1.0.1 只需填值重发，无需改代码**。

## 三、关键链路结论

### 3.1 隐私合规链（工信部要求）
- 原生 `MainApplication` 启动即 `JCollectionAuth.setAuth(false)`：同意前极光完全冻结；
- 用户点「同意并继续」→ MMKV 落标记 → `setupPush()`：`setAuth(true) → init → 监听 → 权限 → rid 绑定`；
- rid 为空自动重试 3 次（3s/8s/15s），失败静默，下次冷启动/登录重试。

### 3.2 iOS 生产环境（两个易错点均已确认）
- JS 侧 `JPush.init({ production: !__DEV__ })`：release 包自动 `production=true`；
- entitlements 里 `aps-environment=development` 是 Xcode 常态，Archive 导出时自动签名会换成 production；
- 后端 `apns_production` 未显式设置，按极光 REST API v3 文档**缺省即生产环境**，与 release 匹配。

### 3.3 后端
- `POST /common/push/bind`：deviceId+rid 校验（必填、≤64 字符），按 deviceId upsert `wq_app_activation`，登录态自动回填 userId 完成人-设备关联；
- 推送服务端 android+ios 双平台 payload 齐备；
- prod 环境变量 `JPUSH_APP_KEY` / `JPUSH_MASTER_SECRET` 需部署机已配置（用户确认项）。

### 3.4 鸿蒙 NEXT（卓易通容器）——已知限制
- 实测：App 可通过卓易通安装运行，一键登录等核心功能正常；
- **推送（含极光自有通道）在容器内不可用**：容器压制后台常驻 Service，所有未做鸿蒙原生适配的 App 均如此，非代码问题；
- 解法：中期鸿蒙原生版（react-native-harmony + Push Kit），立项信号为上架后 NEXT 占比 >10%。

## 四、客户测试指引（转客户）

### 测试包说明
- 包位置：`android/app/build/outputs/apk/release/app-release.apk`（正式 release 签名，与上架同库）；
- 首启会出现**隐私政策弹窗，必须点「同意并继续」**，否则推送按合规设计不初始化（不是 bug）；
- **所有包（含 release）都连测试服 `apptest.cqwqjl.com`**——验证 bind 落库时请查测试服数据库，勿查生产库。

### 已验证基线（2026-11-17，release 包真机实测）
- 小米 10（HyperOS）：前台/后台推送正常；
- 小米 M2002J9E（Android 13）：前台/后台推送正常；
- **荣耀 MBH-AN10：杀进程厂商通道推送正常（荣耀通道全链路验收通过）**；
- realme RMX5010（OPPO 通道）：token 注册正常，当日测试撞「单设备日限额」被厂商限流（非配置问题），次日配额重置后复验；
- iOS：推送正常。

### 「查 rid 是否落库」的正确姿势
客户端 deviceId = 设备 ANDROID_ID。手机上查看路径：设置 → 关于手机 → 状态信息（部分机型在「全部参数」里）；或登录后按 userId 反查：

```sql
-- 按登录用户查（推荐，最直接）
SELECT device_id, jpush_rid, jpush_rid_time, user_id, os
FROM wq_app_activation
WHERE user_id = <测试账号的用户ID>
ORDER BY update_time DESC;
```

`jpush_rid` 有值且 `jpush_rid_time` 为测试当天 = bind 落库成功。

### 验收用例（按设备品牌）

**所有安卓设备通用——极光在线通道：**
1. 安装 → 同意隐私弹窗 → 登录任意账号；
2. 通知运营在极光控制台/后端发一条测试推送；
3. App **前台**：应弹出应用内横幅（点击跳转对应页面）；
4. App **退后台**：应收到系统通知栏消息，点击跳回 App 对应页面。

**厂商通道（杀进程推送）——需对应品牌真机：**

| 设备 | 步骤 | 预期 |
|---|---|---|
| 华为（EMUI/鸿蒙 4 及以前） | 杀掉 App 进程后发推送 | ✅ 系统通知栏收到 |
| 新荣耀（Magic UI 6.0+） | 同上 | ✅ 收到 |
| OPPO / 一加 / realme | 同上 | ✅ 收到 |
| 小米 / vivo | 同上 | ❌ **本次预期收不到**（通道待上架后开通，1.0.1 补齐）——App 活着时在线推送正常即可 |

**iOS（如客户有 TestFlight 包）：**
- 前后台推送收发、点击跳转；release 包走 APNs 生产环境。

### 问题反馈格式
请按此格式回报问题，便于定位：
- 设备品牌+型号+系统版本（如 OPPO Reno11 / ColorOS 14）
- 测试场景（前台/后台/杀进程）
- 现象（收到/收不到/点击无跳转）
- 大概时间点（用于后端对照推送日志 `[JPUSH]`）

### ⚠️ 厂商通道测试特别纪律（已踩坑实证）
**同一设备不要连续发多条测试推送**——OPPO/荣耀对营销类消息有「单应用单设备每日限额」（约 2 条/天），连发会触发厂商限流被拒（极光后台显示「单应用单设备限量」折损），造成「通道坏了」的假象。**正确姿势：杀进程 → 只发一条 → 等 1-2 分钟观察**；当天额度用尽后换设备或等次日重置再测。

## 五、客户测试通过后

1. 用 `PUSH_DIAG=false` 的代码重打正式 release 包（本包即是）；
2. 上架各商店；
3. 小米/vivo 商店过审后：开通推送服务 → 把参数填入 `android/app/build.gradle` 的 `XIAOMI_APPID/KEY`、`VIVO_APPID/KEY` 占位 → 发 1.0.1（无需其他代码改动）。
