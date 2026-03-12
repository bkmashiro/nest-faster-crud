# @faster-crud/trpc

[![npm](https://img.shields.io/npm/v/@faster-crud/trpc?style=flat-square)](https://www.npmjs.com/package/@faster-crud/trpc)
[![npm downloads](https://img.shields.io/npm/dm/@faster-crud/trpc?style=flat-square)](https://www.npmjs.com/package/@faster-crud/trpc)
[![license](https://img.shields.io/npm/l/@faster-crud/trpc?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

tRPC router builder for @faster-crud — type-safe CRUD procedures.

## Install

```bash
npm install @faster-crud/core @faster-crud/trpc @trpc/server
```

## Usage

```ts
import { initTRPC } from '@trpc/server';
import { createCrudRouter } from '@faster-crud/trpc';
import { Post } from './post.entity';
import { postService } from './posts.service';

const t = initTRPC.create();
export const appRouter = t.router({
  posts: createCrudRouter(t, Post, postService),
});
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
