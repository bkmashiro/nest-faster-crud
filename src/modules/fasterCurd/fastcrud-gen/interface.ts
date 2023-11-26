import { ObjectLiteral } from "typeorm"
import { CRUDUser } from "../CRUDUser.entity"

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
export type PageSort = {
  prop?: string
  order?: string
  asc?: boolean
}

export type PageQuery = {
  /**
   * 分页参数
   */
  page?: Page
  /**
   * 查询表单
   */
  form?: any
  /**
   * 远程排序配置
   */
  sort?: PageSort
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

// const pgres: PageRes<number> = {
//   currentPage: 1,
//   pageSize: 10,
//   total: 0,
//   records: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
// }

// const pgres2: PageRes<CRUDUser> = {
//   currentPage: 1,
//   pageSize: 10,
//   total: 0,
//   records: [new CRUDUser()],
// }

export type EditReq = {
  form?: any
  row?: any
  [key: string]: any
}
export type AddReq = {
  form?: any
  [key: string]: any
}

export type FormReq = AddReq | EditReq | PageQuery

export type DelReq = {
  row?: any
  [key: string]: any
}
export type InfoReq = {
  mode?: string
  row?: any
  [key: string]: any
}
/**
 * 用户后台page请求原始返回
 */
export type UserPageRes = {
  [key: string]: any
}
