import { API } from '@/api';
import { getAppChannelInfo } from '@/native/AppChannel';
import {
  addPushNotificationListener,
  getRegistrationId,
  initPush,
  pushSupported,
  requestPushPermission,
  setPushAuth,
  type JPushNotificationEvent,
} from '@/native/JPush';
import { goUserHome, navigationRef } from '@/route/navigationRef';
import { useUserStore } from '@/store/user';

/**
 * 极光推送编排：初始化（隐私同意后）→ rid 绑定 → 通知点击路由。
 * 跳转映射依据后端 PUSH-JUMP-MAPPING.md：
 * - extras 自定义参数在 params 节点；channel=notice 按 noticeType+bizId 跳；channel=innerMsg 按 msgCode 跳
 * - msgCode 常量有带尾部空格的情况，匹配前必须 trim
 * - 识别不了的一律兜底进消息中心
 */

type MessageTab = 'private' | 'interaction' | 'system';

/** 导航就绪后执行（冷启动点击通知时导航可能尚未挂载，最多重试 ~6s） */
function navigateWhenReady(fn: () => void, attempt = 0): void {
  if (navigationRef.isReady()) {
    fn();
    return;
  }
  if (attempt > 12) return;
  setTimeout(() => navigateWhenReady(fn, attempt + 1), 500);
}

/** 兜底：打开消息中心（tab 页在 MainTabs 内，可指定初始子 tab） */
function openMessageCenter(tab?: MessageTab): void {
  navigationRef.navigate('MainTabs', { screen: 'message', params: { tab } } as any);
}

/** 从通知 extras 提取业务参数：优先 params 子节点（兼容字符串 JSON / 嵌套），无则按 extras 本身 */
function extractPushParams(extras?: Record<string, any>): Record<string, any> | null {
  if (!extras) return null;
  let node: any = extras.params ?? extras;
  if (typeof node === 'string') {
    try {
      node = JSON.parse(node);
    } catch {
      return null;
    }
  }
  if (node && typeof node === 'object' && node.params && typeof node.params === 'object') {
    node = node.params;
  }
  return node && typeof node === 'object' ? node : null;
}

const toNum = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** channel=notice（互动/系统通知，源表 wq_notice）：按 noticeType + bizId 路由 */
function routeNotice(p: Record<string, any>): void {
  const noticeType = toNum(p.noticeType);
  const bizId = toNum(p.bizId);
  switch (noticeType) {
    case 1: // 评论审核驳回 → 消息中心-互动
      openMessageCenter('interaction');
      break;
    case 2: // 动态被评论
    case 3: // 动态/评论被点赞
      if (bizId) navigationRef.navigate('bbsDetail', { id: String(bizId) });
      else openMessageCenter('interaction');
      break;
    case 4: // 动态管理员审核通知
      if (bizId) navigationRef.navigate('bbsDetail', { id: String(bizId), audit: true });
      else openMessageCenter('system');
      break;
    case 5: // 商机更新
      if (bizId) navigationRef.navigate('opportunityDetail', { opportunityId: bizId });
      else openMessageCenter('system');
      break;
    case 6: // 合作意向反馈
      if (bizId) navigationRef.navigate('cooperationIntentView', { intentId: bizId });
      else openMessageCenter();
      break;
    case 7: // 我的信号收到响应 → 信号详情-响应列表
      if (bizId) navigationRef.navigate('signalProgress', { id: String(bizId) });
      else openMessageCenter();
      break;
    case 8: // 业务员任务（影子企业） → 业务员工作台
      navigationRef.navigate('workbench');
      break;
    case 9: // 系统通知 → 消息中心-系统
      openMessageCenter('system');
      break;
    case 10: // AI 信号送达 → 「链接」正在发生/我的商机
      navigationRef.navigate('aiDiscoveries');
      break;
    case 11: // 名片匹配 → 「链接」方向推进
      navigationRef.navigate('MainTabs', { screen: 'link' } as any);
      break;
    case 12: // 新增关注（粉丝） → 关注者主页
      if (bizId) goUserHome(bizId);
      else openMessageCenter('interaction');
      break;
    default:
      openMessageCenter();
  }
}

/** channel=innerMsg（站内信，源表 sys_inner_message）：按 msgCode 路由（msgCode 先 trim） */
function routeInnerMsg(p: Record<string, any>): void {
  const msgCode = String(p.msgCode ?? '').trim();
  const bizId = toNum(p.businessId);
  switch (msgCode) {
    case 'COMPANY_CHECK_PASS': // 企业认证审核通过 → 企业详情
      navigationRef.navigate('companyInfo');
      break;
    case 'COMPANY_CHECK_REJECT': // 企业认证审核驳回 → 企业管理（重新编辑提交）
    case 'MSG_CODE_COMPANY_MASTER': // 企业管理员通知
    case 'MSG_CODE_COMPANY_MASTER_SUCCESS': // 管理员变更成功
    case 'MSG_CODE_COMPANY_USER_CHECK_PASS': // 加入企业审批通过
      navigationRef.navigate('companyManage');
      break;
    case 'BBS_CHECK_PASS': // 动态审核通过 → 动态详情
      if (bizId) navigationRef.navigate('bbsDetail', { id: String(bizId) });
      else openMessageCenter('system');
      break;
    case 'BBS_CHECK_REJECT': // 动态审核未通过 → 我的主页（我的动态，含驳回原因）
      navigationRef.navigate('userHome', { preview: true });
      break;
    case 'DEMAND_AUDIT_REJECT': // 需求/响应审核未通过 → 需求详情
    case 'DEMAND_NEW_RESPONSE': // 需求收到新响应 → 需求详情-响应列表
      if (bizId) navigationRef.navigate('touchTaskDetail', { id: bizId });
      else openMessageCenter('system');
      break;
    // 其余已知 msgCode（成员申请/动态删除提醒/企业纠错/处罚/举报）→ 消息中心-系统
    case 'MSG_CODE_COMPANY_USER_CHECK':
    case 'MSG_CODE_COMPANY_USER_CHECK_WAIT':
    case 'MSG_CODE_COMPANY_USER_CHECK_REJECT':
    case 'BBS_CHECK_DELETE':
    case 'BBS_CHECK_MANAGER_TIPS':
    case 'MSG_CODE_BBS_CHECK_USER_TIPS':
    case 'COMPANY_ERROR_READ':
    case 'COMPANY_ERROR_PASS':
    case 'COMPANY_ERROR_REJECT':
    case 'USER_PUNISH_BAN_SPEAK':
    case 'USER_PUNISH_BAN_ACCOUNT':
    case 'USER_REPORT_READ':
    case 'USER_REPORT_SUCCESS':
      openMessageCenter('system');
      break;
    default: // 无法识别 → 消息中心首页
      openMessageCenter();
  }
}

/** 通知事件分发：只处理点击（到达由系统通知栏展示，无需处理） */
function handleNotificationEvent(e: JPushNotificationEvent): void {
  if (e.notificationEventType !== 'notificationOpened') return;
  const params = extractPushParams(e.extras);
  if (!params) {
    navigateWhenReady(() => openMessageCenter());
    return;
  }
  navigateWhenReady(() => {
    if (params.channel === 'notice') routeNotice(params);
    else if (params.channel === 'innerMsg') routeInnerMsg(params);
    else openMessageCenter();
  });
}

/** 绑定 registrationId 到后端（rid 在 init 后异步生成，空则重试 3 次） */
export function bindPush(attempt = 0): void {
  if (!pushSupported) return;
  getRegistrationId().then(async (rid) => {
    if (!rid) {
      const delays = [3000, 8000, 15000];
      if (attempt < delays.length) setTimeout(() => bindPush(attempt + 1), delays[attempt]);
      return;
    }
    try {
      const info = await getAppChannelInfo();
      // 免登录接口：有 token 时后端自动回填 userId，完成人-设备关联
      await API.common.pushBind({ deviceId: info.deviceId, registrationId: rid });
    } catch {
      // 静默失败，下次冷启动/登录重试
    }
  });
}

/** 解绑推送：退出登录/切换账号时调用（免登录接口，清掉设备行的 userId） */
export function unbindPush(): void {
  if (!pushSupported) return;
  getAppChannelInfo()
    .then((info) => API.common.pushUnbind({ deviceId: info.deviceId }))
    .catch(() => {});
}

let started = false;

/** 隐私同意后的推送初始化入口（App 启动时调用一次，幂等） */
export function setupPush(): void {
  if (started || !pushSupported) return;
  started = true;
  // 合规授权（原生 MainApplication 默认 setAuth(false)）→ init → 监听 → 权限 → 绑定
  setPushAuth(true);
  getAppChannelInfo()
    .then((info) => {
      initPush(info.channel);
      addPushNotificationListener(handleNotificationEvent);
      requestPushPermission();
      bindPush();
    })
    .catch(() => {
      initPush('official');
      addPushNotificationListener(handleNotificationEvent);
      requestPushPermission();
      bindPush();
    });
  // 登录成功（token 由无到有）后重新绑定，回填 userId
  useUserStore.subscribe((state, prev) => {
    if (state.token && !prev.token) bindPush();
  });
}
