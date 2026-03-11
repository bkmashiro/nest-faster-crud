import 'reflect-metadata';
import { RESOURCE_META, FIELDS_META } from './tokens';
import { ResourceMeta, FieldMeta } from './types';

export function getResourceMeta(entity: Function): ResourceMeta | undefined {
  return Reflect.getMetadata(RESOURCE_META, entity);
}

export function getFieldsMeta(entity: Function): Record<string, FieldMeta> {
  return Reflect.getMetadata(FIELDS_META, entity.prototype) ?? {};
}
