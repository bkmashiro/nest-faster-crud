# @faster-crud/hono

[![npm](https://img.shields.io/npm/v/@faster-crud/hono?style=flat-square)](https://www.npmjs.com/package/@faster-crud/hono)

Hono adapter for @faster-crud — lightweight CRUD routes for Hono.

## Install

```bash
npm install @faster-crud/core @faster-crud/hono hono
```

## Usage

```ts
import { Hono } from 'hono';
import { createCrudRouter } from '@faster-crud/hono';
import { Post } from './post.entity';
import { postService } from './posts.service';

const app = new Hono();
app.route('/posts', createCrudRouter(Post, postService));
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
