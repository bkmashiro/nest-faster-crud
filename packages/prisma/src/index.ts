import { Injectable } from '@nestjs/common';
import { getFieldsMeta, type FilterValue, type PageQuery, type PageResult } from '@faster-crud/core';
import { ResourceService } from '@faster-crud/nest';

type PrismaFilterOperator =
  | FilterValue['op']
  | 'contains'
  | 'startsWith'
  | 'endsWith';

type PrismaFilterValue = {
  op: PrismaFilterOperator;
  value: any;
};

type PrismaDelegate<T> = {
  create(args: { data: Partial<T>; include?: Record<string, unknown> }): Promise<T>;
  findMany(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    skip?: number;
    take?: number;
    include?: Record<string, unknown>;
  }): Promise<T[]>;
  count(args: { where?: Record<string, unknown> }): Promise<number>;
  findUnique(args: {
    where: { id: number };
    include?: Record<string, unknown>;
  }): Promise<T | null>;
  findFirst(args: {
    where: Record<string, unknown>;
    include?: Record<string, unknown>;
  }): Promise<T | null>;
  update(args: {
    where: { id: number };
    data: Partial<T>;
    include?: Record<string, unknown>;
  }): Promise<T>;
  delete(args: { where: { id: number } }): Promise<T>;
};

/** Options accepted by PrismaResourceService methods. */
export type PrismaQueryOptions = {
  /**
   * Prisma `include` clause for eager-loading relations.
   *
   * @example
   * ```ts
   * await service.get(1, { include: { posts: true } });
   * await service.list(query, { include: { profile: true } });
   * ```
   */
  include?: Record<string, unknown>;
};

function isFilterValue(value: unknown): value is PrismaFilterValue {
  return typeof value === 'object' && value !== null && 'op' in value && 'value' in value;
}

function buildFilterValue(value: unknown): unknown {
  if (!isFilterValue(value)) {
    return value;
  }

  switch (value.op) {
    case 'ne':
      return { not: value.value };
    case 'lt':
      return { lt: value.value };
    case 'lte':
      return { lte: value.value };
    case 'gt':
      return { gt: value.value };
    case 'gte':
      return { gte: value.value };
    case 'in':
      return { in: Array.isArray(value.value) ? value.value : [value.value] };
    case 'between':
      return Array.isArray(value.value)
        ? { gte: value.value[0], lte: value.value[1] }
        : value.value;
    case 'like':
    case 'contains':
      return { contains: value.value };
    case 'startsWith':
      return { startsWith: value.value };
    case 'endsWith':
      return { endsWith: value.value };
    case 'eq':
    default:
      return value.value;
  }
}

export function PrismaResourceService<T extends { id: number }>(
  Entity: new (...args: any[]) => T,
  prismaModel: PrismaDelegate<T>,
) {
  const Base = ResourceService(Entity) as any;

  @Injectable()
  abstract class PrismaService extends Base {
    async create(dto: Partial<T>, options?: PrismaQueryOptions): Promise<T> {
      const nextDto = await (this as any).onBeforeCreate(dto);
      this.validateCreate(nextDto);
      const created = await prismaModel.create({
        data: this.withSoftDeleteForCreate(nextDto),
        ...(options?.include ? { include: options.include } : {}),
      });
      this.invalidateCache();
      await (this as any).onAfterCreate(created);
      return created;
    }

    async list(query: PageQuery<T>, options?: PrismaQueryOptions): Promise<PageResult<T>> {
      const { page, filters, sort } = query ?? {};
      const current = page?.current ?? 1;
      const size = page?.size ?? 10;
      const fieldsMeta = getFieldsMeta(Entity);
      const where: Record<string, unknown> = {};

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (!fieldsMeta[key]?.searchable) continue;
          where[key] = buildFilterValue(value);
        }
      }

      const orderBy = sort?.field && sort?.order
        ? { [sort.field as string]: sort.order }
        : undefined;

      return this.withCache('list', { query: query ?? {}, options: options ?? {} }, async () => {
        const nextWhere = {
          ...this.getActiveRecordFilter(),
          ...where,
        };

        const [data, total] = await Promise.all([
          prismaModel.findMany({
            where: nextWhere,
            orderBy,
            skip: (current - 1) * size,
            take: size,
            ...(options?.include ? { include: options.include } : {}),
          }),
          prismaModel.count({ where: nextWhere }),
        ]);

        return {
          data: data.map((record) => this.filterForView(record, 'list')),
          total,
          page: current,
          size,
        };
      });
    }

    async get(id: number, options?: PrismaQueryOptions): Promise<T | null> {
      return this.withCache('get', { id, options: options ?? {} }, async () => {
        const record = this.isSoftDeleteEnabled()
          ? await prismaModel.findFirst({
            where: {
              id,
              ...this.getActiveRecordFilter(),
            },
            ...(options?.include ? { include: options.include } : {}),
          })
          : await prismaModel.findUnique({
            where: { id },
            ...(options?.include ? { include: options.include } : {}),
          });
        return record ? this.filterForView(record, 'get') : null;
      });
    }

    async update(id: number, dto: Partial<T>, options?: PrismaQueryOptions): Promise<T> {
      const nextDto = await (this as any).onBeforeUpdate(id, dto);
      const updated = await prismaModel.update({
        where: { id },
        data: nextDto,
        ...(options?.include ? { include: options.include } : {}),
      });
      this.invalidateCache();
      await (this as any).onAfterUpdate(updated);
      return updated;
    }

    async remove(id: number): Promise<void> {
      await (this as any).onBeforeRemove(id);
      if (this.isSoftDeleteEnabled()) {
        await prismaModel.update({
          where: { id },
          data: {
            [this.getSoftDeleteField()]: new Date(),
          } as Partial<T>,
        });
      } else {
        await prismaModel.delete({ where: { id } });
      }
      this.invalidateCache();
      await (this as any).onAfterRemove(id);
    }

    async restore(id: number, options?: PrismaQueryOptions): Promise<T> {
      if (!this.isSoftDeleteEnabled()) {
        throw new Error('Restore is not enabled for this resource');
      }

      const restored = await prismaModel.update({
        where: { id },
        data: {
          [this.getSoftDeleteField()]: null,
        } as Partial<T>,
        ...(options?.include ? { include: options.include } : {}),
      });
      this.invalidateCache();
      return restored;
    }
  }

  return PrismaService;
}
