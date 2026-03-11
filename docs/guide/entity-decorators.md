# Entity Decorators

All decorators are exported from `@faster-crud/core`.

## @Resource

Marks a class as a CRUD resource. The `name` becomes the route path.

```typescript
@Resource('posts')
export class Post { ... }

// With options
@Resource('posts', {
  operations: ['create', 'list', 'get', 'update', 'remove'],
  pagination: { max: 100 },
  guardTokens: [AdminGuard],
})
export class Post { ... }
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `operations` | `CrudOperation[]` | All five | Which CRUD operations to enable |
| `pagination` | `{ max: number }` | `{ max: 100 }` | Maximum page size |
| `guardTokens` | `any[]` | `[]` | Permission guard tokens |

## @Col

Adds metadata to a field for UI rendering and list display.

```typescript
@Col({
  label: 'Email Address',
  ui: {
    widget: 'email',
    placeholder: 'user@example.com',
  },
  list: {
    sortable: true,
    filterable: true,
    width: 200,
  },
})
email: string;
```

### ColOptions

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label for the field |
| `ui.widget` | `UiWidget` | Form widget type |
| `ui.placeholder` | `string` | Input placeholder text |
| `ui.width` | `number` | Form input width |
| `ui.options` | `Record<string, any>` | Extra widget options |
| `list.sortable` | `boolean` | Allow sorting on this column |
| `list.filterable` | `boolean` | Show filter UI for this column |
| `list.width` | `number` | Table column width |

### Available Widgets

`text` | `number-input` | `password` | `email` | `select` | `date-picker` | `textarea` | `switch` | `checkbox`

## @Searchable

Marks a field as searchable. Only `@Searchable()` fields are included when building list query filters.

```typescript
@Column()
@Searchable()
title: string;
```

## @Deny

Prevents a field from being used in specific operations.

```typescript
@Column()
@Deny('create', 'update')   // Cannot be set by clients
createdAt: Date;
```

Valid operations: `'create'` | `'list'` | `'get'` | `'update'` | `'remove'`

## @Readonly

Shorthand for `@Deny('create', 'update')`. The field is visible in responses but cannot be written.

```typescript
@Column()
@Readonly()
createdAt: Date;
```

## @Hidden

Omits the field from specific response views.

```typescript
@Column()
@Hidden('list')          // Included in get, excluded from list
passwordHash: string;

@Column()
@Hidden('list', 'get')   // Never returned to clients
internalNotes: string;
```

## @Ignore

Completely excludes a field from all CRUD operations. Useful for internal fields that should never be exposed.

```typescript
@Column()
@Ignore()
internalToken: string;
```

## @AdminOnly

Marks a field as admin-only for specific operations (future guard enforcement).

```typescript
@Column()
@AdminOnly('update')
role: string;
```

## @Rule

Declarative validation rules. See the [Validation guide](/guide/validation) for full details.

```typescript
@Rule.required('Title is required')
@Rule.length(3, 200, 'Title must be 3-200 characters')
title: string;

@Rule.email()
email: string;

@Rule.range(0, 999)
price: number;

@Rule.pattern(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric')
slug: string;
```

| Rule | Params | Description |
|------|--------|-------------|
| `@Rule.required(msg?)` | — | Field is mandatory |
| `@Rule.length(min, max, msg?)` | `min`, `max` | String length bounds |
| `@Rule.range(min, max, msg?)` | `min`, `max` | Numeric range bounds |
| `@Rule.email(msg?)` | — | Valid email format |
| `@Rule.pattern(regex, msg?)` | `RegExp` | Custom regex match |

## Complete Example

```typescript
import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';
import {
  Resource, Col, Deny, Readonly, Hidden,
  Searchable, Ignore, Rule,
} from '@faster-crud/core';

@Entity()
@Resource('articles', { pagination: { max: 50 } })
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Col({ label: 'Title', ui: { widget: 'text' } })
  @Rule.required()
  @Rule.length(5, 200)
  @Searchable()
  title: string;

  @Column('text')
  @Col({ label: 'Body', ui: { widget: 'textarea' } })
  @Rule.required()
  @Hidden('list')
  body: string;

  @Column()
  @Col({ label: 'Status', ui: { widget: 'select' } })
  status: 'draft' | 'published';

  @Column()
  @Readonly()
  authorId: number;

  @Column()
  @Ignore()
  internalScore: number;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```
