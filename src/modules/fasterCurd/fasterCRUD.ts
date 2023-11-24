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
export const logger = new Logger('FasterCRUDService')

type KeyType = string

export function isArrayOfFunctions(
  data: any
): data is ((data: any) => boolean)[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'function')
}

export interface CRUDProvider<T> {
  create(data: any): Promise<any>
  read({
    data,
    skip,
    take,
  }: {
    data: any
    skip?: number
    take?: number
  }): Promise<any>
  update(data: any): Promise<any>
  delete(data: any): Promise<any>
}

export class TypeORMRepoAdapter<T>
  implements CRUDProvider<T>
{
  constructor(private readonly repo: Repository<T>) {}

  async create({ data }: any) {
    return await this.repo.insert(data)
  }

  async update(data: { find: any; update: any }) {
    return await this.repo.update(data.find, data.update)
  }

  async delete(data: any) {
    return await this.repo.delete(data)
  }

  async read({
    data,
    skip,
    take,
  }: {
    data: any
    skip?: number
    take?: number
  }) {
    return await this.repo.find({
      where: data,
      skip,
      take,
    })
  }
}

export class FasterCrudRouterBuilder {
  router: Router = express.Router()

  constructor() {}
  setRoute(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    handler: express.RequestHandler
  ) {
    this.router[method](path, handler)

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
