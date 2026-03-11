import 'reflect-metadata';
import { Col, Resource } from '@faster-crud/core';
import { CrudResolver, GraphQLCrudModule, ICrudService } from '../index';

// ---------------------------------------------------------------------------
// Test Entity
// ---------------------------------------------------------------------------

@Resource('items', { operations: ['create', 'list', 'get', 'update', 'remove'] })
class Item {
  id!: number;

  @Col({ label: 'Name' })
  name!: string;

  @Col({ label: 'Price' })
  price!: number;
}

// ---------------------------------------------------------------------------
// Mock Service
// ---------------------------------------------------------------------------

class MockItemService implements ICrudService<Item> {
  create = jest.fn(async (dto: Partial<Item>) => ({ id: 1, ...dto } as Item));
  list = jest.fn(async () => ({ data: [{ id: 1, name: 'A', price: 10 }], total: 1, page: 1, size: 20 }));
  get = jest.fn(async (id: number) => ({ id, name: 'A', price: 10 }));
  update = jest.fn(async (id: number, dto: Partial<Item>) => ({ id, ...dto } as Item));
  remove = jest.fn(async () => undefined);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CrudResolver', () => {
  let ResolverClass: any;
  let resolver: any;
  let service: MockItemService;

  beforeEach(() => {
    service = new MockItemService();
    ResolverClass = CrudResolver(Item, MockItemService as any);
    resolver = new ResolverClass(service);
  });

  it('creates a resolver class', () => {
    expect(ResolverClass).toBeDefined();
    expect(typeof ResolverClass).toBe('function');
  });

  it('resolver has list query method', () => {
    expect(typeof resolver.itemsList).toBe('function');
  });

  it('list query calls service.list with page query', async () => {
    const result = await resolver.itemsList({ page: 1, size: 20 });

    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({
        page: { current: 1, size: 20 },
      }),
    );
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
  });

  it('list query handles sortField parameter', async () => {
    await resolver.itemsList({ page: 1, size: 10, sortField: 'name', sortOrder: 'desc' });

    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: { field: 'name', order: 'desc' },
      }),
    );
  });

  it('list query defaults to page 1 / size 20 for null query', async () => {
    await resolver.itemsList(null);

    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({
        page: { current: 1, size: 20 },
      }),
    );
  });

  it('resolver has get query method', () => {
    expect(typeof resolver.items).toBe('function');
  });

  it('get query calls service.get with id', async () => {
    const result = await resolver.items(42);

    expect(service.get).toHaveBeenCalledWith(42);
    expect(result).toHaveProperty('id', 42);
  });

  it('resolver has create mutation method', () => {
    const createName = 'createItems';
    expect(typeof resolver[createName]).toBe('function');
  });

  it('create mutation calls service.create', async () => {
    await resolver.createItems({ name: 'New', price: 99 });

    expect(service.create).toHaveBeenCalledWith({ name: 'New', price: 99 });
  });

  it('resolver has update mutation method', () => {
    const updateName = 'updateItems';
    expect(typeof resolver[updateName]).toBe('function');
  });

  it('update mutation calls service.update with id and dto', async () => {
    await resolver.updateItems(1, { name: 'Updated' });

    expect(service.update).toHaveBeenCalledWith(1, { name: 'Updated' });
  });

  it('resolver has remove mutation method', () => {
    const removeName = 'removeItems';
    expect(typeof resolver[removeName]).toBe('function');
  });

  it('remove mutation calls service.remove and returns true', async () => {
    const result = await resolver.removeItems(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });
});

describe('GraphQLCrudModule', () => {
  it('register with single entity returns DynamicModule', () => {
    const mod = GraphQLCrudModule.register(Item, MockItemService as any);

    expect(mod).toHaveProperty('module', GraphQLCrudModule);
    expect(mod.providers).toBeDefined();
    expect(mod.providers!.length).toBeGreaterThanOrEqual(2);
    expect(mod.exports).toBeDefined();
  });

  it('register with array returns DynamicModule', () => {
    const mod = GraphQLCrudModule.register([
      { entity: Item, service: MockItemService as any },
    ]);

    expect(mod).toHaveProperty('module', GraphQLCrudModule);
    expect(mod.providers!.length).toBeGreaterThanOrEqual(2);
  });
});
