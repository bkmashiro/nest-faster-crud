import { Injectable } from '@nestjs/common';
import { getFieldsMeta, type FilterValue, type PageQuery, type PageResult } from '@faster-crud/core';
import { ResourceService } from '@faster-crud/nest';
import type { EntityManager, EntityData, FilterQuery } from '@mikro-orm/core';

type MikroOrmFilterValue = FilterValue & {
  value: any;
};

function isFilterValue(value: unknown): value is MikroOrmFilterValue {
  return typeof value === 'object' && value !== null && 'op' in value && 'value' in value;
}

function buildFilterValue(value: unknown): unknown {
  if (!isFilterValue(value)) {
    return value;
  }

  switch (value.op) {
    case 'ne':
      return { $ne: value.value };
    case 'lt':
      return { $lt: value.value };
    case 'lte':
      return { $lte: value.value };
    case 'gt':
      return { $gt: value.value };
    case 'gte':
      return { $gte: value.value };
    case 'like':
      return { $like: `%${value.value}%` };
    case 'in':
      return { $in: Array.isArray(value.value) ? value.value : [value.value] };
    case 'between':
      return Array.isArray(value.value)
        ? { $gte: value.value[0], $lte: value.value[1] }
        : value.value;
    case 'eq':
    default:
      return value.value;
  }
}

export function MikroOrmResourceService<T extends { id: number }>(
  Entity: new (...args: any[]) => T,
  em: EntityManager,
) {
  const Base = ResourceService(Entity);

  @Injectable()
  abstract class MikroOrmService extends Base {
    async create(dto: Partial<T>): Promise<T> {
      const nextDto = await (this as any).onBeforeCreate(dto);
      this.validateCreate(nextDto);
      const entity = em.create(Entity, nextDto as EntityData<T>);
      await em.persistAndFlush(entity);
      await (this as any).onAfterCreate(entity);
      return entity;
    }

    async list(query: PageQuery<T>): Promise<PageResult<T>> {
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

      const [data, total] = await em.findAndCount(
        Entity,
        where as FilterQuery<T>,
        {
          orderBy: orderBy as any,
          limit: size,
          offset: (current - 1) * size,
        },
      );

      return {
        data: data.map((record) => this.filterForView(record, 'list')),
        total,
        page: current,
        size,
      };
    }

    async get(id: number): Promise<T | null> {
      const record = await em.findOne(Entity, { id } as FilterQuery<T>);
      return record ? this.filterForView(record, 'get') : null;
    }

    async update(id: number, dto: Partial<T>): Promise<T> {
      const nextDto = await (this as any).onBeforeUpdate(id, dto);
      const record = await em.findOne(Entity, { id } as FilterQuery<T>);

      if (!record) {
        throw new Error(`Record ${id} not found`);
      }

      em.assign(record, nextDto as EntityData<T>);
      await em.flush();
      await (this as any).onAfterUpdate(record);
      return record;
    }

    async remove(id: number): Promise<void> {
      await (this as any).onBeforeRemove(id);
      const record = await em.findOne(Entity, { id } as FilterQuery<T>);

      if (!record) {
        throw new Error(`Record ${id} not found`);
      }

      await em.removeAndFlush(record);
      await (this as any).onAfterRemove(id);
    }
  }

  return MikroOrmService;
}
