import 'reflect-metadata';
import { Col, Resource, Searchable, Rule } from '@faster-crud/core';
import { createCrudRouter, type CrudService } from '../index';

@Resource('items')
class Item {
  @Col() id!: number;
  @Searchable() @Col() name!: string;
  @Col() age!: number;
}

function createMockService(): CrudService<Item> {
  return {
    create: jest.fn(async (dto) => ({ id: 1, ...dto } as Item)),
    list: jest.fn(async () => ({ data: [], total: 0, page: 1, size: 10 })),
    get: jest.fn(async (id) => ({ id, name: 'Ada', age: 30 })),
    update: jest.fn(async (id, dto) => ({ id, ...dto } as Item)),
    remove: jest.fn(async () => {}),
  };
}

describe('createCrudRouter', () => {
  let mockService: CrudService<Item>;
  let router: ReturnType<typeof createCrudRouter>;

  beforeEach(() => {
    mockService = createMockService();
    router = createCrudRouter(Item, mockService);
  });

  it('returns a router with list, get, create, update, remove procedures', () => {
    // tRPC router exposes _def.procedures or we can check the shape
    const routerDef = (router as any)._def;
    expect(routerDef.procedures.list).toBeDefined();
    expect(routerDef.procedures.get).toBeDefined();
    expect(routerDef.procedures.create).toBeDefined();
    expect(routerDef.procedures.update).toBeDefined();
    expect(routerDef.procedures.remove).toBeDefined();
  });

  describe('list procedure', () => {
    it('calls service.list with query input', async () => {
      const caller = createCallerFromRouter(router);
      const result = await caller.list({});

      expect(mockService.list).toHaveBeenCalledWith({});
      expect(result).toEqual({ data: [], total: 0, page: 1, size: 10 });
    });

    it('passes pagination and filters', async () => {
      const caller = createCallerFromRouter(router);
      await caller.list({
        page: { current: 2, size: 5 },
        filters: { name: { op: 'like', value: 'ad' } },
      });

      expect(mockService.list).toHaveBeenCalledWith({
        page: { current: 2, size: 5 },
        filters: { name: { op: 'like', value: 'ad' } },
      });
    });
  });

  describe('get procedure', () => {
    it('calls service.get with id', async () => {
      const caller = createCallerFromRouter(router);
      const result = await caller.get({ id: 1 });

      expect(mockService.get).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, name: 'Ada', age: 30 });
    });
  });

  describe('create procedure', () => {
    it('calls service.create with dto', async () => {
      const caller = createCallerFromRouter(router);
      const result = await caller.create({ name: 'Grace', age: 25 });

      expect(mockService.create).toHaveBeenCalledWith({ name: 'Grace', age: 25 });
      expect(result).toEqual({ id: 1, name: 'Grace', age: 25 });
    });
  });

  describe('update procedure', () => {
    it('calls service.update with id and dto', async () => {
      const caller = createCallerFromRouter(router);
      const result = await caller.update({ id: 1, name: 'Updated' });

      expect(mockService.update).toHaveBeenCalledWith(1, { name: 'Updated' });
      expect(result).toEqual({ id: 1, name: 'Updated' });
    });
  });

  describe('remove procedure', () => {
    it('calls service.remove with id', async () => {
      const caller = createCallerFromRouter(router);
      await caller.remove({ id: 1 });

      expect(mockService.remove).toHaveBeenCalledWith(1);
    });
  });
});

// Helper: create a tRPC caller from a router for direct testing
function createCallerFromRouter(router: any) {
  const { initTRPC } = require('@trpc/server');
  const t = initTRPC.create();
  return t.createCallerFactory(router)({});
}
