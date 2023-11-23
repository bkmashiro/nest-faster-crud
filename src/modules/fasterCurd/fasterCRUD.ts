import { Injectable } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { Express } from 'express'
import {
  logger,
  CRUDProvider,
  FasterCrudRouterBuilder,
  perform_task,
} from './fasterCrudApp'
import express = require('express')
import { CRUDMethods, FieldOptions } from './test'
import {
  FCRUD_NAME_TOKEN,
  FIELD_TOKEN,
  GEN_CRUD_METHOD_TOKEN,
} from './fcrud-tokens'
import { getProtoMeta } from './reflect.utils'

const defaultCrudMethod = ['create', 'read', 'update', 'delete']
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
    provider: CRUDProvider
  ) {
    const fields = Reflect.getMetadata(FIELD_TOKEN, entity.prototype) as {
      [key: string]: FieldOptions
    }

    const fcrudName: string =
      Reflect.getMetadata(FCRUD_NAME_TOKEN, entity.prototype) ?? entity.name
    const router = new FasterCrudRouterBuilder()

    const actions: CRUDMethods[] = getProtoMeta(
      entity,
      GEN_CRUD_METHOD_TOKEN
    ) ?? defaultCrudMethod
    for (const action of actions) {
      const method = provider[action].bind(provider) // have to bind to provider, otherwise this will be undefined
      router.addHandler('post', `/${action}`, async function (req, res) {
        await perform_task(req, method, res)
      })
    }

    this.addRouter(`/${this.prefix}${fcrudName.toLowerCase()}`, router.build())
  }

  get app(): Express {
    return this.adapterHost.httpAdapter.getInstance()
  }
}
