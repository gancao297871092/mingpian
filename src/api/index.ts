import { request, ResponseResult } from '@/utils/request';

export namespace API {
  export namespace auth {
    export function smsSend(data: { phone: string }) {
      return request.post<{ authCode: string }>('/auth/sms/send', data);
    }
    export function login(data: { phone: string; authCode: string; code: string }) {
      return request.post<{ token: string; userId: number }>('/auth/login', data);
    }
  }

  export namespace common {
    export function userSure() {
      return request.get<{ name: string; value: string; htmls: string }>('/common/userSure');
    }
    export function privates() {
      return request.get<{ name: string; value: string; htmls: string }>('/common/privates');
    }
    /** 名片风格列表 */
    export function cardStyle() {
      return request.get<{ styleList: any[]; colorList: any[] }>('/common/cardStyle');
    }
    /** 保存素材关系 */
    export function mediaLinkSave(data: any[]) {
      return request.post<any>('/common/media/link/save', data);
    }
    /** 更新素材封面索引 */
    export function mediaLinkUpdate(data: { mdId: number; isIndex: number }) {
      return request.post<any>('/common/media/link/update', data);
    }
    /** 删除素材 */
    export function mediaDel(params: { mediaId: number }) {
      return request.get<any>('/common/media/media/del', { params });
    }
  }

  export namespace user {
    export function info() {
      return request.get<any>('/user/base/info');
    }
  }

  export namespace card {
    /** 名片列表 */
    export function list(params?: { t?: number }) {
      return request.get<{ cardsList: any[] }>('/card/list', { params });
    }
    /** 删除名片 */
    export function del(params: { cardId: string | number }) {
      return request.get<any>('/card/del', { params });
    }
    /** 名片预创建（获取草稿） */
    export function prepare() {
      return request.get<any>('/card/prepare');
    }
    /** 名片详情 */
    export function detail(params: { cardId: string | number }) {
      return request.get<any>('/card/detail', { params });
    }
    /** 保存名片基础信息 */
    export function save(data: any) {
      return request.post<{ cardId: number }>('/card/save', data);
    }
    /** 发布名片 */
    export function push(params: { cardId: number }) {
      return request.get<any>('/card/create/push', { params });
    }
    /** 项目预览 */
    export function projectPre(params: { cardId: string | number }) {
      return request.get<any>('/card/create/project/pre', { params });
    }
    /** 保存项目/板块 */
    export function projectItemSave(data: any) {
      return request.post<any>('/card/create/project/itemSave', data);
    }
    /** 更新项目 */
    export function projectUpdate(data: any) {
      return request.post<any>('/card/create/project/update', data);
    }
    /** 删除项目子集 */
    export function projectItemDel(params: { itemId: string | number }) {
      return request.get<any>('/card/create/project/itemDel', { params });
    }
    /** 保存样式 */
    export function styleCodeSave(data: any) {
      return request.post<any>('/card/create/styleCode/save', data);
    }
  }
}
