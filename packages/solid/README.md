# @faster-crud/solid

[![npm](https://img.shields.io/npm/v/@faster-crud/solid?style=flat-square)](https://www.npmjs.com/package/@faster-crud/solid)
[![npm downloads](https://img.shields.io/npm/dm/@faster-crud/solid?style=flat-square)](https://www.npmjs.com/package/@faster-crud/solid)
[![license](https://img.shields.io/npm/l/@faster-crud/solid?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

SolidJS resource for @faster-crud — reactive CRUD signal.

## Install

```bash
npm install @faster-crud/core @faster-crud/solid solid-js
```

## Usage

```ts
import { createCrudResource } from '@faster-crud/solid';
import { Post } from './post.entity';

function PostList() {
  const posts = createCrudResource(Post, { baseUrl: '/api/posts' });
  return <For each={posts.data}>{post => <div>{post.title}</div>}</For>;
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
