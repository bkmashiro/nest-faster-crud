import express = require('express')
import { Router } from 'express'
import { AddReq, DelReq, EditReq, PageQuery, PageRes } from './fastcrud-gen/interface'

export function isArrayOfFunctions(
  data: any
): data is ((data: any) => boolean)[] {
  return Array.isArray(data) && data.every((item) => typeof item === 'function')
}

export interface CRUDProvider<T> {
  create(data: AddReq): Promise<any>
  read(query: PageQuery): Promise<PageRes<T>>
  update(data: EditReq): Promise<any>
  delete(data: DelReq): Promise<any>
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
