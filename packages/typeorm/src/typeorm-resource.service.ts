import { Injectable } from '@nestjs/common';
import {
  Between,
  In,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { ResourceService } from '@faster-crud/nest';
import type { PageQuery, PageResult } from '@faster-crud/core';
import { getFieldsMeta } from '@faster-crud/core';

type FilterValue = {
  op: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'like' | 'in' | 'between';
  value: any;
};

function isFilterValue(value: unknown): value is FilterValue {
  return typeof value === 'object' && value !== null && 'op' in value && 'value' in value;
}

function buildFilterValue(value: unknown): unknown {
  if (!isFilterValue(value)) {
    return value;
  }

  switch (value.op) {
    case 'ne':
      return Not(value.value);
    case 'lt':
      return LessThan(value.value);
    case 'lte':
      return LessThanOrEqual(value.value);
    case 'gt':
      return MoreThan(value.value);
    case 'gte':
      return MoreThanOrEqual(value.value);
    case 'in':
      return In(Array.isArray(value.value) ? value.value : [value.value]);
    case 'between':
      return Between(value.value[0], value.value[1]);
    case 'like':
      return Like(`%${value.value}%`);
    case 'eq':
    default:
      return value.value;
  }
}

export function TypeOrmResourceService<T extends { id: number }>(
  Entity: new (...args: any[]) => T
) {
  const Base = ResourceService(Entity);

  @Injectable()
  abstract class TypeOrmService extends Base {
    public readonly repo: Repository<T>;

    constructor(repo: Repository<T>) {
      super();
      this.repo = repo;
    }

    isSoftDelete(): boolean {
      return !!this.repo.manager.connection.getMetadata(this.repo.target).deleteDateColumn;
    }

    async create(dto: Partial<T>): Promise<T> {
      const nextDto = await (this as any).onBeforeCreate(dto);
      this.validateCreate(nextDto);
      const entity = this.repo.create(nextDto as any);
      const saved = await this.repo.save(entity as any) as T;
      await (this as any).onAfterCreate(saved);
      return saved;
    }

    async list(query: PageQuery<T>): Promise<PageResult<T>> {
      const { page, filters, sort } = query ?? {};
      const current = page?.current ?? 1;
      const size = page?.size ?? 10;

      const fieldsMeta = getFieldsMeta(Entity);
      const where: any = {};
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (!fieldsMeta[key]?.searchable) continue;
          where[key] = buildFilterValue(value);
        }
      }

      const order: any = {};
      if (sort?.field && sort?.order) {
        order[sort.field as string] = sort.order.toUpperCase();
      }

      const [data, total] = await this.repo.findAndCount({
        where,
        order,
        skip: (current - 1) * size,
        take: size,
      });

      return {
        data: data.map(r => this.filterForView(r, 'list')),
        total,
        page: current,
        size,
      };
    }

    async get(id: number): Promise<T | null> {
      const r = await this.repo.findOne({ where: { id } as any });
      return r ? this.filterForView(r, 'get') : null;
    }

    async update(id: number, dto: Partial<T>): Promise<T> {
      const nextDto = await (this as any).onBeforeUpdate(id, dto);
      await this.repo.update(id, nextDto as any);
      const r = await this.repo.findOne({ where: { id } as any });
      if (!r) throw new Error(`Record ${id} not found`);
      await (this as any).onAfterUpdate(r);
      return r;
    }

    async remove(id: number): Promise<void> {
      await (this as any).onBeforeRemove(id);
      if (this.isSoftDelete()) {
        await this.repo.softDelete(id);
      } else {
        await this.repo.delete(id);
      }
      await (this as any).onAfterRemove(id);
    }
  }

  return TypeOrmService;
}
