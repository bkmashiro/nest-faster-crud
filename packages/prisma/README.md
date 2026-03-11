# @faster-crud/prisma

Prisma adapter for `@faster-crud`.

## Install

```bash
pnpm add @faster-crud/prisma @prisma/client
```

## Usage

```ts
import { PrismaResourceService } from '@faster-crud/prisma';

class UserService extends PrismaResourceService(User, prisma.user) {}
```

`prismaModel` is the Prisma delegate for the resource, for example `prisma.user`.

## Supported operations

- `create(dto)` delegates to `prismaModel.create({ data })`
- `list(query)` delegates to `prismaModel.findMany({ where, orderBy, skip, take })` and `prismaModel.count({ where })`
- `get(id)` delegates to `prismaModel.findUnique({ where: { id } })`
- `update(id, dto)` delegates to `prismaModel.update({ where: { id }, data })`
- `remove(id)` delegates to `prismaModel.delete({ where: { id } })`

## Filter mapping

- `eq` -> scalar equality
- `ne` -> `{ not: value }`
- `lt` -> `{ lt: value }`
- `lte` -> `{ lte: value }`
- `gt` -> `{ gt: value }`
- `gte` -> `{ gte: value }`
- `like` -> `{ contains: value }`
- `in` -> `{ in: values }`
- `between` -> `{ gte: min, lte: max }`
