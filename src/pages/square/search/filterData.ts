export interface TreeNode {
  name: string;
  children?: TreeNode[];
}

export interface TreeTab {
  key: 'industry' | 'honor' | 'category';
  label: string;
  data: TreeNode[];
}

const INDUSTRY_TREE: TreeNode[] = [
  {
    name: '机械制造',
    children: [
      { name: '通用设备', children: [{ name: '数控机床' }, { name: '工业机器人' }, { name: '减速机' }] },
      { name: '专用设备', children: [{ name: '包装机械' }, { name: '印刷机械' }] },
    ],
  },
  {
    name: '汽车零部件',
    children: [
      { name: '动力系统', children: [{ name: '发动机部件' }, { name: '变速箱' }] },
      { name: '电子电器', children: [{ name: '车载电子' }, { name: '线束' }] },
    ],
  },
  {
    name: '电子信息',
    children: [
      { name: '半导体', children: [{ name: '芯片设计' }, { name: '封装测试' }] },
      { name: '消费电子', children: [{ name: '智能终端' }] },
    ],
  },
  {
    name: '新材料',
    children: [{ name: '高分子材料' }, { name: '金属材料' }],
  },
];

const HONOR_TREE: TreeNode[] = [
  {
    name: '国家级',
    children: [{ name: '高新技术企业' }, { name: '专精特新' }, { name: '小巨人企业' }],
  },
  {
    name: '省市级',
    children: [{ name: '省著名商标' }, { name: '市级研发中心' }],
  },
];

const CATEGORY_TREE: TreeNode[] = [
  { name: '综合' },
  { name: '企业' },
  { name: '动态' },
  { name: '用户' },
];

export const TREE_TABS: TreeTab[] = [
  { key: 'industry', label: '行业', data: INDUSTRY_TREE },
  { key: 'honor', label: '荣誉', data: HONOR_TREE },
  { key: 'category', label: '分类', data: CATEGORY_TREE },
];
