import 'reflect-metadata';
import { RESOURCE_META, FIELDS_META } from './tokens';
import { ColOptions, FieldMeta, CrudOperation, ResourceMeta } from './types';

// ── @Resource(name, options) ── class decorator ──
export function Resource(
  name: string,
  options: Partial<Omit<ResourceMeta, 'name' | 'fields'>> = {}
): ClassDecorator {
  return (target) => {
    const fields = Reflect.getMetadata(FIELDS_META, target.prototype) ?? {};
    const meta: ResourceMeta = {
      name,
      operations: options.operations ?? ['create', 'list', 'get', 'update', 'remove'],
      guardTokens: options.guardTokens,
      pagination:  options.pagination ?? { max: 100 },
      fields,
    };
    Reflect.defineMetadata(RESOURCE_META, meta, target);
  };
}

// ── @Col(options) ── property decorator ──
export function Col(options: ColOptions = {}): PropertyDecorator {
  return (target, key) => {
    const type = Reflect.getMetadata('design:type', target, key);
    const fields: Record<string, FieldMeta> = Reflect.getMetadata(FIELDS_META, target) ?? {};
    fields[key as string] = {
      ...(fields[key as string] ?? {}),
      key: key as string,
      type: type?.name ?? 'any',
      ...options,
    };
    Reflect.defineMetadata(FIELDS_META, fields, target);
  };
}

// ── @Deny(..operations) ── property decorator ──
export function Deny(...operations: CrudOperation[]): PropertyDecorator {
  return (target, key) => {
    const fields: Record<string, FieldMeta> = Reflect.getMetadata(FIELDS_META, target) ?? {};
    const f = fields[key as string] ?? { key: key as string, type: 'any' };
    f.deny = [...(f.deny ?? []), ...operations];
    fields[key as string] = f;
    Reflect.defineMetadata(FIELDS_META, fields, target);
  };
}

// ── @Readonly() ── shorthand for @Deny('create','update')
export function Readonly(): PropertyDecorator {
  return Deny('create', 'update');
}

// ── @Hidden(..views) ── omit from response
export function Hidden(...views: ('list' | 'get')[]): PropertyDecorator {
  return (target, key) => {
    const fields: Record<string, FieldMeta> = Reflect.getMetadata(FIELDS_META, target) ?? {};
    const f = fields[key as string] ?? { key: key as string, type: 'any' };
    f.hidden = [...(f.hidden ?? []), ...views];
    fields[key as string] = f;
    Reflect.defineMetadata(FIELDS_META, fields, target);
  };
}

// ── @Searchable() ── property decorator ──
export function Searchable(): PropertyDecorator {
  return (target, key) => {
    const fields: Record<string, FieldMeta> = Reflect.getMetadata(FIELDS_META, target) ?? {};
    const f = fields[key as string] ?? { key: key as string, type: 'any' };
    f.searchable = true;
    fields[key as string] = f;
    Reflect.defineMetadata(FIELDS_META, fields, target);
  };
}

// ── @Ignore() ── completely exclude from CRUD
export function Ignore(): PropertyDecorator {
  return (target, key) => {
    const fields: Record<string, FieldMeta> = Reflect.getMetadata(FIELDS_META, target) ?? {};
    const f = fields[key as string] ?? { key: key as string, type: 'any' };
    f.ignore = true;
    fields[key as string] = f;
    Reflect.defineMetadata(FIELDS_META, fields, target);
  };
}

// ── @AdminOnly(..operations) ──
export function AdminOnly(...operations: CrudOperation[]): PropertyDecorator {
  return (target, key) => {
    const fields: Record<string, FieldMeta> = Reflect.getMetadata(FIELDS_META, target) ?? {};
    const f = fields[key as string] ?? { key: key as string, type: 'any' };
    (f as any).adminOnly = operations;
    fields[key as string] = f;
    Reflect.defineMetadata(FIELDS_META, fields, target);
  };
}
