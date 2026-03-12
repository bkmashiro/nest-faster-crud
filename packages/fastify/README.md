# @faster-crud/fastify

[![npm](https://img.shields.io/npm/v/@faster-crud/fastify?style=flat-square)](https://www.npmjs.com/package/@faster-crud/fastify)

Fastify adapter for @faster-crud — CRUD plugin for Fastify.

## Install

```bash
npm install @faster-crud/core @faster-crud/fastify fastify
```

## Usage

```ts
import Fastify from 'fastify';
import { crudPlugin } from '@faster-crud/fastify';
import { Post } from './post.entity';
import { postService } from './posts.service';

const app = Fastify();
await app.register(crudPlugin, { entity: Post, service: postService, prefix: '/posts' });
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
