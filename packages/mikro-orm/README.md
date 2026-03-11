# @faster-crud/mikro-orm

MikroORM adapter for `@faster-crud`.

## Install

```bash
pnpm add @faster-crud/mikro-orm @mikro-orm/core
```

## Usage

```ts
import { MikroOrmResourceService } from '@faster-crud/mikro-orm';

class UserService extends MikroOrmResourceService(User, em) {}
```

`em` is a MikroORM `EntityManager` instance for the current database connection.

## Supported operations

- `create(dto)` uses `em.create()` and `em.persistAndFlush()`
- `list(query)` uses `em.findAndCount()` with `where`, `orderBy`, `limit`, and `offset`
- `get(id)` uses `em.findOne()`
- `update(id, dto)` uses `em.assign()` and `em.flush()`
- `remove(id)` uses `em.removeAndFlush()`

## Filter mapping

- `eq` -> scalar equality
- `ne` -> `{ $ne: value }`
- `lt` -> `{ $lt: value }`
- `lte` -> `{ $lte: value }`
- `gt` -> `{ $gt: value }`
- `gte` -> `{ $gte: value }`
- `like` -> `{ $like: %value% }`
- `in` -> `{ $in: values }`
- `between` -> `{ $gte: min, $lte: max }`
