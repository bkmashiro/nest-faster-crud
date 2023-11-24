import { Injectable } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { Express } from 'express'
import express = require('express')
import {
  BeforeActionOptions,
  ClassType,
  ConfigCtx,
  FieldOptions,
  FieldOptionsObject,
  PartialBeforeActionOptions,
} from './decorators'
import {
  BeforeActionTokenType,
  CRUDMethods,
  FCRUD_GEN_CFG_TOKEN,
  FIELDS_TOKEN,
  HttpMethods,
} from './fcrud-tokens'
import { ENTITY_NAME_TOKEN, GEN_CRUD_METHOD_TOKEN } from './fcrud-tokens'
import { getProtoMeta } from './reflect.utils'
import { deconstrcuOrNull } from 'src/utils/objectTools'
import { Logger } from '@nestjs/common'
import { Router } from 'express'
import { Repository } from 'typeorm'
import { defaultCrudMethod } from './fcrud-tokens'
import validatorMap, { Validator } from './defaultValidators'
export const logger = new Logger('FasterCRUDService')

@Injectable()
export class FasterCrudService {
  prefix = ``
  default_method: HttpMethods = 'post'

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

  generateCRUD<T extends ClassType<T>>(entity: T, provider: CRUDProvider<T>) {
    const fcrudName = getProtoMeta(entity, ENTITY_NAME_TOKEN) ?? entity.name
    const router = new FasterCrudRouterBuilder()
    const fields = getProtoMeta(entity, FIELDS_TOKEN) ?? {}
    const docs = getProtoMeta(entity, FCRUD_GEN_CFG_TOKEN) ?? {}
    // console.log(`fields`, fields)
    // console.log(`docs`, docs)
    router.setRoute('get', `/dict`, async function (req, res) {
      res.status(200).json(docs)
    })
    logger.debug(`data dict for ${fcrudName} is `, docs)
    logger.debug(
      `data dict is avaliable at {/${
        this.prefix
      }${fcrudName.toLowerCase()}/dict, GET}`
    )

    // create all CRUD routes
    const actions: CRUDMethods[] =
      getProtoMeta(entity, GEN_CRUD_METHOD_TOKEN) ?? defaultCrudMethod

    for (const action of actions) {
      const method = provider[action].bind(provider) // have to bind to provider, otherwise this will be undefined
      const action_token: BeforeActionTokenType = `before-action-${action}`
      const decoration_config = getProtoMeta(
        entity,
        action_token
      ) as PartialBeforeActionOptions<T>
      const decoratedMethod = this.configureMethod(
        {
          options: decoration_config,
          target: entity,
          fields,
        },
        method
      )

      const route = fixRoute(decoration_config?.route ?? `/${action}`)
      router.setRoute(this.default_method, route, async function (req, res) {
        await perform_task(req, decoratedMethod, res)
      })
    }

    this.addRouter(`/${this.prefix}${fcrudName.toLowerCase()}`, router.build())
  }

  configureMethod<T extends ClassType<T>>(
    { options, target, fields }: ConfigCtx<T>,
    method: (data: any) => Promise<any>
  ) {
    if (!options) {
      return method
    }

    const {
      check_requirements,
      check_denies,
      check_exactly,
      check_type,
      check_expect,
      transform_data,
      transform_return,
      check_pagination,
      pagination_transformer,
    } = this.parseOptions({ options, target, fields })

    const univariate_checkers = [
      check_requirements,
      check_denies,
      check_exactly,
      check_expect,
      check_pagination,
    ]

    return async (data: {
      data: any,
      pagination?: {
        currentPage: number,
        pageSize: number
      },
      sort?: {
        prop: string,
        order: 'ascending' | 'descending'
      }
    }) => {
      try {
        //univariate check
        for (const checker of univariate_checkers) {
          checker(data)
        }

        //type check
        check_type(data, fields)

        const transformed = transform_data(data)
        const paginated = pagination_transformer(transformed)

        console.log(`paginated`, paginated)

        const ret = await method(paginated)

        return transform_return(ret)
      } catch (e) {
        throw new Error(e.message)
      }
    }
  }

  private parseOptions<T extends ClassType<T>>({
    options,
    target,
    fields,
  }: ConfigCtx<T>) {
    const {
      requires,
      denies,
      exactly,
      expect,
      transform,
      onSuccess,
      transformReturn,
      checkType,
    } = deconstrcuOrNull(options)
    const check_requirements = this.requrie_checker(requires)
    const check_denies = this.deny_checker(denies)
    const check_exactly = this.exactly_checker(exactly)
    const check_expect = this.except_checker(expect)
    const transform_data = this.transform_processor(transform)
    const transform_return = this.transform_return_processor(transformReturn)
    const check_type = this.type_checker(checkType, fields)
    const check_pagination = this.pagination_checker(options?.pagination)
    const pagination_transformer = this.pagination_transformer(options?.pagination)
    return {
      check_requirements,
      check_denies,
      check_exactly,
      check_expect,
      transform_data,
      transform_return,
      check_type,
      check_pagination,
      pagination_transformer,
    }
  }

  private transform_return_processor<T>(transform: (data: T) => any) {
    let transform_data = (data: any) => data
    if (transform) {
      //TODO add check for function
      transform_data = transform
    }
    return transform_data
  }

  private transform_processor<T>(transform: (data: T) => T) {
    let transform_data = (data: any) => data
    if (transform) {
      //TODO add check for function
      transform_data = transform
    }
    return transform_data
  }

  private pagination_checker<T>(
    pagination: BeforeActionOptions<T>['pagination']
  ) {
    let check_pagination = (data: T) => void 0
    if (pagination && pagination.enable) {
      check_pagination = (data: T) => {
        // check if pagination is exist
        if (!data.hasOwnProperty('pagination')) {
          throw new Error(`pagination not found for paginated query`)
        }

        // check if pagination is valid
        const { currentPage, pageSize } = data['pagination'] // currentPage is not checked here
        const [min, max] = [
          pagination.limit.min ?? 0,
          pagination.limit.max, //this must be defined
        ]
        if (pageSize < min || pageSize > max) {
          throw new Error(`pageSize out of range`)
        }
      }
    }
    return check_pagination
  }

  private pagination_transformer<T>(
    pagination: BeforeActionOptions<T>['pagination']
  ) {
    const remove_pagination = (data: any) => {
      if (data.hasOwnProperty('pagination')) {
        delete data['pagination']
      }
      return data
    }
    let transform_pagination = (data: T) => {
      return {
        data: remove_pagination(data)
      }
    }
    if (pagination && pagination.enable) {
      // add skip and limit to data
      transform_pagination = (data: T) => {
        if (!data.hasOwnProperty('pagination')) {
          throw new Error(`pagination not found for paginated query`)
        }

        const { currentPage, pageSize } = data['pagination'] // all start from 0
        const skip = currentPage * pageSize
        const take = pageSize
        return {
          data: remove_pagination(data),
          skip,
          take,
        }
      }
    }
    return transform_pagination
  }

  private except_checker<T>(
    expect: ((data: T) => boolean) | ((data: T) => boolean)[]
  ) {
    let check_expect = (data: T) => void 0
    if (expect) {
      if (isArrayOfFunctions(expect)) {
        check_expect = (data: T) => {
          for (const func of expect) {
            if (!func(data)) {
              throw new Error(`Expectation failed`)
            }
          }
        }
      } else if (typeof expect === 'function') {
        //TODO check if this is correct
        check_expect = (data: T) => {
          if (!expect(data)) {
            throw new Error(`Expectation failed`)
          }
        }
      } else {
        throw new Error(`Expect must be a function or array of functions`)
      }
    }
    return check_expect
  }

  private requrie_checker<T>(requires: (keyof T)[]) {
    let check_requirements = (data: T) => void 0
    if (requires && Array.isArray(requires) && requires.length > 0) {
      check_requirements = (data: T) => {
        for (const field of requires) {
          if (!data.hasOwnProperty(field)) {
            throw new Error(`Missing field ${String(field)}`)
          }
        }
      }
    }
    return check_requirements
  }

  private deny_checker<T>(denies: (keyof T)[]) {
    let check_requirements = (data: T) => void 0
    if (denies && Array.isArray(denies) && denies.length > 0) {
      check_requirements = (data: T) => {
        for (const field of denies) {
          if (data.hasOwnProperty(field)) {
            throw new Error(`Denied field ${String(field)}`)
          }
        }
      }
    }
    return check_requirements
  }

  private exactly_checker<T>(exactly: (keyof T)[]) {
    let check_requirements = (data: T) => void 0
    if (exactly && Array.isArray(exactly) && exactly.length > 0) {
      check_requirements = (data: T) => {
        for (const field of exactly) {
          if (!data.hasOwnProperty(field)) {
            throw new Error(`Missing field ${String(field)}`)
          }
        }
        for (const field in data) {
          if (!exactly.includes(field)) {
            throw new Error(`Unexpected field ${String(field)}`)
          }
        }
      }
    }
    return check_requirements
  }

  private type_checker<T>(checkType: boolean, fields: FieldOptionsObject) {
    let check_requirements = (data: T, target: any) => void 0
    if (checkType) {
      check_requirements = (data: T) => {
        for (const [key, f] of Object.entries(fields)) {
          const val = data[key]
          const validator: ((x: any) => boolean) | null =
            f.validator || validatorMap[f.type]
          if (!f.noCheck && validator) {
            if (validator(val)) {
              // all good
            } else {
              throw new Error(`assertion failed for asserted key ${key}`)
            }
          } else {
            if (!f.noCheck) {
              throw new Error(
                `missing validator for checked type ${f.type} (named ${key})`
              )
            }
          }
        }
      }
    }
    return check_requirements
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

function fixRoute(route: string) {
  if (route.startsWith('/')) {
    return route
  } else {
    return `/${route}`
  }
}
