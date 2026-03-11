import type { FilterValue, PageQuery, PageResult } from '@faster-crud/core';
import { and, asc, between, count, desc, eq, gt, gte, inArray, like, lt, lte, ne, getTableColumns } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel, Table } from 'drizzle-orm';

type CrudRecord = Record<string, unknown>;

export interface DrizzleCrudService<T extends CrudRecord> {
  create(dto: Partial<T>): Promise<T>;
  list(query: PageQuery<T>): Promise<PageResult<T>>;
  get(id: number): Promise<T | null>;
  update(id: number, dto: Partial<T>): Promise<T>;
  remove(id: number): Promise<void>;
}

type DrizzleDbLike = {
  select: (...args: any[]) => any;
  insert: (table: any) => any;
  update: (table: any) => any;
  delete: (table: any) => any;
};

function isFilterValue(value: unknown): value is FilterValue {
  return typeof value === 'object' && value !== null && 'op' in value && 'value' in value;
}

function buildCondition(column: any, value: unknown) {
  if (!isFilterValue(value)) {
    return eq(column, value);
  }

  switch (value.op) {
    case 'ne':
      return ne(column, value.value);
    case 'lt':
      return lt(column, value.value);
    case 'lte':
      return lte(column, value.value);
    case 'gt':
      return gt(column, value.value);
    case 'gte':
      return gte(column, value.value);
    case 'like':
      return like(column, `%${value.value}%`);
    case 'in':
      return inArray(column, Array.isArray(value.value) ? value.value : [value.value]);
    case 'between': {
      const values = Array.isArray(value.value) ? value.value : [value.value, value.value];
      return between(column, values[0], values[1]);
    }
    case 'eq':
    default:
      return eq(column, value.value);
  }
}

export function drizzleCrudService<
  TEntity extends object,
  TTable extends Table,
  TModel extends CrudRecord = InferSelectModel<TTable>,
  TInsert extends CrudRecord = InferInsertModel<TTable>,
>(
  Entity: new (...args: any[]) => TEntity,
  db: DrizzleDbLike,
  table: TTable
): DrizzleCrudService<TModel> {
  const columns = getTableColumns(table) as Record<string, any>;
  const idColumn = columns.id;

  if (!idColumn) {
    throw new Error(`Table for ${Entity.name || 'resource'} must expose an "id" column`);
  }

  return {
    async create(dto: Partial<TModel>): Promise<TModel> {
      const [created] = await db
        .insert(table)
        .values(dto as unknown as Partial<TInsert>)
        .returning();

      if (!created) {
        throw new Error('Create failed');
      }

      return created;
    },

    async list(query: PageQuery<TModel> = {}): Promise<PageResult<TModel>> {
      const { page, filters, sort } = query;
      const current = page?.current ?? 1;
      const size = page?.size ?? 10;
      const conditions = Object.entries(filters ?? {})
        .map(([key, value]) => {
          const column = columns[key];
          if (!column) return null;
          return buildCondition(column, value);
        })
        .filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      let rowsQuery: any = db.select().from(table);
      if (whereClause) {
        rowsQuery = rowsQuery.where(whereClause);
      }

      if (sort?.field && columns[String(sort.field)]) {
        const sortColumn = columns[String(sort.field)];
        rowsQuery = rowsQuery.orderBy(sort.order === 'desc' ? desc(sortColumn) : asc(sortColumn));
      }

      const data = await rowsQuery.limit(size).offset((current - 1) * size);

      let totalQuery: any = db.select({ total: count() }).from(table);
      if (whereClause) {
        totalQuery = totalQuery.where(whereClause);
      }

      const [{ total } = { total: 0 }] = await totalQuery;

      return {
        data,
        total: Number(total ?? 0),
        page: current,
        size,
      };
    },

    async get(id: number): Promise<TModel | null> {
      const rows = await db.select().from(table).where(eq(idColumn, id)).limit(1);
      return rows[0] ?? null;
    },

    async update(id: number, dto: Partial<TModel>): Promise<TModel> {
      const [updated] = await db
        .update(table)
        .set(dto as unknown as Partial<TInsert>)
        .where(eq(idColumn, id))
        .returning();

      if (!updated) {
        throw new Error(`Record ${id} not found`);
      }

      return updated;
    },

    async remove(id: number): Promise<void> {
      await db.delete(table).where(eq(idColumn, id));
    },
  };
}
