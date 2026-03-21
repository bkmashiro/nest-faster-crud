import { Type } from '@nestjs/common';
import { CacheOperation, getResourceMeta, getFieldsMeta, PageQuery, PageResult } from '@faster-crud/core';

declare function setTimeout(handler: (...args: any[]) => void, timeout?: number): any;
declare function clearTimeout(timeoutId: any): void;

export interface IResourceService<T> {
  create(dto: Partial<T>): Promise<T>;
  list(query: PageQuery<T>): Promise<PageResult<T>>;
  get(id: number): Promise<T | null>;
  update(id: number, dto: Partial<T>): Promise<T>;
  remove(id: number): Promise<void>;
  restore?(id: number): Promise<T | void>;
}

export interface IBaseResourceService<T> extends IResourceService<T> {
  onBeforeCreate(dto: Partial<T>): Promise<Partial<T>>;
  onAfterCreate(entity: T): Promise<void>;
  onBeforeUpdate(id: number, dto: Partial<T>): Promise<Partial<T>>;
  onAfterUpdate(entity: T): Promise<void>;
  onBeforeRemove(id: number): Promise<void>;
  onAfterRemove(id: number): Promise<void>;
  validateCreate(dto: any): void;
  filterForView(record: any, view: 'list' | 'get'): any;
}

export function ResourceService<T>(entity: new(...args: any[]) => T): Type<IBaseResourceService<T>> {
  abstract class Base implements IResourceService<T> {
    protected readonly entityMeta = getResourceMeta(entity as Function);
    protected readonly fieldsMeta = getFieldsMeta(entity as Function);
    private readonly cacheStore = new Map<string, {
      expiresAt: number;
      timeout: any;
      value: unknown;
    }>();

    abstract create(dto: Partial<T>): Promise<T>;
    abstract list(query: PageQuery<T>): Promise<PageResult<T>>;
    abstract get(id: number): Promise<T | null>;
    abstract update(id: number, dto: Partial<T>): Promise<T>;
    abstract remove(id: number): Promise<void>;

    async restore(_id: number): Promise<T | void> {
      throw new Error('Restore is not enabled for this resource');
    }

    async onBeforeCreate(dto: Partial<T>): Promise<Partial<T>> {
      return dto;
    }

    async onAfterCreate(_entity: T): Promise<void> {}

    async onBeforeUpdate(_id: number, dto: Partial<T>): Promise<Partial<T>> {
      return dto;
    }

    async onAfterUpdate(_entity: T): Promise<void> {}

    async onBeforeRemove(_id: number): Promise<void> {}

    async onAfterRemove(_id: number): Promise<void> {}

    protected isSoftDeleteEnabled(): boolean {
      return !!this.entityMeta?.softDelete;
    }

    protected getSoftDeleteField(): string {
      return 'deletedAt';
    }

    protected withSoftDeleteForCreate(dto: Partial<T>): Partial<T> {
      if (!this.isSoftDeleteEnabled() || this.getSoftDeleteField() in (dto ?? {})) {
        return dto;
      }

      return {
        ...dto,
        [this.getSoftDeleteField()]: null,
      } as Partial<T>;
    }

    protected getActiveRecordFilter(): Record<string, null> {
      if (!this.isSoftDeleteEnabled()) {
        return {};
      }

      return {
        [this.getSoftDeleteField()]: null,
      };
    }

    protected async withCache<TResult>(
      operation: CacheOperation,
      params: unknown,
      loader: () => Promise<TResult>,
    ): Promise<TResult> {
      const options = this.entityMeta?.cache;
      if (!options || options.ttl <= 0) {
        return loader();
      }

      const key = options.key?.(operation, params)
        ?? `${operation}:${JSON.stringify(params ?? null)}`;
      const cached = this.cacheStore.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value as TResult;
      }
      if (cached) {
        clearTimeout(cached.timeout);
        this.cacheStore.delete(key);
      }

      const value = await loader();
      const timeout = setTimeout(() => {
        this.cacheStore.delete(key);
      }, options.ttl);
      (timeout as any).unref?.();

      this.cacheStore.set(key, {
        expiresAt: Date.now() + options.ttl,
        timeout,
        value,
      });

      return value;
    }

    protected invalidateCache(): void {
      for (const entry of this.cacheStore.values()) {
        clearTimeout(entry.timeout);
      }
      this.cacheStore.clear();
    }

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
