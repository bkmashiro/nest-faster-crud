import { Injectable } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { Express } from 'express'
import express = require('express')
import { BeforeActionOptions } from './decorators'
import { BeforeActionTokenType, CRUDMethods } from './fcrud-tokens'
import { FCRUD_NAME_TOKEN, GEN_CRUD_METHOD_TOKEN } from './fcrud-tokens'
import { getProtoMeta } from './reflect.utils'
import { deconstrcuOrNull } from 'src/utils/objectTools'
import { Logger } from '@nestjs/common'
import { Router } from 'express'
import { Repository } from 'typeorm'
import { defaultCrudMethod } from './fcrud-tokens'

export const logger = new Logger('FasterCRUDService')

@Injectable()
export class FasterCrudService {
  prefix = `fcrud-`

  constructor(private adapterHost: HttpAdapterHost) {
    this.app.use(express.json())
    logger.debug(
      `FasterCrudService created, attaching to ${this.adapterHost.httpAdapter.getType()}`
    )
  }

  addRouter(route: string, router: express.Router) {
    router.stack.forEach((r) => {
      if (r.route && r.route.path) {
        logger.debug(
          `Mapped {${route}${
            r.route.path
          }}, ${r.route.stack[0].method.toUpperCase()}} route`
        )
      }
    })
    this.app.use(route, router)
  }

  generateCRUD<T extends { new (...args: any[]): {} }>(
    entity: T,
    provider: CRUDProvider<T>
  ) {
    const fcrudName = getProtoMeta(entity, FCRUD_NAME_TOKEN) ?? entity.name
    const router = new FasterCrudRouterBuilder()

    // create all CRUD routes
    const actions: CRUDMethods[] =
      getProtoMeta(entity, GEN_CRUD_METHOD_TOKEN) ?? defaultCrudMethod

    for (const action of actions) {
      const method = provider[action].bind(
        provider
      ) as CRUDProvider<T>[keyof CRUDProvider<T>] // have to bind to provider, otherwise this will be undefined
      const action_token: BeforeActionTokenType = `before-action-${action}`
      const decoratedMethod = this.decorateMethod(
        getProtoMeta(entity, action_token),
        method
      )

      router.addHandler('post', `/${action}`, async function (req, res) {
        await perform_task(req, decoratedMethod, res)
      })
    }

    this.addRouter(`/${this.prefix}${fcrudName.toLowerCase()}`, router.build())
  }

  decorateMethod<T>(
    options: BeforeActionOptions<T>,
    method: (data: any) => Promise<any>
  ) {
    if (!options) {
      return method
    }
    const { requires, expect, transform } = deconstrcuOrNull(options)
    let check_requirements = (data: any) => true
    if (requires && Array.isArray(requires) && requires.length > 0) {
      check_requirements = (data: any) => {
        for (const field of requires) {
          if (!data.hasOwnProperty(field)) {
            return false
          }
        }
        return true
      }
    }

    let check_expect = (data: any) => true
    if (expect) {
      if (isArrayOfFunctions(expect)) {
        check_expect = (data: any) => {
          for (const func of expect) {
            if (!func(data)) {
              return false
            }
          }
          return true
        }
      } else if (typeof expect === 'function') {
        check_expect = expect as (data: any) => boolean
      }
    }

    let transform_data = (data: any) => data
    if (transform) {
      transform_data = transform
    }

    return async (data: any) => {
      if (!check_requirements(data)) {
        throw new Error(`Missing required fields: ${requires.join(', ')}`)
      }

      if (!check_expect(data)) {
        throw new Error(`Expectation failed`)
      }

      return await method(transform_data(data))
    }
  }

  get app(): Express {
    return this.adapterHost.httpAdapter.getInstance()
  }
}

function isArrayOfFunctions(data: any): data is ((data: any) => boolean)[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'function')
}

export interface CRUDProvider<T> {
  create(data: any): Promise<any>
  read(data: any): Promise<any>
  update(data: any): Promise<any>
  delete(data: any): Promise<any>
}

export class TypeORMRepoAdapter<T extends {}> implements CRUDProvider<T> {
  constructor(private readonly repo: Repository<T>) {}

  async create(data: T) {
    return await this.repo.insert(data)
  }

  async update(data: { find: any; update: any }) {
    return await this.repo.update(data.find, data.update)
  }

  async delete(data: any) {
    return await this.repo.delete(data)
  }

  async read(data: any) {
    return await this.repo.find(data)
  }
}

export class FasterCrudRouterBuilder {
  router: Router = express.Router()

  constructor() {}
  addHandler(
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
