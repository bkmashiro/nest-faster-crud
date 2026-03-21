export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
export type CrudOperation = 'create' | 'list' | 'get' | 'update' | 'remove';
export type CacheOperation = 'list' | 'get';
export type UiWidget =
  | 'text' | 'number-input' | 'password' | 'email'
  | 'select' | 'date-picker' | 'textarea' | 'switch' | 'checkbox';

export interface ColOptions {
  label?: string;
  ui?: {
    widget?: UiWidget;
    placeholder?: string;
    width?: number;
    options?: Record<string, any>;
  };
  list?: {
    sortable?: boolean;
    filterable?: boolean;
    width?: number;
  };
}

export interface FieldMeta extends ColOptions {
  key: string;
  type: string;
  deny?: CrudOperation[];
  readonly?: boolean;
  hidden?: ('list' | 'get')[];
  searchable?: boolean;
  ignore?: boolean;
  rules?: RuleMeta[];
}

export interface RuleMeta {
  kind: 'required' | 'length' | 'range' | 'email' | 'pattern' | 'custom';
  params?: any;
  message?: string;
}

export interface ResourceMeta {
  name: string;
  operations: CrudOperation[];
  guardTokens?: any[];
  pagination?: { max: number };
  softDelete?: boolean;
  cache?: {
    ttl: number;
    key?: (operation: CacheOperation, params: unknown) => string;
  };
  fields: Record<string, FieldMeta>;
}

export type CreateDto<T> = Omit<T, '_meta'>;

export type FilterOperator = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'like' | 'in' | 'between';

export interface FilterValue {
  op: FilterOperator;
  value: any;
}

export type PageFilters<T> = Partial<{
  [K in keyof T]: T[K] | FilterValue;
}>;

export interface PageQuery<T = any> {
  page?: { current: number; size: number };
  filters?: PageFilters<T>;
  sort?: { field: keyof T; order: 'asc' | 'desc' };
}

export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}
