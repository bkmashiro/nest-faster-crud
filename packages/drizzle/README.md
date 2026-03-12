# @faster-crud/drizzle

[![npm](https://img.shields.io/npm/v/@faster-crud/drizzle?style=flat-square)](https://www.npmjs.com/package/@faster-crud/drizzle)
[![npm downloads](https://img.shields.io/npm/dm/@faster-crud/drizzle?style=flat-square)](https://www.npmjs.com/package/@faster-crud/drizzle)
[![license](https://img.shields.io/npm/l/@faster-crud/drizzle?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Drizzle ORM adapter for @faster-crud.

## Install

```bash
npm install @faster-crud/core @faster-crud/drizzle drizzle-orm
```

## Usage

```ts
import { DrizzleResourceService } from '@faster-crud/drizzle';
import { Post } from './post.entity';
import { posts } from './schema';

export class PostsService extends DrizzleResourceService(Post) {
  constructor(db: DrizzleDB) {
    super(db, posts);
  }
}
```

## Documentation

Full docs at [github.com/bkmashiro/nest-faster-crud](https://github.com/bkmashiro/nest-faster-crud)

## Ecosystem

| Package | Description |
|---------|-------------|
| [`@faster-crud/core`](https://www.npmjs.com/package/@faster-crud/core) | Decorators and types |
| [`@faster-crud/nest`](https://www.npmjs.com/package/@faster-crud/nest) | NestJS controller factory |
| [`@faster-crud/typeorm`](https://www.npmjs.com/package/@faster-crud/typeorm) | TypeORM adapter |
| [`@faster-crud/prisma`](https://www.npmjs.com/package/@faster-crud/prisma) | Prisma adapter |
