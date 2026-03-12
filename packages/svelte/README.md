# @faster-crud/svelte

[![npm](https://img.shields.io/npm/v/@faster-crud/svelte?style=flat-square)](https://www.npmjs.com/package/@faster-crud/svelte)
[![npm downloads](https://img.shields.io/npm/dm/@faster-crud/svelte?style=flat-square)](https://www.npmjs.com/package/@faster-crud/svelte)
[![license](https://img.shields.io/npm/l/@faster-crud/svelte?style=flat-square)](https://github.com/bkmashiro/nest-faster-crud/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Svelte store for @faster-crud — reactive CRUD store.

## Install

```bash
npm install @faster-crud/core @faster-crud/svelte svelte
```

## Usage

```ts
<script>
import { createResourceStore } from '@faster-crud/svelte';
import { Post } from './post.entity';

const store = createResourceStore(Post, { baseUrl: '/api/posts' });
store.load();
</script>

{#each $store.data as post}
  <div>{post.title}</div>
{/each}
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
