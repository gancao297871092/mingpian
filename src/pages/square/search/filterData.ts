export interface TreeNode {
  name: string;
  children?: TreeNode[];
}

/** 分类树固定（行业/荣誉走接口 /common/company-industry、/common/company-honors） */
export const CATEGORY_TREE: TreeNode[] = [
  { name: '综合' },
  { name: '企业' },
  { name: '动态' },
  { name: '用户' },
];
