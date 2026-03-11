import { Injectable } from '@nestjs/common';
import { Repository, Like } from 'typeorm';
import { ResourceService } from '@faster-crud/nest';
import type { PageQuery, PageResult } from '@faster-crud/core';
import { getFieldsMeta } from '@faster-crud/core';

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

    async create(dto: Partial<T>): Promise<T> {
      this.validateCreate(dto);
      const entity = this.repo.create(dto as any);
      return this.repo.save(entity as any) as Promise<T>;
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
          where[key] = typeof value === 'string' ? Like(`%${value}%`) : value;
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
      await this.repo.update(id, dto as any);
      const r = await this.repo.findOne({ where: { id } as any });
      if (!r) throw new Error(`Record ${id} not found`);
      return r;
    }

    async remove(id: number): Promise<void> {
      await this.repo.delete(id);
    }
  }

  return TypeOrmService;
}
