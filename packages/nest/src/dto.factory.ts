import 'reflect-metadata';
import { getFieldsMeta, FieldMeta } from '@faster-crud/core';
import { applySwaggerToField, isSwaggerAvailable, resolveFieldType } from './swagger';

declare const require: (id: string) => unknown;

type DtoOperation = 'create' | 'update';

type ValidatorModule = {
  IsEmail: (options?: { message?: string }) => PropertyDecorator;
  IsNotEmpty: (options?: { message?: string }) => PropertyDecorator;
  IsOptional: () => PropertyDecorator;
  MaxLength: (max: number, options?: { message?: string }) => PropertyDecorator;
  Matches: (pattern: RegExp, options?: { message?: string }) => PropertyDecorator;
  MinLength: (min: number, options?: { message?: string }) => PropertyDecorator;
};

function tryRequireClassValidator(): ValidatorModule | null {
  try {
    return require('class-validator') as ValidatorModule;
  } catch {
    return null;
  }
}

const validator = tryRequireClassValidator();
const dtoCache = new WeakMap<Function, Partial<Record<DtoOperation, new() => any>>>();

export function hasClassValidator(): boolean {
  return validator !== null;
}

export function shouldUseDtoMetatype(): boolean {
  return hasClassValidator() || isSwaggerAvailable();
}

export function buildDto(
  Entity: Function,
  operation: DtoOperation,
): new() => Record<string, unknown> {
  const cached = dtoCache.get(Entity)?.[operation];
  if (cached) {
    return cached;
  }

  class DynamicDto {}

  Object.defineProperty(DynamicDto, 'name', {
    value: `${Entity.name}${operation === 'create' ? 'Create' : 'Update'}Dto`,
    configurable: true,
  });

  const fields = getFieldsMeta(Entity);
  for (const [key, fieldMeta] of Object.entries(fields)) {
    if (shouldSkipField(fieldMeta, operation)) continue;

    Object.defineProperty(DynamicDto.prototype, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: undefined,
    });

    Reflect.defineMetadata('design:type', resolveFieldType(fieldMeta), DynamicDto.prototype, key);

    applyValidationDecorators(DynamicDto.prototype, key, fieldMeta);
    applySwaggerToField(DynamicDto.prototype, key, fieldMeta);
  }

  const entityCache = dtoCache.get(Entity) ?? {};
  entityCache[operation] = DynamicDto as new() => Record<string, unknown>;
  dtoCache.set(Entity, entityCache);

  return DynamicDto as new() => Record<string, unknown>;
}

function shouldSkipField(fieldMeta: FieldMeta, operation: DtoOperation): boolean {
  if (fieldMeta.ignore) return true;
  if (fieldMeta.deny?.includes(operation)) return true;
  return false;
}

function applyValidationDecorators(target: object, key: string, fieldMeta: FieldMeta): void {
  if (!validator) return;

  const rules = fieldMeta.rules ?? [];
  const requiredRule = rules.find((rule) => rule.kind === 'required');

  if (requiredRule) {
    validator.IsNotEmpty({ message: requiredRule.message })(target, key);
  } else {
    validator.IsOptional()(target, key);
  }

  for (const rule of rules) {
    switch (rule.kind) {
      case 'email':
        validator.IsEmail({ message: rule.message })(target, key);
        break;
      case 'length':
        if (typeof rule.params?.min === 'number') {
          validator.MinLength(rule.params.min, { message: rule.message })(target, key);
        }
        if (typeof rule.params?.max === 'number') {
          validator.MaxLength(rule.params.max, { message: rule.message })(target, key);
        }
        break;
      case 'pattern':
        if (typeof rule.params?.source === 'string') {
          validator.Matches(
            new RegExp(rule.params.source, rule.params.flags ?? ''),
            { message: rule.message },
          )(target, key);
        }
        break;
      default:
        break;
    }
  }
}
