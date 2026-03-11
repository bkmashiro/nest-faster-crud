import 'reflect-metadata';
import { Col, Resource, Searchable, Hidden, Ignore, Rule } from '@faster-crud/core';
import { MongooseResourceService } from '../index';

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

function createMockChain(resolvedValue: any) {
  return {
    exec: jest.fn().mockResolvedValue(resolvedValue),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  };
}

function createMongooseModel() {
  const saveFn = jest.fn();
  const model: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    id: 1,
    save: saveFn.mockResolvedValue({ id: 1, ...data }),
  }));

  model.find = jest.fn().mockReturnValue(createMockChain([]));
  model.countDocuments = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });
  model.findById = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
  model.findByIdAndUpdate = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
  model.findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
  model._saveFn = saveFn;

  return model;
}

describe('MongooseResourceService', () => {
  let mongooseModel: ReturnType<typeof createMongooseModel>;
  let service: any;

  beforeEach(() => {
    mongooseModel = createMongooseModel();
    const BaseService = MongooseResourceService(User, mongooseModel as any);
    service = new (BaseService as any)();
  });

  describe('create', () => {
    it('creates a record via new Model().save()', async () => {
      const result = await service.create({ name: 'Ada', role: 'admin' });

      expect(mongooseModel).toHaveBeenCalledWith({ name: 'Ada', role: 'admin' });
      expect(result).toEqual({ id: 1, name: 'Ada', role: 'admin' });
    });

    it('validates create input before persisting', async () => {
      await expect(service.create({ name: 'Ada' })).rejects.toThrow(/role is required/);
      expect(mongooseModel._saveFn).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('calls find/countDocuments with pagination and sort', async () => {
      const findChain = createMockChain([
        { id: 1, name: 'Ada', age: 32, email: 'ada@example.com', internal: 'x', role: 'admin' },
      ]);
      mongooseModel.find.mockReturnValue(findChain);
      mongooseModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(1) });

      const result = await service.list({
        page: { current: 2, size: 5 },
        sort: { field: 'name', order: 'desc' },
      });

      expect(mongooseModel.find).toHaveBeenCalledWith({});
      expect(findChain.skip).toHaveBeenCalledWith(5);
      expect(findChain.limit).toHaveBeenCalledWith(5);
      expect(findChain.sort).toHaveBeenCalledWith({ name: -1 });
      expect(result).toEqual({
        data: [{ id: 1, name: 'Ada', age: 32, role: 'admin' }],
        total: 1,
        page: 2,
        size: 5,
      });
    });

    it('applies searchable filters and skips non-searchable', async () => {
      const findChain = createMockChain([]);
      mongooseModel.find.mockReturnValue(findChain);
      mongooseModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      await service.list({
        filters: {
          name: { op: 'like', value: 'ad' },
          age: { op: 'between', value: [18, 40] },
          email: { op: 'eq', value: 'ignored@example.com' },
        } as any,
      });

      const calledWith = mongooseModel.find.mock.calls[0][0];
      expect(calledWith.name).toEqual({ $regex: 'ad', $options: 'i' });
      expect(calledWith.age).toEqual({ $gte: 18, $lte: 40 });
      expect(calledWith.email).toBeUndefined();
    });

    it('maps ne, gt, in operators', async () => {
      const findChain = createMockChain([]);
      mongooseModel.find.mockReturnValue(findChain);
      mongooseModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      await service.list({
        filters: {
          name: { op: 'ne', value: 'Ada' },
          age: { op: 'gt', value: 21 },
        } as any,
      });

      const calledWith = mongooseModel.find.mock.calls[0][0];
      expect(calledWith.name).toEqual({ $ne: 'Ada' });
      expect(calledWith.age).toEqual({ $gt: 21 });
    });

    it('maps $in filter', async () => {
      const findChain = createMockChain([]);
      mongooseModel.find.mockReturnValue(findChain);
      mongooseModel.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(0) });

      await service.list({
        filters: { name: { op: 'in', value: ['Ada', 'Grace'] } } as any,
      });

      expect(mongooseModel.find.mock.calls[0][0].name).toEqual({ $in: ['Ada', 'Grace'] });
    });
  });

  describe('get', () => {
    it('fetches by id and filters view', async () => {
      mongooseModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          id: 1, name: 'Ada', age: 32, email: 'ada@example.com', internal: 'secret', role: 'admin',
        }),
      });

      const result = await service.get(1);

      expect(mongooseModel.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, name: 'Ada', age: 32, email: 'ada@example.com', role: 'admin' });
    });

    it('returns null for missing record', async () => {
      mongooseModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      expect(await service.get(999)).toBeNull();
    });
  });

  describe('update', () => {
    it('calls findByIdAndUpdate with { new: true }', async () => {
      mongooseModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: 1, name: 'Grace', role: 'admin' }),
      });

      const result = await service.update(1, { name: 'Grace' });

      expect(mongooseModel.findByIdAndUpdate).toHaveBeenCalledWith(1, { name: 'Grace' }, { new: true });
      expect(result).toEqual({ id: 1, name: 'Grace', role: 'admin' });
    });

    it('throws when record not found', async () => {
      mongooseModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update(999, { name: 'Ghost' })).rejects.toThrow(/not found/);
    });
  });

  describe('remove', () => {
    it('calls findByIdAndDelete', async () => {
      mongooseModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
      await service.remove(1);
      expect(mongooseModel.findByIdAndDelete).toHaveBeenCalledWith(1);
    });
  });
});
