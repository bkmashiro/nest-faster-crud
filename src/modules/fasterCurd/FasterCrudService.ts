import { Injectable, Logger } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { Express } from 'express'
import express = require('express')
import { BeforeActionOptions,  ConfigCtx } from './decorators'
import {
  BeforeActionTokenType,
  CRUDMethods,
  FCRUD_GEN_CFG_TOKEN,
  FIELDS_TOKEN,
  GEN_DATA_DICT_TOKEN,
  HttpMethods,
  fcrud_prefix,
} from './fcrud-tokens'
import { ENTITY_NAME_TOKEN, GEN_CRUD_METHOD_TOKEN } from './fcrud-tokens'
import { getProtoMeta } from '../../utils/reflect.utils'
import { defaultCrudMethod } from './fcrud-tokens'
import {
  CheckerType,
  IGNORE_ME,
  TransformerType,
  post_transformer_factories,
  transform_after_processor,
} from './fragments'
import { FCrudJwtMiddleware } from './middleware/jwt.middleware'
import {
  CRUDProvider,
  FasterCrudRouterBuilder as RouterBuilder,
  perform_task,
} from './fasterCRUD'
import { fixRoute } from 'src/utils/utils'
import { checker_factories, pre_transformer_factories } from './fragments'
import { exceptionMiddleware } from './middleware/exception.middleware'
import { ObjectLiteral } from './fastcrud-gen/interface'
import { log } from 'src/utils/debug'


export type QueryData = {
  data: any
  pagination?: {
    currentPage: number
    pageSize: number
  }
  sort?: {
    prop: string
    order: string
  }
}

const logger = new Logger('FasterCRUDService')

@Injectable()
export class FasterCrudService {
  prefix = `dt-api/`
  default_method: HttpMethods = 'post'

  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly fCrudJwtMiddleware: FCrudJwtMiddleware,
  ) {
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

  generateCRUD<T extends abstract new (...args: any) => InstanceType<T>>(
    entity: T,
    provider: CRUDProvider<InstanceType<T>>
  ) {
    const { dict, fcrudName, fields, doGenerateDataDict } =
      this.getEntityMeta(entity)
    const router = new RouterBuilder()
      .addPreMiddlewares(this.fCrudJwtMiddleware.FcrudJwtMiddleware)
      .addPostMiddlewares(exceptionMiddleware)

    // create all CRUD routes
    const actions: CRUDMethods[] =
      getProtoMeta(entity, GEN_CRUD_METHOD_TOKEN) ?? defaultCrudMethod
    const docs = { crud: {}, dict: '' }
    for (const action of actions) {
      const method = provider[action].bind(provider) // have to bind to provider, otherwise this will be undefined
      const action_token: BeforeActionTokenType = `${fcrud_prefix}before-action-${action}`
      const decoration_config: BeforeActionOptions<T> = getProtoMeta( entity,  action_token)
      const decoratedMethod = this.configureMethod(
        {
          options: decoration_config,
          target: entity,
          fields,
          action,
        },
        method
      )

      const route = fixRoute(decoration_config?.route ?? `/${action}`)
      router.setRoute(this.default_method, route, async function (req, res) {
        await perform_task(req, decoratedMethod, res)
      })
      docs.crud[action] = `/${fcrudName.toLowerCase()}${route}`
    }

    if (doGenerateDataDict) {
      docs.dict = `/${fcrudName.toLowerCase()}/dict`
      router.setRoute('get', `/dict`, async function (req, res) {
        res.status(200).json(dict)
      })
    }
    router.setRoute('get', `/docs`, async function (req, res) {
      res.status(200).json(docs)
    })

    this.addRouter(`/${this.prefix}${fcrudName.toLowerCase()}`, router.build())
  }

  private getEntityMeta<T extends ObjectLiteral>(entity: T) {
    const fcrudName = getProtoMeta(entity, ENTITY_NAME_TOKEN) ?? entity.name
    const fields = getProtoMeta(entity, FIELDS_TOKEN) ?? {}
    const dict = getProtoMeta(entity, FCRUD_GEN_CFG_TOKEN) ?? {}
    const doGenerateDataDict = getProtoMeta(entity, GEN_DATA_DICT_TOKEN) ?? true
    return { dict, fcrudName, fields, doGenerateDataDict }
  }

  configureMethod<T extends ObjectLiteral>(
    cfg: ConfigCtx<T>,
    method: (data: any) => Promise<any>
  ) {
    if (!cfg) {
      return method
    }
    if (!cfg.options) {
      cfg.options = {}
    }

    const {
      checkers,
      pre_transformers,
      post_transformers,
      hooks,
      transform_after,
    } = this.parseOptions(cfg)
    return async (data: any) => {
      try {
        applyCheckers(checkers, data)

        data = applyTransformers(pre_transformers, data)

        log(`exec with data:`, data)

        let queryResult = await method(data)

        log(`exec result:`, queryResult)

        queryResult = applyTransformers(post_transformers, queryResult)

        log(`transformed result:`, queryResult)
        const after = transform_after(data, queryResult)
        log(data, queryResult)
        log(`transformed after:`, after)
        return after
      } catch (e) {
        logger.error(`error when executing method ${method.name}:`, e)
        // logger.debug(`error data:`, data)
        // logger.debug(`stack:`, e.stack)
        throw new Error(e.message)
      }
    }
  }

  private parseOptions(ctx: ConfigCtx) {
    let [checkers, pre_transformers, post_transformers] = [
      checker_factories,
      pre_transformer_factories,
      post_transformer_factories,
    ].map((f) => {
      // get all products, and filter out empty ones
      return f.map((f) => f(ctx)).filter((item) => item !== IGNORE_ME)
    })

    const hooks = [] //TODO: hooks are not implemented yet

    return {
      checkers: checkers as CheckerType[],
      pre_transformers: pre_transformers as TransformerType[],
      post_transformers: post_transformers as TransformerType[],
      transform_after: transform_after_processor(ctx),
      hooks,
    }
  }

  get app(): Express {
    return this.adapterHost.httpAdapter.getInstance()
  }
}

function applyCheckers(checkers: CheckerType[], data: any) {
  for (const checker of checkers) {
    checker(data)
  }
}

function applyTransformers(post_transformers: TransformerType[], result: any) {
  for (const transformer of post_transformers) {
    result = transformer(result)
  }
  return result
}
