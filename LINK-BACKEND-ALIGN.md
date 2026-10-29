# 「链接」模块联调 · 后端调整清单

> 前端仓库：`mingpian-app`（分支工作区 HEAD `9e54907`）
> 后端基线：`wanq-app` HEAD `34671a0 链接`（工作区干净）
> 文档目的：列清前端页面已依赖、但后端当前不满足的点，供后端按优先级调整。
> 每项都给了「现状 → 建议改动 → 前端影响」，可以逐条勾选回复。

---

## 0. 通用约定（已对齐，无需改动）

| 项 | 约定 |
|---|---|
| Base URL | `http://192.168.110.222:9090/v1`，下文路径**省略 `/v1`** |
| 鉴权 | Header `token` |
| 响应体 | `{ ok, code, msg, data }`，前端以 `code === '200'` 判成功 |
| 分页 | 请求 `pageNum/pageSize`（默认 1/10），返回 `{ list, total, pageNum, pages }` |
| 时间 | `yyyy-MM-dd HH:mm:ss` 或 ISO `yyyy-MM-ddTHH:mm:ss` 均可（前端正则同时兼容），**不要返回时间戳数组** |
| 错误提示 | `msg` 直接展示给用户，认证类错误文案「请先完成企业认证」保持 |

前端已对接完成的接口（后端无需改动，仅供对照）：

```
POST /ai/discovery/list      POST /ai/home/summary(GET)
GET  /ai/opportunity/detail  POST /ai/opportunity/visible
POST /ai/opportunity/confirm POST /ai/happening/list
POST /ai/direction/list      GET  /ai/direction/user
POST /ai/match/list          POST /ai/match/ignore
GET  /ai/company/profile
```

---

## 1. 页面 ↔ 数据源对照（说明为什么要改）

| 页面 | 当前取数 | 缺口 |
|---|---|---|
| 方向推荐 `AiDiscoveries` | `/ai/discovery/list` | 搜索无 keyword |
| 方向详情 `DirectionDetail` | 应取 `opportunityId` 对应商机 | **`/ai/direction/list` 是另一套模型（T5），取不到** |
| 机会详情 `OpportunityDetail` | `/ai/opportunity/detail` + `/ai/match/list` | 基本可用，缺浏览回写 |
| 产业正在发生 `IndustryHappening` | `/ai/happening/list` | 搜索无 keyword |
| 我的信号 `MySignals` | `/signal/list` | tab 口径对不上；缺编辑/重提 |
| 创建信号 `CreateCooperationSignal` | `/signal/create` | 编辑模式无接口 |
| 信号进展 `SignalProgress` | `/signal/progress` | 缺剩余天数/暂停原因 |
| 我的商机 `MyOpportunities` | `/lead/list` | **缺企业合作池（pool）与接手** |
| 创建意向书 / 查看 | `/intent/create`、`/intent/detail` | 只有 `receiverCpId`，缺按商机发起；`cardSnapshot` schema 未定 |
| 申请平台协助 `PlatformAssist` | `/assist/apply`、`/assist/list` | `context` schema 未固定；列表缺文案字段 |
| 链接首页 `index` | `/ai/home/summary` | 可用，待联调 |

---

# P0 · 不改前端就跑不通

## P0-1 方向详情：需要「按 opportunityId 取方向」的入口

**现状**

- 方向推荐列表返回的是 `opportunityId`（`wq_bbs_opportunity.id`），点击后进入方向详情。
- `/ai/direction/list` 操作的是 `wq_cooperation_direction`（T5），按 `userId` 查，与 `opportunityId` 无关联；`WqCooperationDirection` 也没有 `confirmStatus` 字段。
- 结果：前端点进方向详情后没有任何接口能拿到标题/分析/依据/相关企业。

**建议改动**（二选一）

方案 A（推荐，改动最小）：`/ai/direction/list` 增加 `opportunityId` 入参

```
POST /ai/direction/list
{ "opportunityId": 123, "offset": 0, "size": 3 }

data: {
  "direction": {            // 由该商机组装（或 T5 关联出的方向）
    "opportunityId": 123,
    "directionName": "华东化工客户吨袋集采对接",
    "directionDesc": "……AI 分析……",
    "stage": "AI研判",       // 明确表达 / AI研判
    "basisList": [ { "type": "company_info", "label": "企业信息 · 吨袋包装制造", "refId": 88 } ]
  },
  "companies": [            // 轮换候选，复用现有 rotateRelatedCompanies 逻辑
    { "companyId": 1, "companyName": "…", "companyLogo": "…", "companyTypes": "煤矿装备制造", "reason": "…" }
  ],
  "total": 12
}
```

方案 B：新增 `GET /ai/opportunity/direction?opportunityId=`

**前端影响**：方向详情页一次请求即可渲染标题、分析、依据、相关企业、「换一批」（`offset` 递增）。

---

## P0-2 方向详情「明确该方向」的状态回写

**现状**

- 按钮语义 = 把「AI研判」升级为「明确表达」。
- `/ai/opportunity/confirm` 只允许 `opp.userId` 本人操作，且 `confirm` 仅能从 `confirmStatus=0` 发起。
- 若 P0-1 走方案 A 返回的是 T5 方向，`wq_cooperation_direction` 没有对应状态位。

**建议改动**

- 沿用 `/ai/opportunity/confirm`，入参 `{ opportunityId, action: "confirm" | "withdraw" | "reject" }` 不变；
- 若方向详情展示的确实是 `wq_cooperation_direction`，请补：
  - `direction.confirmStatus`（0 AI研判 / 1 明确表达 / 2 已驳回）
  - `POST /ai/direction/confirm { directionId, action }`
- 页面按钮需要根据 `confirmStatus`/`role` 显示不同文案（本人未确认→「明确该方向」；已确认→「撤回」；非本人→隐藏）。请返回一个 `canConfirm: boolean`。

**前端影响**：按钮点击后的状态即时刷新，且非本人从「产业正在发生」进来时不显示确认按钮。

---

## P0-3 列表关键词搜索：`keyword` 入参

**现状**

- `/ai/discovery/list`、`/ai/happening/list` 都没有关键词参数。
- 前端目前只能「搜索时一次拉 100 条再本地过滤」，数据一多必然漏。

**建议改动**

```
POST /ai/discovery/list
{ "filter": "all", "keyword": "吨袋", "pageNum": 1, "pageSize": 10 }

POST /ai/happening/list
{ "oppType": "purchase", "keyword": "自动化", "pageNum": 1, "pageSize": 10 }
```

匹配范围：`title`、`aiAnalysis`、`requiredAbilities`、以及依据文案对应的
`wq_company_profile.industry` / `wq_capability_card.card_name` / `wq_user_bbs.title`。
`counts` 需与 keyword 联动（即筛选后的计数）。

**前端影响**：去掉 100 条兜底逻辑，搜索直接分页。

---

## P0-4 信号编辑 / 重提接口

**现状**

- `AppSignalController` 只有 `create / list / detail / finish / progress / copy / received / response`。
- 前端「编辑合作信号」有编辑模式（路由 `createCooperationSignal` 携带 `id`），且流程要求「审核失败 → 修改 → 重新提交」，后端没有对应接口。

**建议改动**

```
POST /signal/update
{
  "signalId": 12,
  "targetDesc": "……",              // 必填，≤512
  "purpose": "……",                 // 可选，≤255
  "abilityContent": "……",
  "identityCardId": 3,
  "reachConfig": "{\"cycle_days\":7,\"max_per_target\":2,\"regions\":[\"华东\"]}"
}
```

校验与副作用：

- 仅 `signal.userId == loginUserId`；
- 允许编辑的状态：`status=1`（待审核/审核失败）或 `status=3`（已暂停）；`status in (2,4,5)` 拒绝，文案「投放中/已结束的信号不可修改」；
- 保存后：`auditStatus=0`、`auditMsg=null`、`status=1`，并重新投递 T6 `signal_analyze`；
- 返回 `{ signalId }`。

（若更倾向拆成 `POST /signal/resubmit { signalId }` 单独重提，也可以，前端按两种都接。）

**前端影响**：编辑页保存/重提不再依赖 copy。

---

## P0-5 信号列表 tab 与前端筛选一一对应

**现状**

- 前端筛选：`all / review 审核中 / reaching 触达中 / failed 审核失败 / ended 已结束`
- 后端 `statusTab`：`all / auditing / pushing / needsHandle / finished`
- `needsHandle` 把「审核驳回」和「投放已暂停」混在一起，与前端「审核失败」语义冲突；「已结束」也没有独立口径（`status=4 finished` 与 `status=5 ended` 都存在）。

**建议改动**

`/signal/list` 的 `statusTab` 支持（旧值保留兼容）：

| 前端 tab | 建议 statusTab | SQL 口径 |
|---|---|---|
| 全部 | `all` | 现状 |
| 审核中 | `review` | `status=1 AND audit_status<>2` |
| 触达中 | `reaching` | `status=2` |
| 审核失败 | `failed` | `audit_status=2 OR status=3` |
| 已结束 | `ended` | `status IN (4,5)` |

列表项需补充（现在 `signalCard` 只给 `signal + companyName/companyLogo`，`signal` 里字段够但需确认序列化完整）：

```json
{
  "signal": { "id": 1, "targetDesc": "…", "status": 2, "auditStatus": 1, "auditMsg": null,
              "endReason": null, "deliverCount": 126, "viewCount": 48, "responseCount": 3,
              "startTime": "2026-10-20 10:00:00", "endTime": "2026-10-27 10:00:00", "createTime": "…" },
  "companyName": "…", "companyLogo": "…"
}
```

**前端影响**：卡片上的天数/漏斗用 `startTime/endTime/deliverCount/viewCount/responseCount` 计算，失败原因用 `auditMsg`/`endReason`。

---

## P0-6 企业合作池（我的商机 · pool）与「接手」

**现状**

- `/lead/list` 固定 `.eq(ownerUserId, 当前用户)`，只能查「我跟的」。
- 「我的商机」页有两个顶部 tab：
  - **企业合作池 pool**：子 tab「待接手 / 已对接」，展示**本企业**收到的全部合作机会（对方申请、信号匹配结果），同事可接手；
  - **我的合作 mine**：子 tab「等待对方 / 待联系 / 沟通中」，即个人线索。
- 后端只有个人线索，pool 完全没有数据来源，也没有分配/接手能力。

**建议改动**

```
POST /lead/pool
{ "tab": "pending", "pageNum": 1, "pageSize": 10 }
// tab: pending 待接手 / docked 已对接

data: {
  "list": [{
    "lead": { "id": 8, "source": 2, "sourceId": 33, "status": 0,
              "ownerUserId": null, "title": "…", "createTime": "…" },
    "ownerUserName": null,                  // 已接手时返回「谁在跟」
    "targetCompanyName": "杭州远航包装有限公司",
    "targetCompanyLogo": "…",
    "targetCompanyTypes": "包装制品",
    "contactStage": null,
    "actionText": "接手"                    // 可选，前端也能自己拼
  }],
  "total": 12, "pageNum": 1, "pages": 2,
  "counts": { "pending": 5, "docked": 7 }
}

POST /lead/claim
{ "leadId": 8 }
// 校验：请求人属于 lead 归属企业；lead.owner_user_id 为空（或允许管理员改派）
// 结果：owner_user_id = 当前用户；status 0/1 → 1 待跟进
// 返回：{ "leadId": 8, "ownerUserId": 123 }
```

口径请后端确认（这是产品语义，不是纯技术问题）：

- `pending`：`owner_user_id IS NULL` 且未关闭？
- `docked`：`owner_user_id IS NOT NULL`，还是「已建立联系（status>=3）」？
- pool 的归属企业：`lead.target_cp_id = 本企业`？还是另加 `cp_id` 字段？当前 `wq_lead` 只有 `owner_cp_id` / `target_cp_id`，需要明确。

**前端影响**：pool 两个子 tab 的列表、计数、接手按钮；mine 三个子 tab 继续用 `/lead/list`。

> mine 的「等待对方 / 待联系 / 沟通中」可由现有字段推导，无需新接口：
> `waiting`=`status=0`(待回应)、`toContact`=`status=3 且 contactStage=待联系`、`chatting`=`status=3 且 contactStage=沟通中`。

---

# P1 · 能跑，但体验/数据有坑

## P1-7 商机详情回写浏览历史

`/ai/opportunity/detail` 目前只读 `wq_browse_history(target_type=6)` 判断 `isViewed`，**没有任何写入**，导致 `isViewed` 永远 `false`。

建议：详情接口内补一条 upsert（`target_type=6, target_id=opportunityId, user_id=loginUserId`），与 `/square/bbs/detail` 保持一致。
（前端暂时不展示逐条红点，但首页/角标会用 `isViewed` 统计，需要真实数据。）

## P1-8 从商机发起合作意向书

`/intent/create` 必填 `receiverCpId`，而商机详情页只有 `opportunityId`（和 `company.id`）。

建议：`/intent/create` 支持

```
{ "opportunityId": 123, "note": "…", "cardId": 5, "contactCardId": 7 }
```

后端自动解析 `receiverCpId = opportunity.cpId`，并把 `relBbs` 默认写成该商机的 `bbsId`。
返回保持 `{ intentId, leadId, cardId }`。

## P1-9 信号进展补字段

`/signal/progress` 建议补充：

- `signal.remainingDays`（或明确前端用 `endTime` 计算，需保证 `endTime` 非空）
- `pausedReason`（`status=3` 时）
- `funnel` 里给 `{ deliverCount, viewCount, responseCount }`（现已有，确认口径为「已投放/已查看/有效回应」）

## P1-10 平台协助 context schema + 列表文案

`/assist/apply` 的 `context` 目前自由 JSON，请固定为：

```json
{ "remark": "…", "opportunityId": 123, "signalId": null }
```

`/assist/list`、`/assist/detail` 的列表项补：

- `serviceTypeName`（信息核验/定向寻找/撮合跟进）
- `statusName`（待处理/处理中/已完成/已驳回）
- `context` 保持 JSON 字符串即可（前端自己 parse）

---

# P2 · 只需确认口径

| # | 项 | 需要后端确认 |
|---|---|---|
| P2-11 | `/ai/match/list` 的 `externalCompanies` 仅第 1 页返回 | 确认「平台外企业只在首屏展示、不参与分页」即可，前端按此实现 |
| P2-12 | 时间格式 | 确认 `LocalDateTime` 序列化为 `yyyy-MM-dd HH:mm:ss`（或 ISO 带 T），**不要数组** |
| P2-13 | `/intent/detail` 的 `cardSnapshot` | 给出字段名（`cardName/content/cardCover/tags/attachments`?），前端按字段渲染，否则只能整块兜底 |
| P2-14 | 通知跳转 | 后端已有 `bizType/bizId`（`opportunity/intent/signal/signal_delivery/task/card_match/company`），前端按此跳转即可，**无需改动**，只需确认 `bizType` 稳定不随意改名 |
| P2-15 | 权限边界 | 从「产业正在发生」进详情（非本人 + `visibility=0`）已放通；确认「申请平台协助」不要求认证企业 |

---

# 2. 联调验证清单（后端改完后前端会依次验）

```bash
# 方向推荐 + keyword
curl -X POST $BASE/ai/discovery/list -H "token: $T" -H 'Content-Type: application/json' \
  -d '{"filter":"all","keyword":"吨袋","pageNum":1,"pageSize":10}'

# 方向详情（P0-1 方案 A）
curl -X POST $BASE/ai/direction/list -H "token: $T" -H 'Content-Type: application/json' \
  -d '{"opportunityId":123,"offset":0,"size":3}'

# 信号列表 tab
curl -X POST $BASE/signal/list -H "token: $T" -H 'Content-Type: application/json' \
  -d '{"statusTab":"failed","pageNum":1,"pageSize":10}'

# 信号编辑重提
curl -X POST $BASE/signal/update -H "token: $T" -H 'Content-Type: application/json' \
  -d '{"signalId":12,"targetDesc":"修正后的画像","reachConfig":"{\"cycle_days\":7}"}'

# 企业合作池 + 接手
curl -X POST $BASE/lead/pool -H "token: $T" -H 'Content-Type: application/json' \
  -d '{"tab":"pending","pageNum":1,"pageSize":10}'
curl -X POST $BASE/lead/claim -H "token: $T" -H 'Content-Type: application/json' \
  -d '{"leadId":8}'
```

数据准备建议：至少 1 个账号具备
① 2 条 AI 研判商机（1 条明确表达）、② 1 条审核中 + 1 条审核驳回 + 1 条投放中信号、
③ 1 条待回应线索、④ 本企业 1 条待接手 pool 线索。

---

# 3. 后端回复区（请逐条填写）

| # | 事项 | 结论（采纳 / 改方案 / 不采纳） | 落地接口与字段 | 预计完成 |
|---|---|---|---|---|
| P0-1 | 方向详情取数 | | | |
| P0-2 | 明确方向状态回写 | | | |
| P0-3 | keyword 搜索 | | | |
| P0-4 | 信号 update/resubmit | | | |
| P0-5 | 信号 tab 口径 | | | |
| P0-6 | 企业合作池 + 接手 | | | |
| P1-7 | 浏览历史回写 | | | |
| P1-8 | 意向书按 opportunityId 发起 | | | |
| P1-9 | 信号进展字段 | | | |
| P1-10 | 协助 context/文案 | | | |
| P2-11~15 | 口径确认 | | | |

> 对有异议的项（尤其 P0-1、P0-5、P0-6）请直接给出替代方案和字段定义，前端按新契约调整，不需要后端迁就现有 mock。
