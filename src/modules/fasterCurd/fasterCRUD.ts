import express = require('express')
import {
  BeforeActionOptions,
  FieldOptions,
  FieldOptionsObject,
} from './decorators'
import { deconstrcuOrNull } from 'src/utils/objectTools'
import { Logger } from '@nestjs/common'
import { Router } from 'express'
import { Repository } from 'typeorm'
import { Validator } from './defaultValidators'
import { QueryData } from './FasterCrudService'
import { AddReq, DelReq, EditReq, PageQuery } from './fastcrud-gen/interface'
export const logger = new Logger('FasterCRUDService')

type KeyType = string

export function isArrayOfFunctions(
  data: any
): data is ((data: any) => boolean)[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'function')
}

export interface CRUDProvider<T> {
  create(data: AddReq): Promise<any>
  read(query: PageQuery): Promise<any>
  update(data: EditReq): Promise<any>
  delete(data: DelReq): Promise<any>
}

export class TypeORMRepoAdapter<T> implements CRUDProvider<T> {
  constructor(private readonly repo: Repository<T>) {}
  async read(query: PageQuery) {
    console.log(query)
    return await this.repo.find({
      where: query.form,
      skip: (query.page.currentPage - 1) * query.page.pageSize,
      take: query.page.pageSize,
    })
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

export class FasterCrudRouterBuilder {
  router: Router = express.Router()
  pre_middlewares: express.RequestHandler[] = []
  post_middlewares: express.RequestHandler[] = []

  constructor() {}
  setRoute(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    handler: express.RequestHandler
  ) {
    this.router[method](path, ...this.pre_middlewares, handler)
    return this
  }

  addPreMiddlewares(...middleware: any[]) {
    this.pre_middlewares.push(...middleware)
    return this
  }

  addPostMiddlewares(...middleware: any[]) {
    this.post_middlewares.push(...middleware)
    return this
  }

  build() {
    return this.router
  }
}

export async function perform_task(
  req: express.Request,
  task: (data: any) => Promise<any>,
  res: express.Response
) {
  const body = req.body
  try {
    const result = await task(body)
    res.status(200).json(result)
  } catch (e) {
    res
      .status(500)
      .json({
        message: e.message,
      })
      .end()
  }
}

export function fixRoute(route: string) {
  if (route.startsWith('/')) {
    return route
  } else {
    return `/${route}`
  }
}
