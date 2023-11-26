import { ObjectLiteral, Repository } from 'typeorm'
import {
  AddReq,
  DelReq,
  EditReq,
  Page,
  PageQuery,
  PageRes,
} from './fastcrud-gen/interface'
import { CRUDProvider } from './fasterCRUD'

export class TypeORMRepoAdapter<T extends ObjectLiteral>
  implements CRUDProvider<T>
{
  constructor(private readonly repo: Repository<T>) {}
  async read(query: PageQuery): Promise<PageRes<T>> {
    console.log(query)
    const [ret, count] = await this.repo.findAndCount({
      where: query.form,
      skip: (query.page.currentPage - 1) * query.page.pageSize,
      take: query.page.pageSize,
      order: query.sort as any,
    })
    const r: PageRes<T> = {
      records: ret,
      currentPage: query.page.currentPage,
      pageSize: query.page.pageSize,
      total: count,
    }
    return r
  }

  async create({ form }: AddReq) {
    return await this.repo.insert(form)
  }

  async update({ form, row }: EditReq) {
    return await this.repo.update(row, form)
  }

  async delete({ row }: DelReq) {
    return await this.repo.delete(row)
  }
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
