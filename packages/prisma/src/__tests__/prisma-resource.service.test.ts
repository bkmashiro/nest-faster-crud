import 'reflect-metadata';
import { Col, Hidden, Ignore, Resource, Rule, Searchable } from '@faster-crud/core';
import { PrismaResourceService } from '../index';

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

function createPrismaDelegate() {
  return {
    create: jest.fn(async ({ data }: any) => ({ id: 1, ...data })),
    findMany: jest.fn(async () => []),
    count: jest.fn(async () => 0),
    findUnique: jest.fn(async () => null),
    update: jest.fn(async ({ where, data }: any) => ({ ...where, ...data })),
    delete: jest.fn(async () => ({})),
  };
}

describe('PrismaResourceService', () => {
  const prismaModel = createPrismaDelegate();
  const BaseService = PrismaResourceService(User, prismaModel as any);
  let service: InstanceType<typeof BaseService>;

  beforeEach(() => {
    Object.values(prismaModel).forEach((fn) => fn.mockClear());
    service = new (BaseService as any)();
  });

  it('creates records through prismaModel.create', async () => {
    const result = await service.create({ name: 'Ada', role: 'admin' });

    expect(prismaModel.create).toHaveBeenCalledWith({
      data: { name: 'Ada', role: 'admin' },
    });
    expect(result).toEqual({ id: 1, name: 'Ada', role: 'admin' });
  });

  it('validates create input before persisting', async () => {
    await expect(service.create({ name: 'Ada' })).rejects.toThrow(/role is required/);
    expect(prismaModel.create).not.toHaveBeenCalled();
  });

  it('lists records with pagination, filters, sort, and count', async () => {
    prismaModel.findMany.mockResolvedValue([
      { id: 1, name: 'Ada', age: 32, email: 'ada@example.com', internal: 'x', role: 'admin' },
    ]);
    prismaModel.count.mockResolvedValue(1);

    const result = await service.list({
      page: { current: 2, size: 5 },
      sort: { field: 'name', order: 'desc' },
      filters: {
        name: { op: 'like', value: 'ad' },
        age: { op: 'between', value: [18, 40] },
        email: { op: 'eq', value: 'ignored@example.com' },
      } as any,
    });

    expect(prismaModel.findMany).toHaveBeenCalledWith({
      where: {
        name: { contains: 'ad' },
        age: { gte: 18, lte: 40 },
      },
      orderBy: { name: 'desc' },
      skip: 5,
      take: 5,
    });
    expect(prismaModel.count).toHaveBeenCalledWith({
      where: {
        name: { contains: 'ad' },
        age: { gte: 18, lte: 40 },
      },
    });
    expect(result).toEqual({
      data: [{ id: 1, name: 'Ada', age: 32, role: 'admin' }],
      total: 1,
      page: 2,
      size: 5,
    });
  });

  it('maps scalar and operator filters into prisma where conditions', async () => {
    await service.list({
      filters: {
        name: { op: 'ne', value: 'Ada' },
        age: { op: 'gt', value: 21 },
        role: { op: 'in', value: ['admin', 'user'] },
      } as any,
    });

    expect(prismaModel.findMany).toHaveBeenCalledWith({
      where: {
        name: { not: 'Ada' },
        age: { gt: 21 },
      },
      orderBy: undefined,
      skip: 0,
      take: 10,
    });
  });

  it('gets records through prismaModel.findUnique and filters get view', async () => {
    prismaModel.findUnique.mockResolvedValue({
      id: 1,
      name: 'Ada',
      age: 32,
      email: 'ada@example.com',
      internal: 'secret',
      role: 'admin',
    });

    const result = await service.get(1);

    expect(prismaModel.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual({
      id: 1,
      name: 'Ada',
      age: 32,
      email: 'ada@example.com',
      role: 'admin',
    });
  });

  it('updates records through prismaModel.update', async () => {
    prismaModel.update.mockResolvedValue({ id: 1, name: 'Grace', role: 'admin' });

    const result = await service.update(1, { name: 'Grace' });

    expect(prismaModel.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Grace' },
    });
    expect(result).toEqual({ id: 1, name: 'Grace', role: 'admin' });
  });

  it('removes records through prismaModel.delete', async () => {
    await service.remove(1);
    expect(prismaModel.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
