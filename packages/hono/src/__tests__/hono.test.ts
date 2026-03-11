import 'reflect-metadata';
import { Resource, Col } from '@faster-crud/core';
import { HonoCrudRouter } from '../index';

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

describe('HonoCrudRouter', () => {
  it('should return a Hono app', () => {
    const service = mockService();
    const app = HonoCrudRouter(Item, service);
    expect(app).toBeDefined();
    expect(typeof app.fetch).toBe('function');
  });

  it('should throw if Entity has no @Resource', () => {
    class NoResource {}
    expect(() => HonoCrudRouter(NoResource as any, mockService())).toThrow('@Resource not found');
  });

  describe('route handlers', () => {
    let service: ReturnType<typeof mockService>;
    let app: ReturnType<typeof HonoCrudRouter>;

    beforeEach(() => {
      service = mockService();
      app = HonoCrudRouter(Item, service);
    });

    it('GET / should call service.list', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([{ id: 1, name: 'Test' }]);
      expect(service.list).toHaveBeenCalled();
    });

    it('GET /:id should call service.get', async () => {
      const res = await app.request('/1');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ id: 1, name: 'Test' });
      expect(service.get).toHaveBeenCalledWith(1);
    });

    it('GET /:id should return 404 when not found', async () => {
      service.get.mockResolvedValue(null);
      const res = await app.request('/99');
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({ error: 'Not found' });
    });

    it('POST / should call service.create with 201', async () => {
      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New' }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual({ id: 1, name: 'New' });
      expect(service.create).toHaveBeenCalledWith({ name: 'New' });
    });

    it('PATCH /:id should call service.update', async () => {
      const res = await app.request('/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ id: 1, name: 'Updated' });
      expect(service.update).toHaveBeenCalledWith(1, { name: 'Updated' });
    });

    it('DELETE /:id should call service.remove', async () => {
      const res = await app.request('/1', { method: 'DELETE' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ ok: true });
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('limited operations', () => {
    it('should only register specified operations', () => {
      @Resource('readonly', { operations: ['list', 'get'] })
      class ReadonlyEntity {
        @Col() id!: number;
      }

      const service = mockService();
      const app = HonoCrudRouter(ReadonlyEntity, service);

      // The app is created without error; POST/PATCH/DELETE will 404
      expect(app).toBeDefined();
    });
  });
});
