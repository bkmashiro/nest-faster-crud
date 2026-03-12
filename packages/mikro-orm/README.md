# @faster-crud/mikro-orm

[![npm](https://img.shields.io/npm/v/@faster-crud/mikro-orm?style=flat-square)](https://www.npmjs.com/package/@faster-crud/mikro-orm)
[![npm downloads](https://img.shields.io/npm/dm/@faster-crud/mikro-orm?style=flat-square)](https://www.npmjs.com/package/@faster-crud/mikro-orm)
[![license](https://img.shields.io/npm/l/@faster-crud/mikro-orm?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

MikroORM adapter for @faster-crud.

## Install

```bash
npm install @faster-crud/core @faster-crud/mikro-orm @mikro-orm/core
```

## Usage

```ts
import { MikroOrmResourceService } from '@faster-crud/mikro-orm';
import { Post } from './post.entity';
import { EntityManager } from '@mikro-orm/core';

export class PostsService extends MikroOrmResourceService(Post) {
  constructor(em: EntityManager) {
    super(em);
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
