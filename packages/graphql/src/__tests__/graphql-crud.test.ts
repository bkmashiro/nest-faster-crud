import 'reflect-metadata';
import { Col, Hidden, Resource, Rule, Searchable } from '@faster-crud/core';
import {
  GraphqlCrudFactory,
  GraphqlCrudModule,
  PrismaAdapter,
  TypeOrmAdapter,
} from '../index';

jest.mock('@nestjs/common', () => ({
  DynamicModule: class {},
  Module: () => (target: any) => target,
  Type: class {},
}));

jest.mock('@nestjs/graphql', () => {
  function noopDecorator(..._args: any[]) {
    return (..._targets: any[]) => {};
  }

  return {
    Resolver: () => (target: any) => target,
    Query: () => noopDecorator,
    Mutation: () => noopDecorator,
    Args: () => noopDecorator,
    ObjectType: () => (target: any) => target,
    InputType: () => (target: any) => target,
    Field: () => noopDecorator,
    Int: 'Int',
  };
});

@Resource('users', { operations: ['create', 'list', 'get', 'update', 'remove'] })
class User {
  @Col() id!: number;
  @Searchable() @Col() name!: string;
  @Searchable() @Col() age!: number;
  @Hidden('list') @Col() email!: string;
  @Rule.required() @Col() role!: string;
}

@Resource('posts', {
  operations: ['create', 'list', 'get', 'update', 'remove'],
  softDelete: true,
})
class Post {
  @Col() id!: number;
  @Searchable() @Col() title!: string;
  @Col() deletedAt!: Date | null;
}

class CreateUserDto {
  name!: string;
  age!: number;
  role!: string;
}

class UpdateUserDto {
  name?: string;
}

function createTypeOrmRepo() {
  return {
    create: jest.fn((dto: any) => ({ ...dto })),
    save: jest.fn(async (entity: any) => ({ id: 1, ...entity })),
    findAndCount: jest.fn(async () => [[{ id: 1, name: 'Ada', age: 30, email: 'a@b.com', role: 'admin' }], 1]),
    findOne: jest.fn(async ({ where }: any) => (
      where.id === 42 ? { id: 42, name: 'Ada', age: 30, email: 'a@b.com', role: 'admin' } : null
    )),
    update: jest.fn(async () => ({})),
    delete: jest.fn(async () => ({})),
    softDelete: jest.fn(async () => ({})),
  };
}

function createPrismaDelegate() {
  return {
    create: jest.fn(async ({ data }: any) => ({ id: 1, ...data })),
    findMany: jest.fn(async () => [{ id: 1, name: 'Ada', age: 30, email: 'a@b.com', role: 'admin' }]),
    count: jest.fn(async () => 1),
    findUnique: jest.fn(async () => ({ id: 1, name: 'Ada', age: 30, email: 'a@b.com', role: 'admin' })),
    findFirst: jest.fn(async () => ({ id: 1, title: 'Hello', deletedAt: null })),
    update: jest.fn(async ({ where, data }: any) => ({ ...where, ...data })),
    delete: jest.fn(async () => ({ id: 1 })),
  };
}

describe('GraphqlCrudFactory', () => {
  it('creates CRUD resolver methods with dto overrides', async () => {
    const adapter = {
      create: jest.fn(async (_entity, dto) => ({ id: 1, ...dto })),
      list: jest.fn(async () => ({ data: [], total: 0, page: 1, size: 10 })),
      get: jest.fn(async (_entity, id) => ({ id, name: 'Ada' })),
      update: jest.fn(async (_entity, id, dto) => ({ id, ...dto })),
      remove: jest.fn(async () => undefined),
    };

    const ResolverBase = GraphqlCrudFactory.create({
      entity: User,
      adapter,
      dto: {
        create: CreateUserDto,
        update: UpdateUserDto,
      },
    });

    class UserResolver extends ResolverBase {}

    const resolver = new UserResolver() as any;

    await resolver.users({ page: 2, size: 5, sortField: 'name', sortOrder: 'desc' });
    await resolver.user(42);
    await resolver.createUser({ name: 'Ada', age: 30, role: 'admin' });
    await resolver.updateUser(42, { name: 'Grace' });
    await resolver.deleteUser(42);

    expect(adapter.list).toHaveBeenCalledWith(User, {
      page: { current: 2, size: 5 },
      sort: { field: 'name', order: 'desc' },
    });
    expect(adapter.get).toHaveBeenCalledWith(User, 42);
    expect(adapter.create).toHaveBeenCalledWith(User, { name: 'Ada', age: 30, role: 'admin' });
    expect(adapter.update).toHaveBeenCalledWith(User, 42, { name: 'Grace' });
    expect(adapter.remove).toHaveBeenCalledWith(User, 42);
    expect(Reflect.getMetadata('design:paramtypes', ResolverBase.prototype, 'createUser')).toEqual([CreateUserDto]);
    expect(Reflect.getMetadata('design:paramtypes', ResolverBase.prototype, 'updateUser')).toEqual([Number, UpdateUserDto]);
  });

  it('throws when entity is missing @Resource metadata', () => {
    class PlainEntity {}

    expect(() => GraphqlCrudFactory.create({
      entity: PlainEntity,
      adapter: {} as any,
    })).toThrow('@Resource decorator not found on PlainEntity');
  });
});

describe('TypeOrmAdapter', () => {
  it('creates, lists, gets, updates, and removes records', async () => {
    const repo = createTypeOrmRepo();
    const adapter = new TypeOrmAdapter<User>(repo as any);

    await expect(adapter.create(User, { name: 'Ada', age: 30, role: 'admin' })).resolves.toEqual({
      id: 1,
      name: 'Ada',
      age: 30,
      role: 'admin',
    });

    await expect(adapter.list(User, {
      page: { current: 1, size: 10 },
      sort: { field: 'name', order: 'asc' },
      filters: {
        name: 'Ada',
        email: 'ignored@example.com',
      } as any,
    })).resolves.toEqual({
      data: [{ id: 1, name: 'Ada', age: 30, role: 'admin' }],
      total: 1,
      page: 1,
      size: 10,
    });

    await expect(adapter.get(User, 42)).resolves.toEqual({
      id: 42,
      name: 'Ada',
      age: 30,
      email: 'a@b.com',
      role: 'admin',
    });

    repo.findOne.mockResolvedValueOnce({ id: 42, name: 'Grace', age: 31, email: 'g@b.com', role: 'admin' });
    await expect(adapter.update(User, 42, { name: 'Grace' })).resolves.toEqual({
      id: 42,
      name: 'Grace',
      age: 31,
      email: 'g@b.com',
      role: 'admin',
    });

    await adapter.remove(User, 42);

    expect(repo.findAndCount).toHaveBeenCalledWith({
      where: { name: 'Ada' },
      order: { name: 'ASC' },
      skip: 0,
      take: 10,
    });
    expect(repo.delete).toHaveBeenCalledWith(42);
  });

  it('uses softDelete for soft-delete resources', async () => {
    const repo = createTypeOrmRepo();
    const adapter = new TypeOrmAdapter<Post>(repo as any);

    await adapter.create(Post, { title: 'Hello' } as any);
    await adapter.remove(Post, 1);

    expect(repo.save).toHaveBeenCalledWith({ title: 'Hello', deletedAt: null });
    expect(repo.softDelete).toHaveBeenCalledWith(1);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('validates required fields on create', async () => {
    const adapter = new TypeOrmAdapter<User>(createTypeOrmRepo() as any);

    await expect(adapter.create(User, { name: 'Ada' } as any)).rejects.toThrow(/role is required/);
  });
});

describe('PrismaAdapter', () => {
  it('creates, lists, gets, updates, and deletes records', async () => {
    const delegate = createPrismaDelegate();
    const adapter = new PrismaAdapter<User>(delegate as any);

    await expect(adapter.create(User, { name: 'Ada', age: 30, role: 'admin' })).resolves.toEqual({
      id: 1,
      name: 'Ada',
      age: 30,
      role: 'admin',
    });

    await expect(adapter.list(User, {
      page: { current: 2, size: 5 },
      sort: { field: 'name', order: 'desc' },
      filters: {
        name: { op: 'like', value: 'Ad' },
        email: { op: 'eq', value: 'ignored@example.com' },
      } as any,
    })).resolves.toEqual({
      data: [{ id: 1, name: 'Ada', age: 30, role: 'admin' }],
      total: 1,
      page: 2,
      size: 5,
    });

    await adapter.get(User, 1);
    await adapter.update(User, 1, { name: 'Grace' });
    await adapter.remove(User, 1);

    expect(delegate.findMany).toHaveBeenCalledWith({
      where: { name: { contains: 'Ad' } },
      orderBy: { name: 'desc' },
      skip: 5,
      take: 5,
    });
    expect(delegate.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(delegate.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { name: 'Grace' } });
    expect(delegate.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('uses findFirst and soft delete updates for soft-delete resources', async () => {
    const delegate = createPrismaDelegate();
    const adapter = new PrismaAdapter<Post>(delegate as any);

    await adapter.get(Post, 1);
    await adapter.remove(Post, 1);

    expect(delegate.findFirst).toHaveBeenCalledWith({ where: { id: 1, deletedAt: null } });
    expect(delegate.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { deletedAt: expect.any(Date) },
    });
  });
});

describe('GraphqlCrudModule', () => {
  it('registers generated resolvers as providers', () => {
    const moduleRef = GraphqlCrudModule.register([
      {
        entity: User,
        adapter: {
          create: jest.fn(),
          list: jest.fn(),
          get: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
        },
      },
    ]);

    expect(moduleRef.module).toBe(GraphqlCrudModule);
    expect(moduleRef.providers).toHaveLength(1);
    expect(moduleRef.exports).toHaveLength(1);
  });
});
