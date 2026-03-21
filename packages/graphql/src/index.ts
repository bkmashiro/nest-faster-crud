import { DynamicModule, Module, Type } from '@nestjs/common';
import {
  Args,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { getFieldsMeta, getResourceMeta } from '@faster-crud/core';
import type { FieldMeta, FilterValue, PageQuery, PageResult } from '@faster-crud/core';

type ClassType<T = any> = Type<T>;

type TypeOrmRepositoryLike<T> = {
  create(dto: Partial<T>): T;
  save(entity: T): Promise<T>;
  findAndCount(args: {
    where?: Record<string, unknown>;
    order?: Record<string, 'ASC' | 'DESC'>;
    skip?: number;
    take?: number;
  }): Promise<[T[], number]>;
  findOne(args: { where: Record<string, unknown> }): Promise<T | null>;
  update(id: number, dto: Partial<T>): Promise<unknown>;
  delete(id: number): Promise<unknown>;
  softDelete?(id: number): Promise<unknown>;
  restore?(id: number): Promise<unknown>;
};

type PrismaDelegateLike<T> = {
  create(args: { data: Partial<T> }): Promise<T>;
  findMany(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    skip?: number;
    take?: number;
  }): Promise<T[]>;
  count(args: { where?: Record<string, unknown> }): Promise<number>;
  findUnique(args: { where: { id: number } }): Promise<T | null>;
  findFirst(args: { where: Record<string, unknown> }): Promise<T | null>;
  update(args: { where: { id: number }; data: Partial<T> }): Promise<T>;
  delete(args: { where: { id: number } }): Promise<T>;
};

export interface GraphqlCrudAdapter<T> {
  create(entity: Function, dto: Partial<T>): Promise<T>;
  list(entity: Function, query: PageQuery<T>): Promise<PageResult<T>>;
  get(entity: Function, id: number): Promise<T | null>;
  update(entity: Function, id: number, dto: Partial<T>): Promise<T>;
  remove(entity: Function, id: number): Promise<void>;
}

function isFilterValue(value: unknown): value is FilterValue {
  return typeof value === 'object' && value !== null && 'op' in value && 'value' in value;
}

function isIntegerField(field: FieldMeta): boolean {
  return ['Number', 'Int', 'Integer'].includes(field.type);
}

function gqlScalarResolved(field: FieldMeta): StringConstructor | BooleanConstructor | typeof Int {
  if (field.type === 'Boolean') {
    return Boolean;
  }
  if (isIntegerField(field)) {
    return Int;
  }
  return String;
}

function toPascalCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (part) => part.toUpperCase())
    .replace(/\s+/g, '');
}

function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal ? `${pascal[0].toLowerCase()}${pascal.slice(1)}` : pascal;
}

function inferListQueryName(entity: Function): string {
  const resourceMeta = getResourceMeta(entity);
  return toCamelCase(resourceMeta?.name ?? `${entity.name}s`);
}

const typeCache = new Map<string, ClassType>();

function buildInputType(
  name: string,
  entity: Function,
  mode: 'create' | 'update',
): ClassType {
  if (typeCache.has(name)) {
    return typeCache.get(name)!;
  }

  const fields = getFieldsMeta(entity);

  @InputType(name)
  class CrudInputType {}

  for (const [fieldName, field] of Object.entries(fields)) {
    if (field.ignore || field.readonly || fieldName === 'id') {
      continue;
    }
    if (field.deny?.includes(mode)) {
      continue;
    }
    Field(() => gqlScalarResolved(field), { nullable: true })(CrudInputType.prototype, fieldName);
  }

  typeCache.set(name, CrudInputType);
  return CrudInputType;
}

function buildListArgsType(entity: Function): ClassType {
  const name = `${entity.name}GraphqlListArgs`;
  if (typeCache.has(name)) {
    return typeCache.get(name)!;
  }

  @InputType(name)
  class ListArgsType {
    @Field(() => Int, { nullable: true, defaultValue: 1 })
    page?: number;

    @Field(() => Int, { nullable: true, defaultValue: 10 })
    size?: number;

    @Field(() => String, { nullable: true })
    sortField?: string;

    @Field(() => String, { nullable: true })
    sortOrder?: 'asc' | 'desc';
  }

  typeCache.set(name, ListArgsType);
  return ListArgsType;
}

function buildPageResultType(entity: Function): ClassType {
  const name = `${entity.name}GraphqlPageResult`;
  if (typeCache.has(name)) {
    return typeCache.get(name)!;
  }

  @ObjectType(name)
  class GraphqlPageResultType {
    @Field(() => [entity as ClassType])
    data!: unknown[];

    @Field(() => Int)
    total!: number;

    @Field(() => Int)
    page!: number;

    @Field(() => Int)
    size!: number;
  }

  typeCache.set(name, GraphqlPageResultType);
  return GraphqlPageResultType;
}

function validateCreate(entity: Function, dto: Record<string, any>): void {
  const fields = getFieldsMeta(entity);
  for (const [fieldName, field] of Object.entries(fields)) {
    if (field.ignore) {
      continue;
    }
    if (field.deny?.includes('create') && fieldName in dto) {
      throw new Error(`Field '${fieldName}' is not allowed on create`);
    }
    if (!field.rules) {
      continue;
    }
    for (const rule of field.rules) {
      if (rule.kind === 'required' && (dto[fieldName] === undefined || dto[fieldName] === null || dto[fieldName] === '')) {
        throw new Error(rule.message ?? `${fieldName} is required`);
      }
    }
  }
}

function filterForView(entity: Function, record: any, view: 'list' | 'get'): any {
  const fields = getFieldsMeta(entity);
  const result: Record<string, unknown> = {};

  for (const [fieldName, field] of Object.entries(fields)) {
    if (field.ignore || field.hidden?.includes(view)) {
      continue;
    }
    result[fieldName] = record[fieldName];
  }

  if (!('id' in result) && record?.id !== undefined) {
    result.id = record.id;
  }

  return result;
}

function isSoftDeleteEnabled(entity: Function): boolean {
  return !!getResourceMeta(entity)?.softDelete;
}

function withSoftDeleteForCreate<T>(entity: Function, dto: Partial<T>): Partial<T> {
  if (!isSoftDeleteEnabled(entity) || 'deletedAt' in (dto ?? {})) {
    return dto;
  }
  return {
    ...dto,
    deletedAt: null,
  } as Partial<T>;
}

function getActiveRecordFilter(entity: Function): Record<string, null> {
  return isSoftDeleteEnabled(entity) ? { deletedAt: null } : {};
}

function mapTypeOrmFilter(value: unknown): unknown {
  if (!isFilterValue(value)) {
    return value;
  }
  switch (value.op) {
    case 'eq':
      return value.value;
    default:
      return value.value;
  }
}

function mapPrismaFilter(value: unknown): unknown {
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
      return { contains: value.value };
    case 'eq':
    default:
      return value.value;
  }
}

export class TypeOrmAdapter<T extends { id: number }> implements GraphqlCrudAdapter<T> {
  constructor(private readonly repository: TypeOrmRepositoryLike<T>) {}

  async create(entity: Function, dto: Partial<T>): Promise<T> {
    validateCreate(entity, dto as Record<string, unknown>);
    const created = this.repository.create(withSoftDeleteForCreate(entity, dto));
    return this.repository.save(created);
  }

  async list(entity: Function, query: PageQuery<T>): Promise<PageResult<T>> {
    const fields = getFieldsMeta(entity);
    const current = query?.page?.current ?? 1;
    const size = query?.page?.size ?? 10;
    const where: Record<string, unknown> = {
      ...getActiveRecordFilter(entity),
    };

    for (const [fieldName, value] of Object.entries(query?.filters ?? {})) {
      if (!fields[fieldName]?.searchable) {
        continue;
      }
      where[fieldName] = mapTypeOrmFilter(value);
    }

    const order = query?.sort?.field && query?.sort?.order
      ? { [query.sort.field as string]: query.sort.order.toUpperCase() as 'ASC' | 'DESC' }
      : {};

    const [data, total] = await this.repository.findAndCount({
      where,
      order,
      skip: (current - 1) * size,
      take: size,
    });

    return {
      data: data.map((record) => filterForView(entity, record, 'list')),
      total,
      page: current,
      size,
    };
  }

  async get(entity: Function, id: number): Promise<T | null> {
    const record = await this.repository.findOne({
      where: {
        id,
        ...getActiveRecordFilter(entity),
      },
    });
    return record ? filterForView(entity, record, 'get') : null;
  }

  async update(_entity: Function, id: number, dto: Partial<T>): Promise<T> {
    await this.repository.update(id, dto);
    const record = await this.repository.findOne({ where: { id } });
    if (!record) {
      throw new Error(`Record ${id} not found`);
    }
    return record;
  }

  async remove(entity: Function, id: number): Promise<void> {
    if (isSoftDeleteEnabled(entity) && this.repository.softDelete) {
      await this.repository.softDelete(id);
      return;
    }
    await this.repository.delete(id);
  }
}

export class PrismaAdapter<T extends { id: number }> implements GraphqlCrudAdapter<T> {
  constructor(private readonly delegate: PrismaDelegateLike<T>) {}

  async create(entity: Function, dto: Partial<T>): Promise<T> {
    validateCreate(entity, dto as Record<string, unknown>);
    return this.delegate.create({
      data: withSoftDeleteForCreate(entity, dto),
    });
  }

  async list(entity: Function, query: PageQuery<T>): Promise<PageResult<T>> {
    const fields = getFieldsMeta(entity);
    const current = query?.page?.current ?? 1;
    const size = query?.page?.size ?? 10;
    const where: Record<string, unknown> = {
      ...getActiveRecordFilter(entity),
    };

    for (const [fieldName, value] of Object.entries(query?.filters ?? {})) {
      if (!fields[fieldName]?.searchable) {
        continue;
      }
      where[fieldName] = mapPrismaFilter(value);
    }

    const orderBy = query?.sort?.field && query?.sort?.order
      ? { [query.sort.field as string]: query.sort.order }
      : undefined;

    const [data, total] = await Promise.all([
      this.delegate.findMany({
        where,
        orderBy,
        skip: (current - 1) * size,
        take: size,
      }),
      this.delegate.count({ where }),
    ]);

    return {
      data: data.map((record) => filterForView(entity, record, 'list')),
      total,
      page: current,
      size,
    };
  }

  async get(entity: Function, id: number): Promise<T | null> {
    const record = isSoftDeleteEnabled(entity)
      ? await this.delegate.findFirst({
        where: {
          id,
          ...getActiveRecordFilter(entity),
        },
      })
      : await this.delegate.findUnique({ where: { id } });

    return record ? filterForView(entity, record, 'get') : null;
  }

  async update(_entity: Function, id: number, dto: Partial<T>): Promise<T> {
    return this.delegate.update({
      where: { id },
      data: dto,
    });
  }

  async remove(entity: Function, id: number): Promise<void> {
    if (isSoftDeleteEnabled(entity)) {
      await this.delegate.update({
        where: { id },
        data: { deletedAt: new Date() } as unknown as Partial<T>,
      });
      return;
    }
    await this.delegate.delete({ where: { id } });
  }
}

export interface GraphqlCrudFactoryOptions<T> {
  entity: ClassType<T>;
  adapter: GraphqlCrudAdapter<T>;
  dto?: {
    create?: ClassType;
    update?: ClassType;
  };
}

export class GraphqlCrudFactory {
  static create<T>(options: GraphqlCrudFactoryOptions<T>): ClassType {
    const { entity, adapter, dto } = options;
    const resourceMeta = getResourceMeta(entity);
    if (!resourceMeta) {
      throw new Error(`@Resource decorator not found on ${entity.name}`);
    }

    const operations = resourceMeta.operations ?? ['create', 'list', 'get', 'update', 'remove'];
    const entityName = entity.name;
    const singularName = toCamelCase(entityName);
    const listName = inferListQueryName(entity);
    const createName = `create${toPascalCase(entityName)}`;
    const updateName = `update${toPascalCase(entityName)}`;
    const deleteName = `delete${toPascalCase(entityName)}`;
    const CreateDto = dto?.create ?? buildInputType(`Create${entityName}Input`, entity, 'create');
    const UpdateDto = dto?.update ?? buildInputType(`Update${entityName}Input`, entity, 'update');
    const ListArgs = buildListArgsType(entity);
    const PageResultType = buildPageResultType(entity);

    @Resolver(() => entity)
    class GraphqlCrudResolver {}

    if (operations.includes('list')) {
      const descriptor: PropertyDescriptor = {
        value: async function (query?: { page?: number; size?: number; sortField?: string; sortOrder?: 'asc' | 'desc' }) {
          const pageQuery: PageQuery<T> = {
            page: {
              current: query?.page ?? 1,
              size: query?.size ?? 10,
            },
          };
          if (query?.sortField && query?.sortOrder) {
            pageQuery.sort = {
              field: query.sortField as keyof T,
              order: query.sortOrder,
            };
          }
          return adapter.list(entity, pageQuery);
        },
        writable: true,
        configurable: true,
      };
      Object.defineProperty(GraphqlCrudResolver.prototype, listName, descriptor);
      Query(() => PageResultType, { name: listName })(GraphqlCrudResolver.prototype, listName, descriptor);
      Args('query', { type: () => ListArgs, nullable: true })(GraphqlCrudResolver.prototype, listName, 0);
    }

    if (operations.includes('get')) {
      const descriptor: PropertyDescriptor = {
        value: async function (id: number) {
          return adapter.get(entity, id);
        },
        writable: true,
        configurable: true,
      };
      Object.defineProperty(GraphqlCrudResolver.prototype, singularName, descriptor);
      Query(() => entity, { name: singularName, nullable: true })(GraphqlCrudResolver.prototype, singularName, descriptor);
      Args('id', { type: () => Int })(GraphqlCrudResolver.prototype, singularName, 0);
    }

    if (operations.includes('create')) {
      const descriptor: PropertyDescriptor = {
        value: async function (input: Partial<T>) {
          return adapter.create(entity, input);
        },
        writable: true,
        configurable: true,
      };
      Object.defineProperty(GraphqlCrudResolver.prototype, createName, descriptor);
      Mutation(() => entity, { name: createName })(GraphqlCrudResolver.prototype, createName, descriptor);
      Args('input', { type: () => CreateDto })(GraphqlCrudResolver.prototype, createName, 0);
      Reflect.defineMetadata('design:paramtypes', [CreateDto], GraphqlCrudResolver.prototype, createName);
    }

    if (operations.includes('update')) {
      const descriptor: PropertyDescriptor = {
        value: async function (id: number, input: Partial<T>) {
          return adapter.update(entity, id, input);
        },
        writable: true,
        configurable: true,
      };
      Object.defineProperty(GraphqlCrudResolver.prototype, updateName, descriptor);
      Mutation(() => entity, { name: updateName })(GraphqlCrudResolver.prototype, updateName, descriptor);
      Args('id', { type: () => Int })(GraphqlCrudResolver.prototype, updateName, 0);
      Args('input', { type: () => UpdateDto })(GraphqlCrudResolver.prototype, updateName, 1);
      Reflect.defineMetadata('design:paramtypes', [Number, UpdateDto], GraphqlCrudResolver.prototype, updateName);
    }

    if (operations.includes('remove')) {
      const descriptor: PropertyDescriptor = {
        value: async function (id: number) {
          await adapter.remove(entity, id);
          return true;
        },
        writable: true,
        configurable: true,
      };
      Object.defineProperty(GraphqlCrudResolver.prototype, deleteName, descriptor);
      Mutation(() => Boolean, { name: deleteName })(GraphqlCrudResolver.prototype, deleteName, descriptor);
      Args('id', { type: () => Int })(GraphqlCrudResolver.prototype, deleteName, 0);
    }

    return GraphqlCrudResolver;
  }
}

export interface GraphqlCrudRegistration<T = any> extends GraphqlCrudFactoryOptions<T> {
  resolver?: ClassType;
}

@Module({})
export class GraphqlCrudModule {
  static register(registrations: GraphqlCrudRegistration[]): DynamicModule {
    const providers = registrations.map((registration) => (
      registration.resolver ?? GraphqlCrudFactory.create(registration)
    ));

    return {
      module: GraphqlCrudModule,
      providers,
      exports: providers,
    };
  }
}

export function CrudResolver<T>(entity: ClassType<T>, adapter: GraphqlCrudAdapter<T>): ClassType {
  return GraphqlCrudFactory.create({ entity, adapter });
}
