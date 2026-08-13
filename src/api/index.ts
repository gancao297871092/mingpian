import { request, ResponseResult, PageList, FetchPageParams } from '@/utils/request';

export namespace API {
  export namespace auth {
    /** 发送手机验证码，返回 authCode */
    export function smsSend(data: { phone: string }) {
      return request.post<{ authCode: string }>('/auth/sms/send', data);
    }
    /** 手机号 + 验证码登录（不存在自动注册），返回 token/userId */
    export function login(data: { phone: string; authCode: string; code: string }) {
      return request.post<{ token: string; userId: number }>('/auth/login', data);
    }
  }

  export namespace common {
    /** 用户协议 HTML */
    export function userSure() {
      return request.get<{ name: string; value: string; htmls: string }>('/common/userSure');
    }
    /** 隐私政策 HTML */
    export function privates() {
      return request.get<{ name: string; value: string; htmls: string }>('/common/privates');
    }
  }

  export namespace user {
    /** 获取用户基础信息（对齐小程序 /user/base/info） */
    export function info() {
      return request.get<any>('/user/base/info');
    }
  }

  export namespace card {
    /** 获取名片列表（对齐小程序 /card/list） */
    export function list(params?: { t?: number }) {
      return request.get<{ cardsList: any[] }>('/card/list', { params });
    }
    /** 删除名片 */
    export function del(params: { cardId: string | number }) {
      return request.get<any>('/card/del', { params });
    }
  }
}
