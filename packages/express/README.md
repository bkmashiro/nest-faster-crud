# @faster-crud/express

[![npm](https://img.shields.io/npm/v/@faster-crud/express?style=flat-square)](https://www.npmjs.com/package/@faster-crud/express)

Express adapter for @faster-crud — CRUD router for Express.

## Install

```bash
npm install @faster-crud/core @faster-crud/express express
```

## Usage

```ts
import express from 'express';
import { createCrudRouter } from '@faster-crud/express';
import { Post } from './post.entity';
import { postService } from './posts.service';

const app = express();
app.use('/posts', createCrudRouter(Post, postService));
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
