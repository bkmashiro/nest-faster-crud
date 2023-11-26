import { CRUDUser } from '../CRUDUser.entity'

export type Page = {
  /**
   * 当前页
   */
  currentPage?: number
  /**
   * 每页条数
   */
  pageSize?: number
}
/**
 * 查询排序参数
 */
export type PageSort<T extends ObjectLiteral> = {
  prop?: keyof T
  order?: string
  asc?: boolean
}

export type PageQuery<T = any> = {
  /**
   * 分页参数
   */
  page?: Page
  /**
   * 查询表单
   */
  form?: Partial<T>
  /**
   * 远程排序配置
   */
  sort?: PageSort<T>
}

export interface ObjectLiteral {
  [key: string]: any
}

export type PageRes<T extends ObjectLiteral> = {
  /**
   * 当前页
   */
  currentPage: number
  /**
   * 每页条数
   */
  pageSize: number
  /**
   * 总记录数
   */
  total: number
  /**
   * 列表数据
   */
  records: Array<T>
}

export type EditReq<T> = {
  form?: Partial<T>
  row?: Partial<T>
  [key: string]: any
}
export type AddReq<T> = {
  form?: Partial<T>
  [key: string]: any
}

export type FormReq<T> = AddReq<T> | EditReq<T> | PageQuery<T>

export type DelReq<T> = {
  row?: Partial<T>
  [key: string]: any
}

export type InfoReq<T> = {
  mode?: string
  row?: Partial<T>
  [key: string]: any
}
/**
 * 用户后台page请求原始返回
 */
export type UserPageRes = {
  [key: string]: any
}
