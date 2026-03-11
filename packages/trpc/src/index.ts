import {
  getFieldsMeta,
  getResourceMeta,
  type CrudOperation,
  type FieldMeta,
  type PageQuery,
  type ResourceMeta,
} from '@faster-crud/core';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

const FILTER_OPERATORS = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'like', 'in', 'between'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

type EntityCtor<T extends object> = new () => T;

export interface CrudService<T extends object, TListResult = unknown> {
  create(dto: Partial<T>): Promise<T>;
  list(query: PageQuery<T>): Promise<TListResult>;
  get(id: number): Promise<T | null>;
  update(id: number, dto: Partial<T>): Promise<T>;
  remove(id: number): Promise<void>;
}

export function createCrudRouter<T extends object>(
  Entity: EntityCtor<T>,
  service: CrudService<T>,
) {
  const resourceMeta = getResourceMeta(Entity);

  if (!resourceMeta) {
    throw new Error('@Resource not found');
  }

  const fields = getFieldsMeta(Entity);

  return createCrudRouterFromMeta<T>(
    {
      ...resourceMeta,
      fields: Object.keys(fields).length > 0 ? fields : resourceMeta.fields,
    },
    service,
  );
}

export function createCrudRouterFromMeta<T extends object>(
  meta: ResourceMeta,
  service: CrudService<T>,
) {
  const fields = meta.fields ?? {};
  const pageQuerySchema = createPageQuerySchema(fields);
  const createDtoSchema = createDtoSchemaForOperation(fields, 'create');
  const updateFieldsSchema = createDtoSchemaForOperation(fields, 'update');
  const updateDtoSchema = z.object({
    id: z.number(),
    ...updateFieldsSchema.shape,
  });

  return t.router({
    ...(meta.operations.includes('list')
      ? {
          list: t.procedure
            .input(pageQuerySchema)
            .query(({ input }) => service.list(input as PageQuery<T>)),
        }
      : {}),
    ...(meta.operations.includes('get')
      ? {
          get: t.procedure
            .input(z.object({ id: z.number() }))
            .query(({ input }) => service.get(input.id)),
        }
      : {}),
    ...(meta.operations.includes('create')
      ? {
          create: t.procedure
            .input(createDtoSchema)
            .mutation(({ input }) => service.create(input as Partial<T>)),
        }
      : {}),
    ...(meta.operations.includes('update')
      ? {
          update: t.procedure
            .input(updateDtoSchema)
            .mutation(({ input }) => {
              const { id, ...dto } = input;
              return service.update(id, dto as Partial<T>);
            }),
        }
      : {}),
    ...(meta.operations.includes('remove')
      ? {
          remove: t.procedure
            .input(z.object({ id: z.number() }))
            .mutation(({ input }) => service.remove(input.id)),
        }
      : {}),
  });
}

function createPageQuerySchema(fields: Record<string, FieldMeta>) {
  const filterShape = Object.fromEntries(
    Object.entries(fields)
      .filter(([, field]) => !field.ignore)
      .map(([key, field]) => {
        const fieldSchema = createFieldSchema(field);
        return [
          key,
          z.union([
            fieldSchema,
            z.object({
              op: z.enum(FILTER_OPERATORS),
              value: z.union([
                fieldSchema,
                z.array(fieldSchema),
                z.tuple([fieldSchema, fieldSchema]),
              ]),
            }),
          ]).optional(),
        ];
      }),
  ) as z.ZodRawShape;

  const sortableFields = Object.keys(fields).filter((key) => !fields[key]?.ignore);

  return z.object({
    page: z
      .object({
        current: z.number().int().positive(),
        size: z.number().int().positive(),
      })
      .optional(),
    filters: z.object(filterShape).partial().optional(),
    sort: createSortSchema(sortableFields).optional(),
  });
}

function createSortSchema(fieldNames: string[]) {
  if (fieldNames.length === 0) {
    return z.object({
      field: z.string(),
      order: z.enum(SORT_ORDERS),
    });
  }

  const [firstField, ...restFields] = fieldNames;

  return z.object({
    field: z.enum([firstField, ...restFields]),
    order: z.enum(SORT_ORDERS),
  });
}

function createDtoSchemaForOperation(
  fields: Record<string, FieldMeta>,
  operation: Extract<CrudOperation, 'create' | 'update'>,
) {
  const shape = Object.fromEntries(
    Object.entries(fields)
      .filter(([key, field]) => shouldIncludeField(key, field, operation))
      .map(([key, field]) => [key, createOperationFieldSchema(field, operation)]),
  ) as z.ZodRawShape;

  return z.object(shape);
}

function shouldIncludeField(
  key: string,
  field: FieldMeta,
  operation: Extract<CrudOperation, 'create' | 'update'>,
) {
  if (field.ignore) {
    return false;
  }

  if (operation === 'update' && key === 'id') {
    return false;
  }

  return !field.deny?.includes(operation);
}

function createOperationFieldSchema(
  field: FieldMeta,
  operation: Extract<CrudOperation, 'create' | 'update'>,
) {
  let schema = createFieldSchema(field);
  schema = applyFieldRules(schema, field);

  const isRequired = operation === 'create' && field.rules?.some((rule) => rule.kind === 'required');
  return isRequired ? schema : schema.optional();
}

function createFieldSchema(field: FieldMeta): z.ZodTypeAny {
  const widget = field.ui?.widget;
  const normalizedType = field.type.toLowerCase();

  if (widget === 'email') {
    return z.string().email();
  }

  if (widget === 'switch' || widget === 'checkbox') {
    return z.boolean();
  }

  if (widget === 'number-input') {
    return z.number();
  }

  switch (normalizedType) {
    case 'number':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'date':
      return z.coerce.date();
    case 'array':
      return z.array(z.unknown());
    case 'object':
    case 'any':
      return z.unknown();
    default:
      return z.string();
  }
}

function applyFieldRules(schema: z.ZodTypeAny, field: FieldMeta): z.ZodTypeAny {
  let nextSchema = schema;

  for (const rule of field.rules ?? []) {
    switch (rule.kind) {
      case 'email':
        if (isStringLikeField(field)) {
          nextSchema = (nextSchema as z.ZodString).email(rule.message);
        }
        break;
      case 'length':
        if (isStringLikeField(field)) {
          if (typeof rule.params?.min === 'number') {
            nextSchema = (nextSchema as z.ZodString).min(rule.params.min, rule.message);
          }
          if (typeof rule.params?.max === 'number') {
            nextSchema = (nextSchema as z.ZodString).max(rule.params.max, rule.message);
          }
        }
        break;
      case 'range':
        if (isNumberLikeField(field)) {
          if (typeof rule.params?.min === 'number') {
            nextSchema = (nextSchema as z.ZodNumber).min(rule.params.min, rule.message);
          }
          if (typeof rule.params?.max === 'number') {
            nextSchema = (nextSchema as z.ZodNumber).max(rule.params.max, rule.message);
          }
        }
        break;
      case 'pattern':
        if (isStringLikeField(field) && typeof rule.params?.source === 'string') {
          nextSchema = (nextSchema as z.ZodString).regex(
            new RegExp(rule.params.source, rule.params.flags ?? ''),
            rule.message,
          );
        }
        break;
      default:
        break;
    }
  }

  return nextSchema;
}

function isStringLikeField(field: FieldMeta) {
  const widget = field.ui?.widget;
  return (
    widget === 'email' ||
    widget === 'password' ||
    widget === 'textarea' ||
    widget === 'select' ||
    widget === 'text' ||
    field.type.toLowerCase() === 'string'
  );
}

function isNumberLikeField(field: FieldMeta) {
  return field.ui?.widget === 'number-input' || field.type.toLowerCase() === 'number';
}
