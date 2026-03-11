import 'reflect-metadata';
import { Resource, Col, Searchable, Hidden, Ignore, Rule } from '@faster-crud/core';
import { TypeOrmResourceService } from '../typeorm-resource.service';

// --- Mock typeorm operators ---
jest.mock('typeorm', () => {
  const actual: any = {};
  actual.Injectable = () => () => {};
  actual.Not = (v: any) => ({ _type: 'not', _value: v });
  actual.LessThan = (v: any) => ({ _type: 'lessThan', _value: v });
  actual.LessThanOrEqual = (v: any) => ({ _type: 'lessThanOrEqual', _value: v });
  actual.MoreThan = (v: any) => ({ _type: 'moreThan', _value: v });
  actual.MoreThanOrEqual = (v: any) => ({ _type: 'moreThanOrEqual', _value: v });
  actual.Like = (v: any) => ({ _type: 'like', _value: v });
  actual.In = (v: any) => ({ _type: 'in', _value: v });
  actual.Between = (a: any, b: any) => ({ _type: 'between', _value: [a, b] });
  actual.Repository = class {};
  return actual;
});

// --- Mock @nestjs/common Injectable ---
jest.mock('@nestjs/common', () => ({
  Injectable: () => (target: any) => target,
  Type: class {},
}));

// --- Test entity ---
@Resource('articles')
class Article {
  @Col() id!: number;
  @Searchable() @Col() title!: string;
  @Searchable() @Col() status!: string;
  @Hidden('list') @Col() body!: string;
  @Ignore() @Col() internal!: string;
  @Rule.required() @Col() title2!: string;
}

// --- Create the service class ---
const BaseService = TypeOrmResourceService(Article);

// --- Build a mock repository ---
function createMockRepo() {
  return {
    create: jest.fn((dto: any) => ({ ...dto })),
    save: jest.fn((entity: any) => Promise.resolve({ id: 1, ...entity })),
    findAndCount: jest.fn(() => Promise.resolve([[], 0])),
    findOne: jest.fn(() => Promise.resolve(null)),
    update: jest.fn(() => Promise.resolve({})),
    delete: jest.fn(() => Promise.resolve({})),
    softDelete: jest.fn(() => Promise.resolve({})),
    target: Article,
    manager: {
      connection: {
        getMetadata: jest.fn(() => ({
          deleteDateColumn: null,
        })),
      },
    },
  };
}

describe('TypeOrmResourceService', () => {
  let service: InstanceType<typeof BaseService>;
  let repo: ReturnType<typeof createMockRepo>;

  beforeEach(() => {
    repo = createMockRepo();
    service = new (BaseService as any)(repo);
  });

  describe('create()', () => {
    it('saves entity via repo', async () => {
      repo.save.mockResolvedValue({ id: 1, title: 'Hello', title2: 'x' });
      const result = await service.create({ title: 'Hello', title2: 'x' });
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, title: 'Hello', title2: 'x' });
    });

    it('calls lifecycle hooks', async () => {
      const beforeSpy = jest.spyOn(service, 'onBeforeCreate');
      const afterSpy = jest.spyOn(service, 'onAfterCreate');
      repo.save.mockResolvedValue({ id: 1, title: 'Test', title2: 'x' });

      await service.create({ title: 'Test', title2: 'x' });
      expect(beforeSpy).toHaveBeenCalled();
      expect(afterSpy).toHaveBeenCalled();
    });

    it('validates before saving', async () => {
      // title2 is @Rule.required()
      await expect(service.create({ title: 'Test' })).rejects.toThrow(/title2 is required/);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('list()', () => {
    it('returns paginated results with defaults', async () => {
      repo.findAndCount.mockResolvedValue([[{ id: 1, title: 'A', status: 'pub', body: 'text' }], 1]);

      const result = await service.list({});
      expect(repo.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: {},
        skip: 0,
        take: 10,
      });
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(1);
    });

    it('applies pagination skip/take', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.list({ page: { current: 3, size: 5 } });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 })
      );
    });

    it('applies sort order', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.list({ sort: { field: 'title', order: 'desc' } });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { title: 'DESC' } })
      );
    });

    it('filters only searchable fields', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.list({
        filters: { title: 'hello', body: 'ignored', status: 'active' } as any,
      });

      const callArgs = repo.findAndCount.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('title', 'hello');
      expect(callArgs.where).toHaveProperty('status', 'active');
      // body is not searchable, should be excluded
      expect(callArgs.where).not.toHaveProperty('body');
    });

    it('applies FilterValue with like operator', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.list({
        filters: { title: { op: 'like', value: 'test' } } as any,
      });

      const callArgs = repo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.title).toEqual({ _type: 'like', _value: '%test%' });
    });

    it('applies FilterValue with lt operator', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.list({
        filters: { title: { op: 'lt', value: 10 } } as any,
      });

      const callArgs = repo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.title).toEqual({ _type: 'lessThan', _value: 10 });
    });

    it('applies FilterValue with gt operator', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.list({
        filters: { title: { op: 'gt', value: 5 } } as any,
      });

      const callArgs = repo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.title).toEqual({ _type: 'moreThan', _value: 5 });
    });

    it('applies FilterValue with in operator', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.list({
        filters: { status: { op: 'in', value: ['a', 'b'] } } as any,
      });

      const callArgs = repo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.status).toEqual({ _type: 'in', _value: ['a', 'b'] });
    });

    it('applies FilterValue with between operator', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.list({
        filters: { title: { op: 'between', value: [1, 10] } } as any,
      });

      const callArgs = repo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.title).toEqual({ _type: 'between', _value: [1, 10] });
    });

    it('applies FilterValue with ne operator', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.list({
        filters: { status: { op: 'ne', value: 'draft' } } as any,
      });

      const callArgs = repo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.status).toEqual({ _type: 'not', _value: 'draft' });
    });

    it('applies filterForView to strip hidden fields from list', async () => {
      repo.findAndCount.mockResolvedValue([
        [{ id: 1, title: 'A', status: 'pub', body: 'secret body', internal: 'tok' }],
        1,
      ]);

      const result = await service.list({});
      // body is @Hidden('list'), internal is @Ignore
      expect(result.data[0]).not.toHaveProperty('body');
      expect(result.data[0]).not.toHaveProperty('internal');
      expect(result.data[0]).toHaveProperty('title');
    });
  });

  describe('get()', () => {
    it('returns entity by id', async () => {
      repo.findOne.mockResolvedValue({ id: 1, title: 'Test', status: 'pub', body: 'hello' });
      const result = await service.get(1);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toHaveProperty('title', 'Test');
    });

    it('returns null when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.get(999);
      expect(result).toBeNull();
    });

    it('applies filterForView for get view', async () => {
      repo.findOne.mockResolvedValue({ id: 1, title: 'Test', body: 'content', internal: 'tok' });
      const result = await service.get(1);
      // body is only hidden from list, should show in get
      expect(result).toHaveProperty('body');
      // internal is @Ignore, should not show
      expect(result).not.toHaveProperty('internal');
    });
  });

  describe('update()', () => {
    it('updates entity and returns it', async () => {
      repo.findOne.mockResolvedValue({ id: 1, title: 'Updated', status: 'pub' });
      const result = await service.update(1, { title: 'Updated' });
      expect(repo.update).toHaveBeenCalledWith(1, { title: 'Updated' });
      expect(result).toHaveProperty('title', 'Updated');
    });

    it('throws when record not found after update', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update(1, { title: 'X' })).rejects.toThrow('Record 1 not found');
    });

    it('calls lifecycle hooks', async () => {
      repo.findOne.mockResolvedValue({ id: 1, title: 'U' });
      const beforeSpy = jest.spyOn(service, 'onBeforeUpdate');
      const afterSpy = jest.spyOn(service, 'onAfterUpdate');
      await service.update(1, { title: 'U' });
      expect(beforeSpy).toHaveBeenCalledWith(1, { title: 'U' });
      expect(afterSpy).toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('calls repo.delete for hard delete', async () => {
      await service.remove(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('calls repo.softDelete when soft delete is enabled', async () => {
      repo.manager.connection.getMetadata.mockReturnValue({
        deleteDateColumn: { propertyName: 'deletedAt' },
      });

      await service.remove(1);
      expect(repo.softDelete).toHaveBeenCalledWith(1);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('calls lifecycle hooks', async () => {
      const beforeSpy = jest.spyOn(service, 'onBeforeRemove');
      const afterSpy = jest.spyOn(service, 'onAfterRemove');
      await service.remove(1);
      expect(beforeSpy).toHaveBeenCalledWith(1);
      expect(afterSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('isSoftDelete()', () => {
    it('returns false when no deleteDateColumn', () => {
      expect(service.isSoftDelete()).toBe(false);
    });

    it('returns true when deleteDateColumn exists', () => {
      repo.manager.connection.getMetadata.mockReturnValue({
        deleteDateColumn: { propertyName: 'deletedAt' },
      });
      expect(service.isSoftDelete()).toBe(true);
    });
  });
});
