import 'reflect-metadata';
import { Col, Resource, Searchable, Hidden, Ignore, Rule } from '@faster-crud/core';
import { MikroOrmResourceService } from '../index';

jest.mock('@nestjs/common', () => ({
  Injectable: () => (target: any) => target,
  Type: class {},
}));

@Resource('users')
class User {
  @Col() id!: number;
  @Searchable() @Col() name!: string;
  @Searchable() @Col() age!: number;
  @Hidden('list') @Col() email!: string;
  @Ignore() @Col() internal!: string;
  @Rule.required() @Col() role!: string;
}

function createMockEm() {
  return {
    create: jest.fn((_Entity: any, data: any) => ({ id: 1, ...data })),
    persistAndFlush: jest.fn(async () => {}),
    findAndCount: jest.fn(async () => [[], 0]),
    findOne: jest.fn(async () => null),
    assign: jest.fn((entity: any, data: any) => Object.assign(entity, data)),
    flush: jest.fn(async () => {}),
    removeAndFlush: jest.fn(async () => {}),
  };
}

describe('MikroOrmResourceService', () => {
  let em: ReturnType<typeof createMockEm>;
  let service: any;

  beforeEach(() => {
    em = createMockEm();
    const BaseService = MikroOrmResourceService(User, em as any);
    service = new (BaseService as any)();
  });

  describe('create', () => {
    it('delegates to em.create and em.persistAndFlush', async () => {
      const result = await service.create({ name: 'Ada', role: 'admin' });

      expect(em.create).toHaveBeenCalledWith(User, { name: 'Ada', role: 'admin' });
      expect(em.persistAndFlush).toHaveBeenCalledWith({ id: 1, name: 'Ada', role: 'admin' });
      expect(result).toEqual({ id: 1, name: 'Ada', role: 'admin' });
    });

    it('validates before persisting', async () => {
      await expect(service.create({ name: 'Ada' })).rejects.toThrow(/role is required/);
      expect(em.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('calls em.findAndCount with pagination and sort', async () => {
      em.findAndCount.mockResolvedValue([
        [{ id: 1, name: 'Ada', age: 32, email: 'ada@example.com', internal: 'x', role: 'admin' }],
        1,
      ]);

      const result = await service.list({
        page: { current: 2, size: 5 },
        sort: { field: 'name', order: 'desc' },
      });

      expect(em.findAndCount).toHaveBeenCalledWith(
        User,
        {},
        { orderBy: { name: 'desc' }, limit: 5, offset: 5 },
      );
      expect(result).toEqual({
        data: [{ id: 1, name: 'Ada', age: 32, role: 'admin' }],
        total: 1,
        page: 2,
        size: 5,
      });
    });

    it('applies searchable filters and maps operators', async () => {
      em.findAndCount.mockResolvedValue([[], 0]);

      await service.list({
        filters: {
          name: { op: 'like', value: 'ad' },
          age: { op: 'between', value: [18, 40] },
          email: { op: 'eq', value: 'ignored@example.com' },
        } as any,
      });

      const where = (em.findAndCount.mock.calls[0] as any)[1];
      expect(where.name).toEqual({ $like: '%ad%' });
      expect(where.age).toEqual({ $gte: 18, $lte: 40 });
      expect(where.email).toBeUndefined();
    });

    it('maps ne, gt, in operators', async () => {
      em.findAndCount.mockResolvedValue([[], 0]);

      await service.list({
        filters: {
          name: { op: 'ne', value: 'Ada' },
          age: { op: 'gt', value: 21 },
        } as any,
      });

      const where = (em.findAndCount.mock.calls[0] as any)[1];
      expect(where.name).toEqual({ $ne: 'Ada' });
      expect(where.age).toEqual({ $gt: 21 });
    });
  });

  describe('get', () => {
    it('calls em.findOne and filters for get view', async () => {
      em.findOne.mockResolvedValue({
        id: 1, name: 'Ada', age: 32, email: 'ada@example.com', internal: 'secret', role: 'admin',
      });

      const result = await service.get(1);

      expect(em.findOne).toHaveBeenCalledWith(User, { id: 1 });
      expect(result).toEqual({ id: 1, name: 'Ada', age: 32, email: 'ada@example.com', role: 'admin' });
    });

    it('returns null for missing record', async () => {
      em.findOne.mockResolvedValue(null);
      expect(await service.get(999)).toBeNull();
    });
  });

  describe('update', () => {
    it('calls findOne, assign, flush', async () => {
      const existing = { id: 1, name: 'Ada', role: 'admin' };
      em.findOne.mockResolvedValue(existing);

      const result = await service.update(1, { name: 'Grace' });

      expect(em.findOne).toHaveBeenCalledWith(User, { id: 1 });
      expect(em.assign).toHaveBeenCalledWith(existing, { name: 'Grace' });
      expect(em.flush).toHaveBeenCalled();
      expect(result.name).toBe('Grace');
    });

    it('throws when record not found', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(service.update(999, { name: 'Ghost' })).rejects.toThrow(/not found/);
    });
  });

  describe('remove', () => {
    it('calls findOne then removeAndFlush', async () => {
      const existing = { id: 1, name: 'Ada' };
      em.findOne.mockResolvedValue(existing);

      await service.remove(1);

      expect(em.findOne).toHaveBeenCalledWith(User, { id: 1 });
      expect(em.removeAndFlush).toHaveBeenCalledWith(existing);
    });

    it('throws when record not found', async () => {
      em.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(/not found/);
    });
  });
});
