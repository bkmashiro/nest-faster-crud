# @faster-crud/drizzle

Drizzle adapter for `@faster-crud`.

## Install

```bash
pnpm add @faster-crud/drizzle drizzle-orm
```

## Usage

```ts
import { drizzleCrudService } from "@faster-crud/drizzle";

const userService = drizzleCrudService(User, db, schema.users);

// use directly or wrap in a class
```

## Supported operations

- `create(dto)` inserts a row and returns the inserted record
- `list(query)` applies filters, sort, and pagination with the Drizzle query builder
- `get(id)` returns one row by `id`
- `update(id, dto)` updates a row by `id` and returns the updated record
- `remove(id)` deletes a row by `id`

## Filter mapping

- `eq` -> `eq(column, value)`
- `ne` -> `ne(column, value)`
- `lt` -> `lt(column, value)`
- `lte` -> `lte(column, value)`
- `gt` -> `gt(column, value)`
- `gte` -> `gte(column, value)`
- `like` -> `like(column, %value%)`
- `in` -> `inArray(column, values)`
- `between` -> `between(column, min, max)`
