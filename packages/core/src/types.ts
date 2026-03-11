export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
export type CrudOperation = 'create' | 'list' | 'get' | 'update' | 'remove';
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
  fields: Record<string, FieldMeta>;
}

export type CreateDto<T> = Omit<T, '_meta'>;

export interface PageQuery<T = any> {
  page?: { current: number; size: number };
  filters?: Partial<T>;
  sort?: { field: keyof T; order: 'asc' | 'desc' };
}

export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}
