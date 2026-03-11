import 'reflect-metadata';
import { Resource, Col } from '@faster-crud/core';
import { expressCrudRouter } from '../index';

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

function mockRes() {
  const res: any = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
}

describe('expressCrudRouter', () => {
  it('should return an Express Router', () => {
    const router = expressCrudRouter(Item, mockService());
    expect(router).toBeDefined();
    expect(typeof router.get).toBe('function');
    expect(typeof router.post).toBe('function');
  });

  it('should throw if Entity has no @Resource', () => {
    class NoResource {}
    expect(() => expressCrudRouter(NoResource as any, mockService())).toThrow(
      '@Resource not found',
    );
  });

  it('should register GET, POST, PATCH, DELETE routes', () => {
    const router = expressCrudRouter(Item, mockService());
    const routes = (router as any).stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      }));

    expect(routes).toContainEqual({ path: '/', methods: ['get'] });
    expect(routes).toContainEqual({ path: '/:id', methods: ['get'] });
    expect(routes).toContainEqual({ path: '/', methods: ['post'] });
    expect(routes).toContainEqual({ path: '/:id', methods: ['patch'] });
    expect(routes).toContainEqual({ path: '/:id', methods: ['delete'] });
  });

  describe('route handlers', () => {
    let service: ReturnType<typeof mockService>;

    beforeEach(() => {
      service = mockService();
    });

    function getHandler(router: any, method: string, path: string) {
      const layer = router.stack.find(
        (l: any) => l.route && l.route.path === path && l.route.methods[method],
      );
      return layer?.route.stack[0].handle;
    }

    it('GET / should call service.list', async () => {
      const router = expressCrudRouter(Item, service);
      const handler = getHandler(router, 'get', '/');
      const req = { query: { page: '1' } } as any;
      const res = mockRes();
      const next = jest.fn();

      handler(req, res, next);
      await new Promise((r) => setTimeout(r, 10));

      expect(service.list).toHaveBeenCalledWith(req.query);
      expect(res.json).toHaveBeenCalledWith([{ id: 1, name: 'Test' }]);
    });

    it('GET /:id should call service.get', async () => {
      const router = expressCrudRouter(Item, service);
      const handler = getHandler(router, 'get', '/:id');
      const req = { params: { id: '1' } } as any;
      const res = mockRes();
      const next = jest.fn();

      handler(req, res, next);
      await new Promise((r) => setTimeout(r, 10));

      expect(service.get).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Test' });
    });

    it('GET /:id should return 404 when not found', async () => {
      service.get.mockResolvedValue(null);
      const router = expressCrudRouter(Item, service);
      const handler = getHandler(router, 'get', '/:id');
      const req = { params: { id: '99' } } as any;
      const res = mockRes();
      const next = jest.fn();

      handler(req, res, next);
      await new Promise((r) => setTimeout(r, 10));

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    it('POST / should call service.create with 201', async () => {
      const router = expressCrudRouter(Item, service);
      const handler = getHandler(router, 'post', '/');
      const req = { body: { name: 'New' } } as any;
      const res = mockRes();
      const next = jest.fn();

      handler(req, res, next);
      await new Promise((r) => setTimeout(r, 10));

      expect(service.create).toHaveBeenCalledWith({ name: 'New' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'New' });
    });

    it('PATCH /:id should call service.update', async () => {
      const router = expressCrudRouter(Item, service);
      const handler = getHandler(router, 'patch', '/:id');
      const req = { params: { id: '1' }, body: { name: 'Updated' } } as any;
      const res = mockRes();
      const next = jest.fn();

      handler(req, res, next);
      await new Promise((r) => setTimeout(r, 10));

      expect(service.update).toHaveBeenCalledWith(1, { name: 'Updated' });
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
    });

    it('DELETE /:id should call service.remove', async () => {
      const router = expressCrudRouter(Item, service);
      const handler = getHandler(router, 'delete', '/:id');
      const req = { params: { id: '1' } } as any;
      const res = mockRes();
      const next = jest.fn();

      handler(req, res, next);
      await new Promise((r) => setTimeout(r, 10));

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it('should call next on error', async () => {
      const error = new Error('boom');
      service.list.mockRejectedValue(error);
      const router = expressCrudRouter(Item, service);
      const handler = getHandler(router, 'get', '/');
      const req = { query: {} } as any;
      const res = mockRes();
      const next = jest.fn();

      handler(req, res, next);
      await new Promise((r) => setTimeout(r, 10));

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('limited operations', () => {
    it('should only register specified operations', () => {
      @Resource('readonly', { operations: ['list', 'get'] })
      class ReadonlyEntity {
        @Col() id!: number;
      }

      const router = expressCrudRouter(ReadonlyEntity, mockService());
      const routes = (router as any).stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      expect(routes).toHaveLength(2);
      expect(routes).toContainEqual({ path: '/', methods: ['get'] });
      expect(routes).toContainEqual({ path: '/:id', methods: ['get'] });
    });
  });
});
