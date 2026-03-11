import { Injectable } from '@nestjs/common';
import { getFieldsMeta, type FilterValue, type PageQuery, type PageResult } from '@faster-crud/core';
import { ResourceService } from '@faster-crud/nest';
import type { HydratedDocument, Model } from 'mongoose';

type MongooseFilterValue = {
  op: FilterValue['op'];
  value: any;
};

function isFilterValue(value: unknown): value is MongooseFilterValue {
  return typeof value === 'object' && value !== null && 'op' in value && 'value' in value;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
      return {
        $regex: typeof value.value === 'string' ? escapeRegex(value.value) : value.value,
        $options: 'i',
      };
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

export function MongooseResourceService<T extends { id?: unknown }>(
  Entity: new (...args: any[]) => T,
  mongooseModel: Model<T>,
) {
  const Base = ResourceService(Entity);

  @Injectable()
  abstract class MongooseService extends Base {
    async create(dto: Partial<T>): Promise<T> {
      const nextDto = await (this as any).onBeforeCreate(dto);
      this.validateCreate(nextDto);
      const created = await new mongooseModel(nextDto).save();
      await (this as any).onAfterCreate(created);
      return created;
    }

    async list(query: PageQuery<T> = {}): Promise<PageResult<T>> {
      const { page, filters, sort } = query;
      const current = page?.current ?? 1;
      const size = page?.size ?? 10;
      const offset = (current - 1) * size;
      const fieldsMeta = getFieldsMeta(Entity);
      const whereClause: Record<string, unknown> = {};

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (!fieldsMeta[key]?.searchable) continue;
          whereClause[key] = buildFilterValue(value);
        }
      }

      const sortObj = sort?.field && sort?.order
        ? { [sort.field as string]: sort.order === 'asc' ? 1 : -1 }
        : undefined;

      const [data, total] = await Promise.all([
        mongooseModel.find(whereClause).skip(offset).limit(size).sort(sortObj as any).exec(),
        mongooseModel.countDocuments(whereClause).exec(),
      ]);

      return {
        data: data.map((record) => this.filterForView(record as HydratedDocument<T>, 'list')),
        total,
        page: current,
        size,
      };
    }

    async get(id: any): Promise<T | null> {
      const record = await mongooseModel.findById(id).exec();
      return record ? this.filterForView(record as HydratedDocument<T>, 'get') : null;
    }

    async update(id: any, dto: Partial<T>): Promise<T> {
      const nextDto = await (this as any).onBeforeUpdate(id, dto);
      const updated = await mongooseModel.findByIdAndUpdate(id, nextDto, { new: true }).exec();

      if (!updated) {
        throw new Error(`Record ${id} not found`);
      }

      await (this as any).onAfterUpdate(updated);
      return updated;
    }

    async remove(id: any): Promise<void> {
      await (this as any).onBeforeRemove(id);
      await mongooseModel.findByIdAndDelete(id).exec();
      await (this as any).onAfterRemove(id);
    }
  }

  return MongooseService;
}
