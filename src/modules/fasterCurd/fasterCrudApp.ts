import { Logger } from '@nestjs/common'
import express = require('express')
import { Router } from 'express'
import { CRUDUser } from './CRUDUser.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { z } from 'zod'
import { Repository } from 'typeorm'

export const logger = new Logger('FasterCRUDService')

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

export async function perform_task(req, task: (data: any) => Promise<any>, res) {
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
