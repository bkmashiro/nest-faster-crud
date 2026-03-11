import { DynamicModule, Module, Type } from '@nestjs/common';
import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Float,
  ObjectType,
  Field,
  InputType,
} from '@nestjs/graphql';
import { getFieldsMeta, getResourceMeta } from '@faster-crud/core';
import type { FieldMeta, PageQuery, PageResult } from '@faster-crud/core';

/* ------------------------------------------------------------------ */
/*  Helpers – map core field types to GraphQL scalars                  */
/* ------------------------------------------------------------------ */

function gqlScalar(field: FieldMeta): () => any {
  switch (field.type) {
    case 'Number':
      return () => (Number.isInteger as any) ? Int : Float;
    case 'Boolean':
      return () => Boolean;
    case 'String':
    default:
      return () => String;
  }
}

function gqlScalarResolved(field: FieldMeta): any {
  switch (field.type) {
    case 'Number':
      return Int;
    case 'Boolean':
      return Boolean;
    case 'String':
    default:
      return String;
  }
}

/* ------------------------------------------------------------------ */
/*  Dynamic GraphQL type builders                                     */
/* ------------------------------------------------------------------ */

const typeCache = new Map<string, Type>();

function buildObjectType(Entity: Function): Type {
  const key = `${Entity.name}GqlType`;
  if (typeCache.has(key)) return typeCache.get(key)!;

  const fields = getFieldsMeta(Entity);

  @ObjectType(Entity.name)
  class GqlType {}

  for (const [name, meta] of Object.entries(fields)) {
    if (meta.ignore) continue;
    const scalar = gqlScalarResolved(meta);
    Field(() => scalar, { nullable: true })(GqlType.prototype, name);
    Reflect.defineMetadata('design:type', scalar === Int || scalar === Float ? Number : scalar, GqlType.prototype, name);
  }

  // Always expose an id field
  if (!fields['id']) {
    Field(() => Int)(GqlType.prototype, 'id');
  }

  typeCache.set(key, GqlType as Type);
  return GqlType as Type;
}

function buildPageResultType(Entity: Function): Type {
  const GqlType = buildObjectType(Entity);
  const key = `${Entity.name}PageResult`;
  if (typeCache.has(key)) return typeCache.get(key)!;

  @ObjectType(key)
  class PageResultType {
    @Field(() => [GqlType])
    data!: any[];

    @Field(() => Int)
    total!: number;

    @Field(() => Int)
    page!: number;

    @Field(() => Int)
    size!: number;
  }

  typeCache.set(key, PageResultType as Type);
  return PageResultType as Type;
}

function buildCreateDtoType(Entity: Function): Type {
  const key = `Create${Entity.name}Input`;
  if (typeCache.has(key)) return typeCache.get(key)!;

  const fields = getFieldsMeta(Entity);

  @InputType(key)
  class CreateInput {}

  for (const [name, meta] of Object.entries(fields)) {
    if (meta.ignore) continue;
    if (meta.deny?.includes('create') || meta.readonly) continue;
    if (name === 'id') continue;
    const scalar = gqlScalarResolved(meta);
    Field(() => scalar, { nullable: true })(CreateInput.prototype, name);
  }

  typeCache.set(key, CreateInput as Type);
  return CreateInput as Type;
}

function buildUpdateDtoType(Entity: Function): Type {
  const key = `Update${Entity.name}Input`;
  if (typeCache.has(key)) return typeCache.get(key)!;

  const fields = getFieldsMeta(Entity);

  @InputType(key)
  class UpdateInput {}

  for (const [name, meta] of Object.entries(fields)) {
    if (meta.ignore) continue;
    if (meta.deny?.includes('update') || meta.readonly) continue;
    if (name === 'id') continue;
    const scalar = gqlScalarResolved(meta);
    Field(() => scalar, { nullable: true })(UpdateInput.prototype, name);
  }

  typeCache.set(key, UpdateInput as Type);
  return UpdateInput as Type;
}

function buildPageQueryInput(Entity: Function): Type {
  const key = `${Entity.name}PageQueryInput`;
  if (typeCache.has(key)) return typeCache.get(key)!;

  @InputType(key)
  class PageQueryInput {
    @Field(() => Int, { nullable: true, defaultValue: 1 })
    page?: number;

    @Field(() => Int, { nullable: true, defaultValue: 20 })
    size?: number;

    @Field(() => String, { nullable: true })
    sortField?: string;

    @Field(() => String, { nullable: true })
    sortOrder?: string;
  }

  typeCache.set(key, PageQueryInput as Type);
  return PageQueryInput as Type;
}

/* ------------------------------------------------------------------ */
/*  Service interface                                                  */
/* ------------------------------------------------------------------ */

export interface ICrudService<T = any> {
  create(dto: Partial<T>): Promise<T>;
  list(query: PageQuery<T>): Promise<PageResult<T>>;
  get(id: number): Promise<T | null>;
  update(id: number, dto: Partial<T>): Promise<T>;
  remove(id: number): Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  CrudResolver factory                                              */
/* ------------------------------------------------------------------ */

export function CrudResolver<T>(Entity: Function, Service: Type<ICrudService<T>>): Type {
  const resourceMeta = getResourceMeta(Entity);
  const ops = resourceMeta?.operations ?? ['create', 'list', 'get', 'update', 'remove'];
  const entityName = resourceMeta?.name ?? Entity.name;

  const GqlType = buildObjectType(Entity);
  const PageResult = buildPageResultType(Entity);
  const CreateDto = buildCreateDtoType(Entity);
  const UpdateDto = buildUpdateDtoType(Entity);
  const PageQueryInputType = buildPageQueryInput(Entity);

  const listName = `${entityName}List`;
  const getName = entityName;
  const createName = `create${entityName.charAt(0).toUpperCase()}${entityName.slice(1)}`;
  const updateName = `update${entityName.charAt(0).toUpperCase()}${entityName.slice(1)}`;
  const removeName = `remove${entityName.charAt(0).toUpperCase()}${entityName.slice(1)}`;

  @Resolver(() => GqlType)
  class GqlResolver {
    constructor(private readonly service: ICrudService<T>) {}
  }

  // Inject the service
  Reflect.defineMetadata('design:paramtypes', [Service], GqlResolver);

  /* -- list -------------------------------------------------------- */
  if (ops.includes('list')) {
    GqlResolver.prototype[listName] = async function (query: any) {
      const pageQuery: PageQuery<T> = {
        page: { current: query?.page ?? 1, size: query?.size ?? 20 },
      };
      if (query?.sortField) {
        pageQuery.sort = { field: query.sortField as keyof T, order: (query.sortOrder as any) ?? 'asc' };
      }
      return this.service.list(pageQuery);
    };
    Query(() => PageResult, { name: listName })(GqlResolver.prototype, listName, Object.getOwnPropertyDescriptor(GqlResolver.prototype, listName)!);
    Args('query', { type: () => PageQueryInputType, nullable: true })(GqlResolver.prototype, listName, 0);
  }

  /* -- get --------------------------------------------------------- */
  if (ops.includes('get')) {
    GqlResolver.prototype[getName] = async function (id: number) {
      return this.service.get(id);
    };
    Query(() => GqlType, { name: getName, nullable: true })(GqlResolver.prototype, getName, Object.getOwnPropertyDescriptor(GqlResolver.prototype, getName)!);
    Args('id', { type: () => Int })(GqlResolver.prototype, getName, 0);
  }

  /* -- create ------------------------------------------------------ */
  if (ops.includes('create')) {
    GqlResolver.prototype[createName] = async function (dto: any) {
      return this.service.create(dto);
    };
    Mutation(() => GqlType, { name: createName })(GqlResolver.prototype, createName, Object.getOwnPropertyDescriptor(GqlResolver.prototype, createName)!);
    Args('dto', { type: () => CreateDto })(GqlResolver.prototype, createName, 0);
  }

  /* -- update ------------------------------------------------------ */
  if (ops.includes('update')) {
    GqlResolver.prototype[updateName] = async function (id: number, dto: any) {
      return this.service.update(id, dto);
    };
    Mutation(() => GqlType, { name: updateName })(GqlResolver.prototype, updateName, Object.getOwnPropertyDescriptor(GqlResolver.prototype, updateName)!);
    Args('id', { type: () => Int })(GqlResolver.prototype, updateName, 0);
    Args('dto', { type: () => UpdateDto })(GqlResolver.prototype, updateName, 1);
  }

  /* -- remove ------------------------------------------------------ */
  if (ops.includes('remove')) {
    GqlResolver.prototype[removeName] = async function (id: number) {
      await this.service.remove(id);
      return true;
    };
    Mutation(() => Boolean, { name: removeName })(GqlResolver.prototype, removeName, Object.getOwnPropertyDescriptor(GqlResolver.prototype, removeName)!);
    Args('id', { type: () => Int })(GqlResolver.prototype, removeName, 0);
  }

  return GqlResolver;
}

/* ------------------------------------------------------------------ */
/*  GraphQLCrudModule                                                 */
/* ------------------------------------------------------------------ */

export interface GraphQLCrudRegistration {
  entity: Function;
  service: Type;
}

@Module({})
export class GraphQLCrudModule {
  static register(entity: Function, service: Type): DynamicModule;
  static register(registrations: GraphQLCrudRegistration[]): DynamicModule;
  static register(entityOrRegs: Function | GraphQLCrudRegistration[], service?: Type): DynamicModule {
    const regs: GraphQLCrudRegistration[] = Array.isArray(entityOrRegs)
      ? entityOrRegs
      : [{ entity: entityOrRegs, service: service! }];

    const resolvers = regs.map((r) => CrudResolver(r.entity, r.service as Type<ICrudService>));

    return {
      module: GraphQLCrudModule,
      providers: [...regs.map((r) => r.service), ...resolvers],
      exports: resolvers,
    };
  }
}
