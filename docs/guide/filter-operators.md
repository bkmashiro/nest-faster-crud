# Filter Operators

@faster-crud provides a framework-agnostic filter system that maps to each database adapter's native query syntax.

## Supported Operators

| Operator | Description | Example Value |
|----------|-------------|---------------|
| `eq` | Equals (default) | `5` |
| `ne` | Not equals | `'draft'` |
| `gt` | Greater than | `18` |
| `gte` | Greater than or equal | `18` |
| `lt` | Less than | `100` |
| `lte` | Less than or equal | `50` |
| `like` | Substring match (case-insensitive) | `'john'` |
| `in` | Value in array | `[1, 2, 3]` |
| `between` | Inclusive range | `[10, 100]` |

## Query Format

### Simple equality

Pass a value directly to filter by equality:

```
GET /users?filter[role]=admin
```

### Operator syntax

For other operators, pass an object with `op` and `value`:

```
GET /users?filter[age][op]=gte&filter[age][value]=18
```

### Programmatic usage

When calling the service directly or from a frontend client:

```typescript
const query: PageQuery<User> = {
  page: { current: 1, size: 20 },
  filters: {
    role: 'admin',                          // eq (shorthand)
    age: { op: 'gte', value: 18 },          // gte
    name: { op: 'like', value: 'john' },    // like
    status: { op: 'in', value: ['active', 'pending'] },
    score: { op: 'between', value: [50, 100] },
  },
  sort: { field: 'createdAt', order: 'desc' },
};
```

## Searchable Fields

Only fields decorated with `@Searchable()` are included in filter queries. Other filter keys are silently ignored.

```typescript
@Column()
@Searchable()
username: string;    // ✓ filterable

@Column()
bio: string;         // ✗ filter keys for 'bio' are skipped
```

## Pagination

Every list response includes pagination metadata:

```typescript
interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}
```

The maximum page size is controlled by `@Resource`:

```typescript
@Resource('users', { pagination: { max: 50 } })
```

## Sorting

Pass a `sort` parameter to order results:

```
GET /users?sort[field]=createdAt&sort[order]=desc
```

## Adapter Mappings

Each database adapter translates the generic operators into native syntax:

### TypeORM

| Operator | TypeORM Expression |
|----------|-------------------|
| `eq` | Direct value |
| `ne` | `Not(value)` |
| `lt` | `LessThan(value)` |
| `lte` | `LessThanOrEqual(value)` |
| `gt` | `MoreThan(value)` |
| `gte` | `MoreThanOrEqual(value)` |
| `like` | `Like('%value%')` |
| `in` | `In([...])` |
| `between` | `Between(min, max)` |

### Prisma

| Operator | Prisma Expression |
|----------|------------------|
| `eq` | Direct value |
| `ne` | `{ not: value }` |
| `lt` / `lte` / `gt` / `gte` | `{ lt: value }` etc. |
| `like` | `{ contains: value }` |
| `in` | `{ in: [...] }` |
| `between` | `{ gte: min, lte: max }` |

Prisma also supports `startsWith` and `endsWith` operators.

### Mongoose

| Operator | MongoDB Expression |
|----------|-------------------|
| `eq` | Direct value |
| `ne` | `{ $ne: value }` |
| `lt` / `lte` / `gt` / `gte` | `{ $lt: value }` etc. |
| `like` | `{ $regex: value, $options: 'i' }` |
| `in` | `{ $in: [...] }` |
| `between` | `{ $gte: min, $lte: max }` |

### Drizzle

Operators map directly to Drizzle's query builder functions: `eq()`, `ne()`, `lt()`, `lte()`, `gt()`, `gte()`, `like()`, `inArray()`, `between()`.

### MikroORM

Uses MongoDB-style operators: `$ne`, `$lt`, `$lte`, `$gt`, `$gte`, `$like`, `$in`.
