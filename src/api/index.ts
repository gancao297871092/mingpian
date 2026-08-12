import { AxiosResponse } from 'axios';
import { request, ResponseResult, PageList, FetchPageParams } from '@/utils/request';

/** 开发环境使用 mock 数据，接真实接口后改为 false */
const USE_MOCK = __DEV__;

const mock = <T>(data: T, delay = 800): Promise<AxiosResponse<T>> =>
  new Promise(resolve => setTimeout(() => resolve({ data } as AxiosResponse<T>), delay));

function mockPostList(params: FetchPageParams) {
  const pageNum = params.pageNum ?? 1;
  const pageSize = params.pageSize ?? 20;
  const total = 43;
  const start = (pageNum - 1) * pageSize;
  const count = Math.min(pageSize, Math.max(0, total - start));
  const list = Array.from({ length: count }, (_, i) => {
    const id = start + i + 1;
    return {
      id,
      title: `示例标题 ${id}`,
      content: `这是第 ${id} 条示例内容，用于测试 Lottie 下拉刷新与上拉加载，接入真实接口后展示实际数据。`,
      createTime: Date.now() - id * 3600_000,
    };
  });
  return mock<PageList<any>>({
    code: '200',
    msg: 'ok',
    data: {
      list,
      total,
      pageNum,
      pageSize,
      isLastPage: start + pageSize >= total,
    },
  });
}

export namespace API {
  export namespace auth {
    /** 发送手机验证码，返回 authCode */
    export function smsSend(data: { phone: string }) {
      return request.post<ResponseResult<{ authCode: string }>>('/v1/auth/sms/send', data);
    }
    /** 手机号 + 验证码登录（不存在自动注册），返回 token/userId */
    export function login(data: { phone: string; authCode: string; code: string }) {
      return request.post<ResponseResult<{ token: string; userId: number }>>('/v1/auth/login', data);
    }
  }

  export namespace common {
    /** 用户协议 HTML */
    export function userSure() {
      return request.get<ResponseResult<{ name: string; value: string; htmls: string }>>('/v1/common/userSure');
    }
    /** 隐私政策 HTML */
    export function privates() {
      return request.get<ResponseResult<{ name: string; value: string; htmls: string }>>('/v1/common/privates');
    }
  }

  export namespace home {
    export function bannerList(data: { loading?: boolean }) {
      if (USE_MOCK) return mock<ResponseResult<any[]>>({ code: '200', msg: 'ok', data: [] });
      return request.get<ResponseResult<any[]>>('/home/banner', { params: data });
    }
    export function postList(data: FetchPageParams) {
      if (USE_MOCK) return mockPostList(data);
      return request.post<PageList<any>>('/home/post/list', data);
    }
  }

  export namespace user {
    export function login(data: { account: string; password: string }) {
      if (USE_MOCK) {
        return mock<ResponseResult<{ token: string }>>({
          code: '200',
          msg: 'ok',
          data: { token: 'mock-token' },
        });
      }
      return request.post<ResponseResult<{ token: string }>>('/user/login', data);
    }
    export function info(data?: { loading?: boolean }) {
      if (USE_MOCK) {
        return mock<ResponseResult<any>>({
          code: '200',
          msg: 'ok',
          data: { id: 1, nickname: 'Mock 用户', avatar: '' },
        });
      }
      return request.get<ResponseResult<any>>('/user/info', { params: data });
    }
  }
}
