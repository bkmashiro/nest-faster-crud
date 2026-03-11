import 'reflect-metadata';
import { Resource, Col } from '@faster-crud/core';
import { FastifyCrudPlugin } from '../index';
import Fastify from 'fastify';

@Resource('items', { operations: ['create', 'list', 'get', 'update', 'remove'] })
class Item {
  @Col() id!: number;
  @Col() name!: string;
}

function mockService() {
  return {
    create: jest.fn().mockResolvedValue({ id: 1, name: 'New' }),
    list: jest.fn().mockResolvedValue([{ id: 1, name: 'Test' }]),
    get: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
    update: jest.fn().mockResolvedValue({ id: 1, name: 'Updated' }),
    remove: jest.fn().mockResolvedValue(undefined),
  };
}

describe('FastifyCrudPlugin', () => {
  it('should return a plugin function', () => {
    const plugin = FastifyCrudPlugin(Item, mockService());
    expect(typeof plugin).toBe('function');
  });

  it('should throw if Entity has no @Resource', async () => {
    class NoResource {}
    const plugin = FastifyCrudPlugin(NoResource as any, mockService());
    const app = Fastify();
    await expect(app.register(plugin, { prefix: '/test' })).rejects.toThrow(
      '@Resource not found',
    );
  });

  describe('route registration', () => {
    let service: ReturnType<typeof mockService>;
    let app: ReturnType<typeof Fastify>;

    beforeEach(async () => {
      service = mockService();
      app = Fastify();
      const plugin = FastifyCrudPlugin(Item, service);
      await app.register(plugin, { prefix: '/items' });
      await app.ready();
    });

    afterEach(async () => {
      await app.close();
    });

    it('GET /items should call service.list', async () => {
      const res = await app.inject({ method: 'GET', url: '/items' });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload)).toEqual([{ id: 1, name: 'Test' }]);
      expect(service.list).toHaveBeenCalled();
    });

    it('GET /items/:id should call service.get', async () => {
      const res = await app.inject({ method: 'GET', url: '/items/1' });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload)).toEqual({ id: 1, name: 'Test' });
      expect(service.get).toHaveBeenCalledWith(1);
    });

    it('GET /items/:id should return 404 when not found', async () => {
      service.get.mockResolvedValue(null);
      const res = await app.inject({ method: 'GET', url: '/items/99' });
      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload)).toEqual({ error: 'Not found' });
    });

    it('POST /items should call service.create with 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/items',
        payload: { name: 'New' },
      });
      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.payload)).toEqual({ id: 1, name: 'New' });
      expect(service.create).toHaveBeenCalledWith({ name: 'New' });
    });

    it('PATCH /items/:id should call service.update', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/items/1',
        payload: { name: 'Updated' },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload)).toEqual({ id: 1, name: 'Updated' });
      expect(service.update).toHaveBeenCalledWith(1, { name: 'Updated' });
    });

    it('DELETE /items/:id should call service.remove', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/items/1' });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload)).toEqual({ ok: true });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('default prefix', () => {
    it('should use resource name as default prefix', async () => {
      const service = mockService();
      const app = Fastify();
      const plugin = FastifyCrudPlugin(Item, service);
      await app.register(plugin);
      await app.ready();

      const res = await app.inject({ method: 'GET', url: '/items' });
      expect(res.statusCode).toBe(200);
      expect(service.list).toHaveBeenCalled();

      await app.close();
    });
  });

  describe('limited operations', () => {
    it('should only register specified operations', async () => {
      @Resource('readonly', { operations: ['list', 'get'] })
      class ReadonlyEntity {
        @Col() id!: number;
      }

      const service = mockService();
      const app = Fastify();
      const plugin = FastifyCrudPlugin(ReadonlyEntity, service);
      await app.register(plugin, { prefix: '/ro' });
      await app.ready();

      const getRes = await app.inject({ method: 'GET', url: '/ro' });
      expect(getRes.statusCode).toBe(200);

      const postRes = await app.inject({
        method: 'POST',
        url: '/ro',
        payload: {},
      });
      expect(postRes.statusCode).toBe(404);

      await app.close();
    });
  });
});
