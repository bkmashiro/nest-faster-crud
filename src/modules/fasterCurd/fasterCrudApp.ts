import { Injectable, Logger } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import express = require('express')
import { Router, Express } from 'express'
import { FieldOptions } from './test'
import { CRUDUser } from './CRUDUser.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { z } from 'zod'
import { Repository } from 'typeorm'

const logger = new Logger('FasterCRUDService')

export interface CRUDProvider {
  create(data: any): Promise<any>
  read(data: any): Promise<any>
  update(data: any): Promise<any>
  delete(data: any): Promise<any>
}

export class TypeORMRepoAdapter implements CRUDProvider {
  constructor(private readonly repo: Repository<any>) {}

  async create(data: any) {
    return await this.repo.insert(data)
  }

  async update(data: any) {
    return await this.repo.update(data.id, data)
  }

  async delete(data: any) {
    return await this.repo.delete(data)
  }

  async read(data: any) {
    return await this.repo.find(data)
  }
}

@Injectable()
export class FasterCrudService {
  // app: Express = express()
  // get NestJS app instance
  get app(): Express {
    return this.adapterHost.httpAdapter.getInstance()
  }

  constructor(
    private adapterHost: HttpAdapterHost,
  ) {
    this.app.use(express.json())
    logger.debug(
      `FasterCrudService created, attaching to ${this.adapterHost.httpAdapter.getType()}`
    )

    this.app.get('/faster-crud-test', (req, res) => {
      res.send('OK')
    })

    // this.generateCRUD(CRUDUser, new TypeORMRepoAdapter(this.userRepo))
  }

  addRouter(route: string, router: express.Router) {
    // print all routes of router
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

  getRootRoutes() {
    //print all routes of app
    this.app._router.stack.forEach((r) => {
      if (r.route && r.route.path) {
        logger.debug(
          `Mapped {${
            r.route.path
          }, ${r.route.stack[0].method.toUpperCase()}} route`
        )
      }
    })
  }

  generateCRUD<T extends { new (...args: any[]): {} }>(
    entity: T,
    provider: CRUDProvider
  ) {
    const fields = Reflect.getMetadata('fields', entity.prototype) as {
      [key: string]: FieldOptions
    }
    const router = new FasterCrudRouterBuilder()

    // router.addHandler('post', '/create', async function (req, res) {
    //   // assume body is a json object
    //   await perform_task(req, create, res)
    // })
    const actions = ['create', 'read', 'update', 'delete']
    for (const action of actions) {
      const method = provider[action].bind(provider) // have to bind to provider, otherwise this will be undefined
      router.addHandler('post', `/${action}`, async function (req, res) {
        // assume body is a json object
        await perform_task(req, method, res)
      })
    }

    this.addRouter('/crud-user', router.build())
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

async function perform_task(req, task: (data: any) => Promise<any>, res) {
  const body = req.body
  const result = await task(body)
  try {
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
