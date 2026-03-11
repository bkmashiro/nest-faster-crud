import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  Injectable, Inject, Type,
} from '@nestjs/common';
import { getResourceMeta } from '@faster-crud/core';

export class CrudControllerFactory {
  static create(entity: Function, ServiceClass: Type<any>): Type<any> {
    const meta = getResourceMeta(entity);
    if (!meta) throw new Error(`@Resource decorator not found on ${entity.name}`);

    const { name, operations } = meta;

    @Controller(name)
    class CrudController {
      constructor(@Inject(ServiceClass) readonly service: any) {}
    }

    if (operations.includes('create')) {
      const descriptor: PropertyDescriptor = {
        value: async function(this: any, body: any) {
          return this.service.create(body);
        },
        writable: true,
        configurable: true,
      };
      Post()(CrudController.prototype, 'create', descriptor);
      Body()(CrudController.prototype, 'create', 0);
      Object.defineProperty(CrudController.prototype, 'create', descriptor);
    }

    if (operations.includes('list')) {
      const descriptor: PropertyDescriptor = {
        value: async function(this: any, query: any) {
          return this.service.list(query ?? {});
        },
        writable: true,
        configurable: true,
      };
      Get()(CrudController.prototype, 'list', descriptor);
      Query()(CrudController.prototype, 'list', 0);
      Object.defineProperty(CrudController.prototype, 'list', descriptor);
    }

    if (operations.includes('get')) {
      const descriptor: PropertyDescriptor = {
        value: async function(this: any, id: string) {
          return this.service.get(+id);
        },
        writable: true,
        configurable: true,
      };
      Get(':id')(CrudController.prototype, 'get', descriptor);
      Param('id')(CrudController.prototype, 'get', 0);
      Object.defineProperty(CrudController.prototype, 'get', descriptor);
    }

    if (operations.includes('update')) {
      const descriptor: PropertyDescriptor = {
        value: async function(this: any, id: string, body: any) {
          return this.service.update(+id, body);
        },
        writable: true,
        configurable: true,
      };
      Patch(':id')(CrudController.prototype, 'update', descriptor);
      Param('id')(CrudController.prototype, 'update', 0);
      Body()(CrudController.prototype, 'update', 1);
      Object.defineProperty(CrudController.prototype, 'update', descriptor);
    }

    if (operations.includes('remove')) {
      const descriptor: PropertyDescriptor = {
        value: async function(this: any, id: string) {
          return this.service.remove(+id);
        },
        writable: true,
        configurable: true,
      };
      Delete(':id')(CrudController.prototype, 'remove', descriptor);
      Param('id')(CrudController.prototype, 'remove', 0);
      Object.defineProperty(CrudController.prototype, 'remove', descriptor);
    }

    Injectable()(CrudController);

    return CrudController;
  }
}
