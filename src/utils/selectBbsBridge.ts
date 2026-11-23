/**
 * 选择动态页面桥接工具
 * 用于 CreateCooperationIntent -> SelectBbs -> CreateCooperationIntent 的选中动态数据传递
 */
export interface SelectedBbs {
  id: string;
  title: string;
  imageUrl: string;
  /** 正文摘要（创建意向书草稿时冗余存 abilityContent.feedSubs，免后端补字段） */
  sub?: string;
}

interface SelectBbsBridge {
  list: SelectedBbs[] | null;
}

const bridge: SelectBbsBridge = {
  list: null,
};

export function setSelectBbsResult(list: SelectedBbs[]) {
  bridge.list = list;
}

export function getSelectBbsResult(): SelectedBbs[] | null {
  const result = bridge.list;
  bridge.list = null;
  return result;
}
