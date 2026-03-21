# @faster-crud/prisma

[![npm](https://img.shields.io/npm/v/@faster-crud/prisma?style=flat-square)](https://www.npmjs.com/package/@faster-crud/prisma)
[![npm downloads](https://img.shields.io/npm/dm/@faster-crud/prisma?style=flat-square)](https://www.npmjs.com/package/@faster-crud/prisma)
[![license](https://img.shields.io/npm/l/@faster-crud/prisma?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Prisma adapter for [@faster-crud](https://github.com/bkmashiro/nest-faster-crud).

## Install

```bash
npm install @faster-crud/core @faster-crud/nest @faster-crud/prisma @prisma/client
```

## Quick Start

### 1. Define your entity

```ts
import { Col, Resource, Searchable, Rule } from '@faster-crud/core';

@Resource('users')
export class User {
  @Col() id!: number;
  @Searchable() @Col() name!: string;
  @Searchable() @Col() email!: string;
  @Rule.required() @Col() role!: string;
}
```

### 2. Create the service

Pass the entity class and the matching Prisma model delegate to `PrismaResourceService`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaResourceService } from '@faster-crud/prisma';
import { User } from './user.entity';

const prisma = new PrismaClient();

@Injectable()
export class UsersService extends PrismaResourceService(User, prisma.user) {}
```

### 3. Use in a controller (or with `@faster-crud/nest`)

```ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: any) {
    return this.users.create(dto);
  }

  @Get()
  list(@Query() query: any) {
    return this.users.list(query);
  }

  @Get(':id')
  get(@Param('id') id: number) {
    return this.users.get(+id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: any) {
    return this.users.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.users.remove(+id);
  }
}
```

## Relation queries (include)

All read and write methods accept an optional second/third argument with an `include` key that is forwarded directly to Prisma:

```ts
// Eager-load posts when fetching a user
const user = await usersService.get(1, { include: { posts: true } });

// Include profile in list results
const page = await usersService.list(
  { page: { current: 1, size: 20 } },
  { include: { profile: true } },
);

// Return related posts after creating a user
const created = await usersService.create(
  { name: 'Ada', role: 'admin' },
  { include: { posts: true } },
);

// Return related data after update
const updated = await usersService.update(
  1,
  { name: 'Ada Lovelace' },
  { include: { posts: true } },
);
```

## Filtering

Filters use the `{ op, value }` shape on `@Searchable()` fields:

| `op`         | Prisma equivalent              |
|--------------|-------------------------------|
| `eq`         | `field: value`                |
| `ne`         | `field: { not: value }`       |
| `lt`         | `field: { lt: value }`        |
| `lte`        | `field: { lte: value }`       |
| `gt`         | `field: { gt: value }`        |
| `gte`        | `field: { gte: value }`       |
| `in`         | `field: { in: [...] }`        |
| `between`    | `field: { gte: a, lte: b }`   |
| `like`       | `field: { contains: value }`  |
| `contains`   | `field: { contains: value }`  |
| `startsWith` | `field: { startsWith: value }`|
| `endsWith`   | `field: { endsWith: value }`  |

Only fields decorated with `@Searchable()` are included in the `where` clause — all others are silently ignored.

## Pagination & sorting

```ts
await usersService.list({
  page: { current: 2, size: 25 },
  sort: { field: 'name', order: 'asc' },
  filters: {
    name: { op: 'like', value: 'ada' },
  },
});
// → { data: [...], total: N, page: 2, size: 25 }
```

## Documentation

Full docs at [github.com/bkmashiro/nest-faster-crud](https://github.com/bkmashiro/nest-faster-crud)

## Ecosystem

| Package | Description |
|---------|-------------|
| [`@faster-crud/core`](https://www.npmjs.com/package/@faster-crud/core) | Decorators and types |
| [`@faster-crud/nest`](https://www.npmjs.com/package/@faster-crud/nest) | NestJS controller factory |
| [`@faster-crud/typeorm`](https://www.npmjs.com/package/@faster-crud/typeorm) | TypeORM adapter |
| [`@faster-crud/prisma`](https://www.npmjs.com/package/@faster-crud/prisma) | Prisma adapter (this package) |
