# @faster-crud/core

[![npm](https://img.shields.io/npm/v/@faster-crud/core?style=flat-square)](https://www.npmjs.com/package/@faster-crud/core)
[![license](https://img.shields.io/npm/l/@faster-crud/core?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)

Zero-dependency core for `@faster-crud` — decorators, types, and metadata utilities shared by all adapters.

## Install

```bash
npm install @faster-crud/core reflect-metadata
```

## Decorators

### `@Resource(name, options?)`

Marks a class as a CRUD resource.

```ts
import { Resource, Col } from '@faster-crud/core';

@Resource('posts', {
  operations: ['create', 'list', 'get', 'update', 'remove'],  // default: all
  pagination: { max: 100 },
})
export class Post {
  @Col({ label: 'Title', ui: { widget: 'text' } })
  title: string;

  @Col({ label: 'Content', ui: { widget: 'textarea' } })
  content: string;

  @Col({ label: 'Published' })
  published: boolean;
}
```

### `@Col(options?)`

Marks a property as a CRUD column. Carries UI hints, validation rules, and list/form display configuration.

```ts
@Col({
  label: 'Email',
  ui: { widget: 'email', placeholder: 'user@example.com' },
  list: { sortable: true, filterable: true },
})
email: string;
```

### `@Deny(...operations)`

Denies specific CRUD operations for a field.

```ts
@Deny('create', 'update')  // field is never writable
createdAt: Date;
```

### `@Readonly()`

Shorthand for `@Deny('create', 'update')`.

```ts
@Readonly()
id: number;
```

### `@Hidden(...contexts)`

Hides a field from list/get responses.

```ts
@Hidden('list', 'get')
passwordHash: string;
```

### `@Searchable()`

Marks a field as full-text searchable.

```ts
@Searchable()
title: string;
```

### `@Rule(kind, params?, message?)`

Attaches a validation rule.

```ts
@Rule('required')
@Rule('length', { min: 3, max: 100 }, 'Title must be 3-100 chars')
title: string;
```

## Types

```ts
// Pagination query from client
interface PageQuery<T> {
  page?: { current: number; size: number };
  filters?: PageFilters<T>;         // per-field filter operators
  sort?: { field: keyof T; order: 'asc' | 'desc' };
}

// Filter operators
type FilterOperator = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'like' | 'in' | 'between';

// Paginated response
interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}
```

## Utilities

```ts
import { getResourceMeta, getFieldsMeta } from '@faster-crud/core';

const meta = getResourceMeta(Post);
// → { name: 'posts', operations: [...], fields: { title: {...}, ... } }
```

## Ecosystem

| Package | Description |
|---------|-------------|
| [`@faster-crud/nest`](https://www.npmjs.com/package/@faster-crud/nest) | NestJS controller factory + module |
| [`@faster-crud/typeorm`](https://www.npmjs.com/package/@faster-crud/typeorm) | TypeORM adapter |
| [`@faster-crud/prisma`](https://www.npmjs.com/package/@faster-crud/prisma) | Prisma adapter |
| [`@faster-crud/drizzle`](https://www.npmjs.com/package/@faster-crud/drizzle) | Drizzle ORM adapter |
| [`@faster-crud/mongoose`](https://www.npmjs.com/package/@faster-crud/mongoose) | Mongoose adapter |
| [`@faster-crud/hono`](https://www.npmjs.com/package/@faster-crud/hono) | Hono adapter |
| [`@faster-crud/express`](https://www.npmjs.com/package/@faster-crud/express) | Express adapter |

> GitHub: [bkmashiro/nest-faster-crud](https://github.com/bkmashiro/nest-faster-crud)
