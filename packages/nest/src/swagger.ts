import { CrudOperation, FieldMeta } from '@faster-crud/core';

declare const require: (id: string) => unknown;

type SwaggerModule = {
  ApiOperation: (options: { summary: string }) => MethodDecorator;
  ApiProperty: (options?: Record<string, unknown>) => PropertyDecorator;
  ApiTags: (...tags: string[]) => ClassDecorator;
};

function tryRequireSwagger(): SwaggerModule | null {
  try {
    return require('@nestjs/swagger') as SwaggerModule;
  } catch {
    return null;
  }
}

const swagger = tryRequireSwagger();

const OPERATION_METHODS: Record<CrudOperation, string> = {
  create: 'create',
  list: 'list',
  get: 'get',
  update: 'update',
  remove: 'remove',
};

const OPERATION_SUMMARIES: Record<CrudOperation, string> = {
  create: 'Create resource',
  list: 'List resources',
  get: 'Get resource',
  update: 'Update resource',
  remove: 'Remove resource',
};

const TYPE_MAP: Record<string, Function> = {
  String,
  Number,
  Boolean,
  Date,
  Array,
  Object,
  string: String,
  number: Number,
  boolean: Boolean,
  date: Date,
  array: Array,
  object: Object,
  any: Object,
};

export function isSwaggerAvailable(): boolean {
  return swagger !== null;
}

export function resolveFieldType(fieldMeta: FieldMeta): Function {
  return TYPE_MAP[fieldMeta.type] ?? Object;
}

export function applySwaggerToController(
  cls: Function,
  name: string,
  operations: CrudOperation[],
): void {
  if (!swagger) return;

  swagger.ApiTags(name)(cls as never);

  for (const operation of operations) {
    const methodName = OPERATION_METHODS[operation];
    const descriptor = Object.getOwnPropertyDescriptor(cls.prototype, methodName);
    if (!descriptor) continue;

    swagger.ApiOperation({
      summary: `${OPERATION_SUMMARIES[operation]} ${name}`,
    })(cls.prototype, methodName, descriptor);
  }
}

export function applySwaggerToField(
  target: object,
  key: string,
  fieldMeta: FieldMeta,
): void {
  if (!swagger) return;

  const options: Record<string, unknown> = {
    required: fieldMeta.rules?.some((rule) => rule.kind === 'required') ?? false,
    type: resolveFieldType(fieldMeta),
  };

  if (fieldMeta.label) {
    options.description = fieldMeta.label;
  }

  swagger.ApiProperty(options)(target, key);
}
