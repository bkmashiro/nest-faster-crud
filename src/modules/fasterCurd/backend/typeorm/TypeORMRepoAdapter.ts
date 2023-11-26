import { ObjectLiteral, Repository } from 'typeorm'
import {
  AddReq,
  DelReq,
  EditReq,
  Page,
  PageQuery,
  PageRes,
  PageSort,
} from '../../crud-gen/fast-crud.decl'
import { isEmptyObject } from 'src/utils/utils'
import { CRUDProvider } from '../../fc.service'

export class TypeORMRepoAdapter<T extends ObjectLiteral>
  implements CRUDProvider<T>
{
  constructor(private readonly repo: Repository<T>) {}
  async read(query: PageQuery<T>): Promise<PageRes<T>> {
    // console.log(query)
    //TODO add convert
    const [ret, count] = await this.repo.findAndCount({
      where: query.form,
      skip: (query.page.currentPage - 1) * query.page.pageSize,
      take: query.page.pageSize,
      order: this.parseSort<T>(query.sort) as any,
    })

    return {
      records: ret,
      currentPage: query.page.currentPage,
      pageSize: query.page.pageSize,
      total: count,
    }
  }

  async create({ form }: AddReq<T>) {
    return await this.repo.insert(form)
  }

  async update({ form, row }: EditReq<T>) {
    return await this.repo.update(row, form)
  }

  async delete({ row }: DelReq<T>) {
    return await this.repo.delete(row)
  }

  parseSort<T>(sort: PageSort<T> | { [key in keyof T]?: 'ASC' | 'DESC' }): {
    [key in keyof T]?: 'ASC' | 'DESC'
  } {
    if (Object.values(sort).every((v) => v === 'ASC' || v === 'DESC')) {
      //TODO clean up
      return sort as { [key in keyof T]?: 'ASC' | 'DESC' }
    }
    const { prop, order, asc } = sort as PageSort<T>
    // what if prop is not a key of T?
    // can not do check here, we have to assume it is a key of T
    // if any error, it will be caught by typeorm
    if (prop && order) {
      const _order = fixOrder(order)
      return {
        [prop]: _order,
      } as any
    } else if (prop && isBoolean(asc)) {
      return {
        [prop]: asc ? 'ASC' : 'DESC',
      } as any
    } else if (!sort || isEmptyObject(sort)) {
      return {}
    } else {
      // console.log(`sort`, sort)
      throw new Error(`invalid sort`)
    }
  }
}

function fixOrder(order: string) {
  order = order.toLowerCase()
  if (order === 'ascending' || order === 'asc') {
    return 'ASC'
  } else if (order === 'descending' || order === 'desc') {
    return 'DESC'
  } else {
    throw new Error(`invalid order ${order}`)
  }
}

function isBoolean(v: any): v is boolean {
  return typeof v === 'boolean'
}

export type PageQueryTransformed = {
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
  sort?: { [key: string]: 'ASC' | 'DESC' }
}
