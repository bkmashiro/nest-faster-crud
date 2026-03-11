import { Type } from '@nestjs/common';
import { getResourceMeta, getFieldsMeta, PageQuery, PageResult } from '@faster-crud/core';

export interface IResourceService<T> {
  create(dto: Partial<T>): Promise<T>;
  list(query: PageQuery<T>): Promise<PageResult<T>>;
  get(id: number): Promise<T | null>;
  update(id: number, dto: Partial<T>): Promise<T>;
  remove(id: number): Promise<void>;
}

export interface IBaseResourceService<T> extends IResourceService<T> {
  validateCreate(dto: any): void;
  filterForView(record: any, view: 'list' | 'get'): any;
}

export function ResourceService<T>(entity: new(...args: any[]) => T): Type<IBaseResourceService<T>> {
  abstract class Base implements IResourceService<T> {
    protected readonly entityMeta = getResourceMeta(entity as Function);
    protected readonly fieldsMeta = getFieldsMeta(entity as Function);

    abstract create(dto: Partial<T>): Promise<T>;
    abstract list(query: PageQuery<T>): Promise<PageResult<T>>;
    abstract get(id: number): Promise<T | null>;
    abstract update(id: number, dto: Partial<T>): Promise<T>;
    abstract remove(id: number): Promise<void>;

    protected validateCreate(dto: any): void {
      for (const [key, field] of Object.entries(this.fieldsMeta)) {
        if (field.ignore) continue;
        if (field.deny?.includes('create') && key in dto) {
          throw new Error(`Field '${key}' is not allowed on create`);
        }
        if (field.rules) {
          for (const rule of field.rules) {
            this.applyRule(rule, key, dto[key]);
          }
        }
      }
    }

    protected filterForView(record: any, view: 'list' | 'get'): any {
      const result: any = {};
      for (const [key, field] of Object.entries(this.fieldsMeta)) {
        if (field.ignore) continue;
        if (field.hidden?.includes(view)) continue;
        result[key] = record[key];
      }
      return result;
    }

    private applyRule(rule: any, key: string, value: any): void {
      if (rule.kind === 'required' && (value === undefined || value === null || value === '')) {
        throw new Error(rule.message ?? `${key} is required`);
      }
      if (rule.kind === 'length' && typeof value === 'string') {
        if (value.length < rule.params.min || value.length > rule.params.max) {
          throw new Error(rule.message ?? `${key} must be between ${rule.params.min} and ${rule.params.max} characters`);
        }
      }
      if (rule.kind === 'range' && typeof value === 'number') {
        if (value < rule.params.min || value > rule.params.max) {
          throw new Error(rule.message ?? `${key} must be between ${rule.params.min} and ${rule.params.max}`);
        }
      }
      if (rule.kind === 'email' && typeof value === 'string') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error(rule.message ?? `${key} must be a valid email`);
        }
      }
    }
  }

  return Base as unknown as Type<IBaseResourceService<T>>;
}
