export type Page = {
  /**
   * 当前页
   */
  currentPage?: number;
  /**
   * 每页条数
   */
  pageSize?: number;
};
/**
* 查询排序参数
*/
export type PageSort = {
  prop?: string;
  order?: string;
  asc?: boolean;
};

export type PageQuery = {
  /**
   * 分页参数
   */
  page?: Page;
  /**
   * 查询表单
   */
  form?: any;
  /**
   * 远程排序配置
   */
  sort?: PageSort;
};