import { drizzleCrudService } from '../index';

// Mock drizzle-orm functions
jest.mock('drizzle-orm', () => {
  const actual: Record<string, any> = {};
  for (const op of ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'like', 'inArray', 'between']) {
    actual[op] = jest.fn((...args: any[]) => ({ _op: op, args }));
  }
  actual.and = jest.fn((...args: any[]) => ({ _op: 'and', args }));
  actual.asc = jest.fn((col: any) => ({ _op: 'asc', col }));
  actual.desc = jest.fn((col: any) => ({ _op: 'desc', col }));
  actual.count = jest.fn(() => 'count_fn');
  actual.getTableColumns = jest.fn(() => ({
    id: { name: 'id' },
    name: { name: 'name' },
    age: { name: 'age' },
  }));
  return actual;
});

class Item {}

const mockTable = { _table: true } as any;

describe('drizzleCrudService', () => {
  let db: any;
  let service: ReturnType<typeof drizzleCrudService>;

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = drizzleCrudService(Item, db, mockTable);
  });

  describe('create', () => {
    it('inserts via db.insert().values().returning()', async () => {
      const chain: any = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([{ id: 1, name: 'Ada', age: 30 }]),
      };
      db.insert.mockReturnValue(chain);

      const result = await service.create({ name: 'Ada', age: 30 } as any);

      expect(db.insert).toHaveBeenCalledWith(mockTable);
      expect(chain.values).toHaveBeenCalledWith({ name: 'Ada', age: 30 });
      expect(result).toEqual({ id: 1, name: 'Ada', age: 30 });
    });
  });

  describe('list', () => {
    it('applies default pagination', async () => {
      const selectChain: any = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([{ id: 1, name: 'Ada', age: 30 }]),
      };
      const countChain: any = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([{ total: 1 }]),
      };
      let callCount = 0;
      db.select.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? selectChain : countChain;
      });

      const result = await service.list({});

      expect(selectChain.limit).toHaveBeenCalledWith(10);
      expect(selectChain.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual({ data: [{ id: 1, name: 'Ada', age: 30 }], total: 1, page: 1, size: 10 });
    });

    it('applies filters using correct drizzle operators', async () => {
      const selectChain: any = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([]),
      };
      const countChain: any = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([{ total: 0 }]),
      };
      let callCount = 0;
      db.select.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? selectChain : countChain;
      });

      const { ne, eq, and } = require('drizzle-orm');

      await service.list({
        filters: { name: { op: 'ne', value: 'Ada' }, age: { op: 'eq', value: 30 } } as any,
      });

      expect(ne).toHaveBeenCalled();
      expect(eq).toHaveBeenCalled();
      expect(and).toHaveBeenCalled();
      expect(selectChain.where).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('fetches by id with limit(1)', async () => {
      const chain: any = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([{ id: 1, name: 'Ada', age: 30 }]),
      };
      db.select.mockReturnValue(chain);

      const result = await service.get(1);

      expect(chain.from).toHaveBeenCalledWith(mockTable);
      expect(chain.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, name: 'Ada', age: 30 });
    });

    it('returns null when not found', async () => {
      const chain: any = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([]),
      };
      db.select.mockReturnValue(chain);

      expect(await service.get(999)).toBeNull();
    });
  });

  describe('update', () => {
    it('updates via db.update().set().where().returning()', async () => {
      const chain: any = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([{ id: 1, name: 'Grace', age: 30 }]),
      };
      db.update.mockReturnValue(chain);

      const result = await service.update(1, { name: 'Grace' } as any);

      expect(db.update).toHaveBeenCalledWith(mockTable);
      expect(chain.set).toHaveBeenCalledWith({ name: 'Grace' });
      expect(result).toEqual({ id: 1, name: 'Grace', age: 30 });
    });

    it('throws when record not found', async () => {
      const chain: any = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([]),
      };
      db.update.mockReturnValue(chain);

      await expect(service.update(999, {} as any)).rejects.toThrow(/not found/);
    });
  });

  describe('remove', () => {
    it('deletes via db.delete().where()', async () => {
      const chain: any = {
        where: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve(undefined),
      };
      db.delete.mockReturnValue(chain);

      await service.remove(1);

      expect(db.delete).toHaveBeenCalledWith(mockTable);
      expect(chain.where).toHaveBeenCalled();
    });
  });

  describe('create error handling', () => {
    it('throws when insert returns empty result', async () => {
      const chain: any = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve([]),
      };
      db.insert.mockReturnValue(chain);

      await expect(service.create({ name: 'Fail' } as any)).rejects.toThrow(/Create failed/);
    });
  });

  describe('table validation', () => {
    it('throws when table has no id column', () => {
      const { getTableColumns } = require('drizzle-orm');
      getTableColumns.mockReturnValueOnce({ name: { name: 'name' } });

      expect(() => drizzleCrudService(Item, db, mockTable)).toThrow(/must expose an "id" column/);
    });
  });
});
